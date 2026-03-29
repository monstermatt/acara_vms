from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, UserSerializer, VolunteerSerializer
from rest_framework import routers, serializers, viewsets
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import json
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, render
from vms.models import User, Volunteer, VolunteerSkill, VolunteerAbsence, VolunteerAvailability, Visit, VolunteerDutyPreference, VolunteerLanguage, VolunteerRecognition, VolunteerSchedule, Recognition, DutyPreference, Skill

# Create your views here.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# NOTE To understand this better, please review documentation: https://www.django-rest-framework.org
# View behavior for User
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# View behavior for Volunteer
# TODO : This is work in progress.. please do not modify
class VolunteerViewSet(viewsets.ModelViewSet):
    ...