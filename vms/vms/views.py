from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, UserSerializer, VolunteerSerializer, SkillSerializer, RecognitionSerializer, LanguageSerializer, VolunteeringPreferenceSerializer, VolunteerAbsenceSerializer, VolunteerScheduleSerializer, VisitSerializer, VolunteerAvailabilitySerializer, VolunteerAvailableSlotSerializer, SendEmailSerializer, TemplateSerializer
from rest_framework import serializers, viewsets
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import json
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, render
from vms.models import User, Volunteer, VolunteerAbsence, VolunteerAvailability, Visit, VolunteeringPreference, VolunteerSchedule, Recognition, Skill, Language, Template, MessageHistory
from .utils import generate_visits, compute_available_slots_in_a_day, send_email
from rest_framework.decorators import action
from datetime import datetime
#for email verification and password reset
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth import get_user_model
#AI MATCHING
from .embed import match_volunteers, rebuild_embeddings
from django.http import StreamingHttpResponse
#SMS twilio
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from twilio.rest import Client
from django.conf import settings
import logging

# Create your views here.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    permission_classes = [AllowAny]

# NOTE To understand this better, please review documentation: https://www.django-rest-framework.org
# View for User
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# View for Skill
class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer

# View for Recognition
class RecognitionViewSet(viewsets.ModelViewSet):
    queryset = Recognition.objects.all()
    serializer_class = RecognitionSerializer

# View for Volunteering preference
class PreferenceViewSet(viewsets.ModelViewSet):
    queryset = VolunteeringPreference.objects.all()
    serializer_class = VolunteeringPreferenceSerializer

# View for Languages
class LanguageViewSet(viewsets.ModelViewSet):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer

# View for Volunteer
class VolunteerViewSet(viewsets.ModelViewSet):
    queryset = Volunteer.objects.all()
    serializer_class = VolunteerSerializer
    
    # NOTE: This action/URL helps front end access volunteer's availability directly instead of adding logic in the front end to filter against multiple sheduling and availability related models

    # NOTE to front end developers or API consumers: 
    # Use this syntax to call this API to find a volunteer's availability:
    # GET /api/volunteers/1/available-slots_in_a_day/?start_date=2026-04-01

    @action(detail=True, methods=['get'], url_path='available-slots-in-a-day')
    def available_slots_in_a_day(self, request, pk=None):
        volunteer = self.get_object()

        date = request.query_params.get('start_date', None)
         # Convert provided date into Python date format
        date = datetime.strptime(date,'%Y-%m-%d').date()

        # Availability model stores day as MON, TUE etc. 
        # Converting date.weekday here to match how its stored

        day_map_reverse = {
            0 : 'MON',
            1 : 'TUE',
            2 : 'WED',
            3 : 'THU',
            4 : 'FRI',
            5 : 'SAT',
            6 : 'SUN'
                }
        day_of_week = day_map_reverse[date.weekday()]

        # Get availabilities for this volunteer for specified day
        availabilities = VolunteerAvailability.objects.filter(volunteer =volunteer, dayofweek = day_of_week)

        # Get absences planned for this volunteer
        absences = VolunteerAbsence.objects.filter(volunteer=volunteer)

        # Get schedules planned for this volunteer
        schedules = VolunteerSchedule.objects.filter(volunteer=volunteer)

        # Get visits planned for this volunteer
        visits = Visit.objects.filter(volunteer=volunteer)

        slots = compute_available_slots_in_a_day(volunteer, date, availabilities, absences, schedules, visits)
        serializer = VolunteerAvailableSlotSerializer(slots, many = True)
        return Response(serializer.data)

    # Helper methods
    def extract_m2m(self, data):
        return (
            data.pop('skills', []),
            data.pop('recognitions',[]),
            data.pop('preferences',[]),
            data.pop('languages',[])
        )

    def set_m2m(self, volunteer, skill_data, recognition_data, preference_data, language_data):
        
            # Many to many fields
            if skill_data:
                volunteer.skills.set(skill_data)
            if recognition_data:
                volunteer.recognitions.set(recognition_data)
            if preference_data:
                volunteer.preferences.set(preference_data)
            if language_data:
                volunteer.languages.set(language_data)
        

    # NOTE create and update are overridden here due to the presence of many to many and through table/models
    def create(self, request):
        # Extract data of many to many relationship models into separate lists
        data_copy = request.data.copy()
        skill_data, recognition_data, preference_data, language_data = self.extract_m2m(data_copy)

        serializer = self.get_serializer(data = data_copy)
        
        if serializer.is_valid():
            volunteer = serializer.save()
            self.set_m2m(volunteer, skill_data, recognition_data, preference_data, language_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None, **kwargs):

        partial = kwargs.pop('partial', False)
        volunteer = self.get_object()

        # Extract data of many to many relationship models into separate lists
        data_copy = request.data.copy()
        skill_data, recognition_data, preference_data, language_data = self.extract_m2m(data_copy)

        serializer = self.get_serializer(volunteer, data = data_copy, partial=partial)
        
        if serializer.is_valid():
            volunteer = serializer.save()
            self.set_m2m(volunteer, skill_data, recognition_data, preference_data, language_data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# View for planned absences
class VolunteerAbsenceViewSet(viewsets.ModelViewSet):
    queryset = VolunteerAbsence.objects.all()
    serializer_class = VolunteerAbsenceSerializer

# View for Visit
class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer
    # TODO nice to have: customize volunteer and visit_date create code 

# View for Availability
class VolunteerAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = VolunteerAvailability.objects.all()
    serializer_class = VolunteerAvailabilitySerializer

# View for VolunteerSchedule
class VolunteerScheduleViewSet(viewsets.ModelViewSet):
    queryset = VolunteerSchedule.objects.all()
    serializer_class = VolunteerScheduleSerializer
    
    # Override create to generate a visit for every schedule created
    def create(self, request):
        serializer = self.get_serializer(data = request.data)
        if serializer.is_valid():
            schedule = serializer.save()
            # auto generate a visit from the schedule
            generate_visits(schedule)
            return Response(serializer.data, status = status.HTTP_201_CREATED)
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
    
User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        # Generate the stateless token and encode the user ID
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # Return these to Nextjs, do NOT send the email from Django
        return Response({'uid': uid, 'token': token}, status=200)
    except User.DoesNotExist:
        # Return 200 anyway to prevent email enumeration attacks
        return Response({'message': 'If the email exists, a token was generated.'}, status=200)
    
@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    uidb64 = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('password')

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successful.'}, status=200)
    else:
        return Response({'error': 'Invalid or expired token.'}, status=400)

# View for AI Matching feature
class MatchingBetaViewSet(viewsets.ViewSet):

    @action(detail=False, methods=['post'], url_path='match-volunteers')
    def match_volunteers(self, request):
        user_request = request.data.get('request')

        if not user_request:
            return Response ({'error': 'User request is required'}, status=400)
        
        # Attempting to stream responses for UI flow
        def stream_matches():
            try: 
                results = match_volunteers(user_request)
                for match in results:
                    yield f"data: {json.dumps({'match': match})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingHttpResponse(
            stream_matches(),
            content_type='text/event-stream'
        )

    @action(detail=False, methods=['post'], url_path='rebuild-embeddings')
    def rebuild_options(self, request): 
        rebuild_all = request.data.get('rebuild_all', False) 
        volunteer_ids = request.data.get('volunteer_ids', None)
        try:
            results = rebuild_embeddings(rebuild_all=rebuild_all, volunteer_ids=volunteer_ids)
            return Response({
                'message': 'Embeddings rebuilt successfully',
                'total': results['total'],
                'success': results['success'],
                'failed': results['failed'],
                'skipped': results['skipped']
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# View for sending email
class SendEmailViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='send')
    def send(self, request):
        serializer = SendEmailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            success = send_email(
                sender=request.user,
                recipient=data['recipient_id'],
                subject=data['subject'],
                message=data['message'],
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if success:
            return Response({'detail': 'Email sent successfully.'}, status=status.HTTP_200_OK)
        return Response({'error': 'Failed to send email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
   # View for the Message Template model (message templates in menu item "Settings)
class TemplateViewSet(viewsets.ModelViewSet):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer 

#SMS routing & views
class SendSMS(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        volunteer_id = request.data.get('volunteer_id')
        message_body = request.data.get('message')
        if not volunteer_id or not message_body:
            return Response({'error': 'volunteer_id and message are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            volunteer = Volunteer.objects.get(id=volunteer_id)
        except Volunteer.DoesNotExist:
            return Response({'error': 'Volunteer not found'}, status=status.HTTP_404_NOT_FOUND)
        if not volunteer.phone_number:
            return Response({'error': 'Volunteer does not have a phone number'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=message_body,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=volunteer.phone_number
            )
            # Log history
            MessageHistory.objects.create(
                sender=request.user,
                recipient=volunteer,
                phone_number=volunteer.phone_number,
                message_body=message_body,
                status=message.status
            )
            return Response({'success': True, 'message_sid': message.sid}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error sending SMS: {str(e)}")
            MessageHistory.objects.create(
                sender=request.user,
                recipient=volunteer,
                phone_number=volunteer.phone_number,
                message_body=message_body,
                status='failed'
            )
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)