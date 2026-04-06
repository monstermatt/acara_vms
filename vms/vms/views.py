from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, UserSerializer, VolunteerSerializer, SkillSerializer, RecognitionSerializer, LanguageSerializer, VolunteeringPreferenceSerializer, VolunteerAbsenceSerializer, VolunteerScheduleSerializer, VisitSerializer, VolunteerAvailabilitySerializer, VolunteerAvailableSlotSerializer
from rest_framework import serializers, viewsets
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import json
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, render
from vms.models import User, Volunteer, VolunteerAbsence, VolunteerAvailability, Visit, VolunteeringPreference, VolunteerSchedule, Recognition, Skill, Language
from .utils import generate_visits, compute_available_slots_in_a_day
from rest_framework.decorators import action
from datetime import datetime

# Create your views here.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

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

    def update(self, request, pk=None):
        volunteer = self.get_object()

        # Extract data of many to many relationship models into separate lists
        data_copy = request.data.copy()
        skill_data, recognition_data, preference_data, language_data = self.extract_m2m(data_copy)

        serializer = self.get_serializer(volunteer, data = data_copy)
        
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
        serializer = self.get.serializer(data = request.data)
        if serializer.is_valid():
            schedule = serializer.save()
            # auto generate a visit from the schedule
            generate_visits(schedule)
            return Response(serializer.data, status = status.HTTP_201_CREATED)
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)