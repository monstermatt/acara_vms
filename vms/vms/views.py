from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, UserSerializer, VolunteerSerializer, SkillSerializer, RecognitionSerializer, LanguageSerializer, VolunteeringPreferenceSerializer
from rest_framework import serializers, viewsets
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import json
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, render
from vms.models import User, Volunteer, VolunteerAbsence, VolunteerAvailability, Visit, VolunteeringPreference, VolunteerSchedule, Recognition, Skill, Language

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

    # NOTE create and update are overridden here due to the presence of many to many and through table/models

    def create(self, request):
        # Extract data of many to many relationship models into separate lists
        skills_data = request.data.pop('skils', [])
        recognition_data = request.data.pop('recognitions', [])
        preference_data = request.data.pop('preferences', [])
        language_data = request.data.pop('languages',[])

        serializer = self.get_serializer(data = request.data)
        if serializer.is_valid():
            volunteer = serializer.save()

            # Many to many fields
            if skills_data:
                volunteer.skills.set(skills_data)
            if recognition_data:
                volunteer.recognitions.set(recognition_data)
            if preference_data:
                volunteer.preferences.set(preference_data)
            if language_data:
                volunteer.languages.set(language_data)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, pk=None):

        # Since it's an update, first volunteer data is fetched
        volunteer = self.get_object()

        # Extract data of many to many relationship models into separate lists
        skills_data = request.data.pop('skils', [])
        recognition_data = request.data.pop('recognitions', [])
        preference_data = request.data.pop('preferences', [])
        language_data = request.data.pop('languages',[])


        serializer = self.get_serializer(volunteer, data = request.data)

        if serializer.is_valid():
            volunteer = serializer.save()

            # Many to many fields
            if skills_data:
                volunteer.skills.set(skills_data)
            if recognition_data:
                volunteer.recognitions.set(recognition_data)
            if preference_data:
                volunteer.preferences.set(preference_data)
            if language_data:
                volunteer.languages.set(language_data)

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)            