from datetime import date

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

from django.conf import settings
from pgvector.django import L2Distance

# Uncomment UserEmbedding once model and migrations are implemented
from .models import Volunteer, UserEmbedding
from .bedrock import retrieve_ai_service

# Setting path to model folder
MODEL_DIR = settings.BASE_DIR / 'model' 

# Loading tokenizer and model 
tokenizer = Tokenizer.from_file(str(MODEL_DIR / 'tokenizer.json'))
tokenizer.enable_truncation(max_length=256)
# Uncomment the following only after model is integrated into app
session = ort.InferenceSession(str(MODEL_DIR / 'model.onnx'))


def mean_pooling(token_embeddings, attention_mask):
    # averaging token vectors into a single embedding
    mask = attention_mask[..., np.newaxis].astype(np.float32)
    return (token_embeddings * mask).sum(axis=1) / mask.sum(axis=1)

def encode(text: str) -> list[float]:
    # Converting text to token ids
    encoded = tokenizer.encode(text)
    input_ids = np.array([encoded.ids], dtype=np.int64)
    attention_mask = np.array([encoded.attention_mask], dtype=np.int64)
    token_type_ids = np.zeros_like(input_ids)

    # Running ids through stored all-MiniLM-L6-v2 model
    outputs = session.run(None, {
        'input_ids': input_ids,
        'attention_mask': attention_mask,
        'token_type_ids': token_type_ids,
    })

    # applying mean pooling and normalizing
    embedding = mean_pooling(outputs[0], attention_mask)
    norm = np.linalg.norm(embedding, axis=1, keepdims=True)
    result = (embedding / np.maximum(norm, 1e-9))[0].tolist()

    return result


# helper function to retrieve all schedule related info for a volunteer
def retrieve_scheduling(volunteer):
    today = date.today()

    # regular weekly availability
    availabilities = volunteer.availabilities.all()
    availability_text = ', '.join([
        f"{availability.get_dayofweek_display()} {availability.start_time.strftime('%I:%M%p')}-{availability.end_time.strftime('%I:%M%p')}"
        for availability in availabilities
    ]) if availabilities else ''

    # upcoming absences
    absences = volunteer.absences.filter(end_date__gte=today)
    absence_text = ', '.join([
        f"unavailable {absence.start_date} to {absence.end_date}"
        for absence in absences
    ]) if absences else ''

    # scheduled commitments
    schedules = volunteer.schedules.filter(end_date__gte=today)
    schedule_text = ', '.join([
        f"{schedule.get_dayofweek_display()} {schedule.start_time.strftime('%I:%M%p')}-{schedule.end_time.strftime('%I:%M%p')} until {schedule.end_date}"
        for schedule in schedules
    ]) if schedules else ''

    return availability_text, absence_text, schedule_text

# helper function to create dictionary of non-sensitive matched volunteer data
def volunteer_dict(volunteer):
    availability_text, absence_text, schedule_text = retrieve_scheduling(volunteer)
    return {
        'id': volunteer.id,
        'skills': ', '.join([skill.skill_name for skill in volunteer.skills.all()]) or 'none listed',
        'languages': ', '.join([language.language_name for language in volunteer.languages.all()]) or 'none listed',
        'preferences': ', '.join([preference.preference for preference in volunteer.preferences.all()]) or 'none listed',
        'recognitions': ', '.join([recognition.recognition_name for recognition in volunteer.recognitions.all()]) or 'none listed',
        'age_group': volunteer.get_age_group_display(),
        'gender': volunteer.get_gender_display(),
        'team': volunteer.team or 'unassigned',
        'sub_duty': 'yes' if volunteer.sub_duty_preference else 'no',
        'max_distance': f"{volunteer.max_distance_preferred}mi maximum" if volunteer.max_distance_preferred else 'not specified',
        'regular_availability': availability_text or 'not specified',
        'upcoming_absences': absence_text or 'none',
        'scheduled_commitments': schedule_text or 'none',
    }


# Prepares a text profile of volunteer and scheduling data to be represented as an embedding
def compile_volunteer_text(user):
    text_profile = [] 

    try:
        volunteer = user.volunteer_profile

        skills = volunteer.skills.all()
        if skills:
            text_profile.append(f"Skills: {', '.join([skill.skill_name for skill in skills])}")

        recognitions = volunteer.recognitions.all()
        if recognitions:
            text_profile.append(f"Recognitions: {', '.join([recognition.recognition_name for recognition in recognitions])}")

        preferences = volunteer.preferences.all()
        if preferences:
            text_profile.append(f"Preferences: {', '.join([preference.preference for preference in preferences])}")

        languages = volunteer.languages.all()
        if languages:
            text_profile.append(f"Languages: {', '.join([language.language_name for language in languages])}")

        text_profile.append(f"Age group: {volunteer.get_age_group_display()}")
        text_profile.append(f"Gender: {volunteer.get_gender_display()}")
        text_profile.append(f"Team: {volunteer.team}")

        if volunteer.max_distance_preferred:
            text_profile.append(f"Max distance: {volunteer.max_distance_preferred}mi maximum")

        if volunteer.sub_duty_preference:
            text_profile.append("Available for substitute duty")

        if volunteer.last_monthly_training_attended:
            text_profile.append(f"Last training: {volunteer.last_monthly_training_attended}")

        availability_text, absence_text, schedule_text = retrieve_scheduling(volunteer)

        if availability_text:
            text_profile.append(f"Regular availability: {availability_text}")

        if absence_text:
            text_profile.append(f"Upcoming absences: {absence_text}")
        
        if schedule_text:
            text_profile.append(f"Scheduled commitments: {schedule_text}")

    except Volunteer.DoesNotExist:
        pass

    return " | ".join(text_profile)


# Creates an embedding of the volunteer text profile
def update_volunteer_embedding(user):
    text = compile_volunteer_text(user)
    if not text:
        return
    
    embedding = encode(text)
    #debug
    print(type(embedding), len(embedding), type(embedding[0]))

    volunteer=user.volunteer_profile
    UserEmbedding.objects.update_or_create(
        volunteer=volunteer,
        defaults={'embedding': embedding}
    )

# Rebuilds embeddings (based on user choice, creates/recreates embeddings for all volunteers 
# or just creates embeddings for volunteers that don't have embeddings yet
def rebuild_embeddings(rebuild_all=False, volunteer_ids=None):
    volunteers = Volunteer.objects.filter(
        id__in=volunteer_ids
    ).select_related('user') if volunteer_ids else Volunteer.objects.filter(
        user__isnull=False
    ).select_related('user')

    total = volunteers.count()
    success = skipped = failed = 0

    for volunteer in volunteers:
        try:
            if not rebuild_all and UserEmbedding.objects.filter(volunteer=volunteer).exists():
                skipped += 1
                continue

            update_volunteer_embedding(volunteer.user)
            success += 1

        except Exception as e:
            failed += 1
            print(f"Failed for volunteer {volunteer.id}: {e}")

    return {
        'total': total,
        'success': success,
        'failed': failed,
        'skipped': skipped
    }

# Matches and ranks the top 7 volunteers based on user request
def match_volunteers(request, top_n=7):

    # Creating embedding of user request
    request_embedding = encode(request)

    # Retreiving top 7 volunteers based on user request using RAG
    top_volunteer_embeddings = UserEmbedding.objects.select_related(
        'volunteer__user',
        'volunteer'
    ).order_by(L2Distance('embedding', request_embedding))[:top_n]

    # Collecting actual (non-sensitive) data for top 7 volunteers
    volunteer_data = [volunteer_dict(volunteer_embedding.volunteer) for volunteer_embedding in top_volunteer_embeddings]

    # Ranking top 7 volunteers with AI Reasoning
    ai_service = retrieve_ai_service()
    ranked_volunteers = ai_service.rank_volunteers(request, volunteer_data)

    # Enriching and displaying results with volunteer name, email, and phone now included
    results = []
    for match in ranked_volunteers:
        try:
            volunteer = Volunteer.objects.select_related('user').get(id=match['volunteer_id'])

            results.append({
                'rank': match['rank'],
                'match_score': match['match_score'],
                'reasoning': match['reasoning'],
                'volunteer_id': volunteer.id,
                'name': f"{volunteer.user.first_name} {volunteer.user.last_name}",
                'email': volunteer.user.email,
                'phone': volunteer.phone_number,
            })
        
        except Volunteer.DoesNotExist:
            continue

    return results
