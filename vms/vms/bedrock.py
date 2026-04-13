import boto3
import json
from django.conf import settings

class BaseAIService:
    def rank_volunteers(self, request, volunteers):
        raise NotImplementedError

#* If a volunteer doesn't have a skill that is requested, state that they do not have that skill.
class BedrockProvider(BaseAIService):
    def __init__(self):
        self.client = boto3.client(
            service_name='bedrock-runtime',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.model_id = settings.BEDROCK_MODEL_ID

    def rank_volunteers(self, request, volunteers):
        # Keep data as clean JSON — no text formatting
        volunteer_matches = json.dumps([
            {
                "id": volunteer["id"],
                "skills": volunteer["skills"],
                "languages": volunteer["languages"],
                "preferences": volunteer["preferences"],
                "recognitions": volunteer["recognitions"],
                "age_group": volunteer["age_group"],
                "gender": volunteer["gender"],
                "team": volunteer["team"],
                "sub_duty": volunteer["sub_duty"],
                "max_distance_mi": volunteer["max_distance"],
                "availability": {
                    "regular": volunteer["regular_availability"],  # e.g. ["Monday 9am-12pm", "Friday 2pm-5pm"]
                    "upcoming_absences": volunteer["upcoming_absences"],  # e.g. ["2025-04-10", "2025-04-17"]
                    "scheduled_commitments": volunteer["scheduled_commitments"]  # e.g. [{"date": "2025-04-08", "time": "10am"}]
                }
            }
            for volunteer in volunteers
        ], default=str)

        prompt = f"""You are a volunteer matching assistant for a hospice organization.

You will recieve volunteers that have been determined via RAG to fit the request.
Your objective is to determine and rank the top 5 matches, with ranking based on how well a volunteer fits the request.

## Request
{json.dumps(request, default=str)}

## Volunteers
{volunteer_matches}

STRICT RULES:
- Only use information that is explicitly provided for each volunteer.
- Do not specify the volunteer id in your reasoning; start with "This volunteer" instead.
- Base the matching score only on what is explicitly stated in the request.
- If a distance is listed in the request:
    * Unless stated otherwise in the request, consider this the exact that a volunteer should be willing to travel.
    * Never assume the volunteer can travel further if their maximum distance is lower than that of the request.
- If a field says 'none listed' do not invent values for that field.
- Provide detailed reasoning for each volunteer's ranking:
    * Never add specific skills or attributes listed in a request to reasoning for a volunteer if they are not listed for a volunteer.
    * You may infer why a volunteer may fit the request if their 'skills' and/or 'recognitions' are related within hospice care.
    * If you do infer, highlight what your inference is based on (relevant "skills" and/or "recognitions") in your response.
    * Ensure all aspects of the request are covered in reasoning per volunteer.
- Consider the availability of a volunteer carefully:
    * Regardless of the request, ensure that your reasoning ends with specifically stating dates and times for all availability, absences, and scheduled commitments.
    * If the request mentions a day/time, check the `availability.regular` field for that exact day.
    * If the request date appears in `availability.upcoming_absences`, rank them lower and note the conflict.
    * If the request date/time overlaps with `availability.scheduled_commitments`, make a note of that conflict.
    * Dates in `upcoming_absences` and `scheduled_commitments` are exact ISO dates — do NOT infer or approximate.
    * If availability is not specified, assume the volunteer is not free on the unspecified day.

Return a JSON array of top 5 matches in this exact format, no other text:
[
  {{
    "rank": 1,
    "volunteer_id": 123,
    "match_score": 95,
    "reasoning": "explanation here which follows the conditions specified in STRICT RULES"
  }}
]"""

        print(prompt)
        # converse API for unified process across different Bedrock models
        response = self.client.converse(
            modelId=self.model_id,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            inferenceConfig={
                "temperature": 0,
                "maxTokens": 2000
            }
        )

        # simpler response parsing
        text = response['output']['message']['content'][0]['text'].strip()
        
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        try:
            ranked = json.loads(text)
        except json.JSONDecodeError as e:
            # Logging raw response to debug if model drifts from format
            print(f"Failed to parse response: {e}\nRaw response: {text}")
            ranked = []

        return ranked


# modular (can add more services if needed)
AI_Services = {
    'bedrock': BedrockProvider,
}

def retrieve_ai_service():
    service_name = getattr(settings, 'AI_SERVICE', 'bedrock')
    service_class = AI_Services.get(service_name)
    if not service_class:
        raise ValueError(f"Unknown AI service: {service_name}")
    return service_class()