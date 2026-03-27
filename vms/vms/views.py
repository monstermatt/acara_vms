from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import json
from django.http import Http404, HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, render
from vms.models import User, Volunteer, VolunteerSkill, VolunteerAbsence, VolunteerAvailability, Visit, VolunteerDutyPreference, VolunteerLanguage, VolunteerRecognition, VolunteerSchedule, Recognition, DutyPreference, Skill

# Create your views here.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# Authenticate user to login if registered
def login_view(request):
    ...
    
# Exit application
def logout_view(request):
    ...

# @login_required TODO: Uncomment after login is implemented
def add_user(request):

    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    else:
        # TODO Add skill and other many to many fields
        data = json.loads(request.body)
        email = data.get("email")
        username = data.get("username")
        first_name = data.get("first_name")
        last_name = data.get("last_name", "")
        role = data.get("role")
        is_staff = data.get("is_staff",False)
        is_active = data.get("is_active", True)

        user = User(
            email = email,
            username = username,
            first_name = first_name,
            last_name = last_name,
            role = role,
            is_staff = is_staff,
            is_active = is_active
                    )
        user.save()
    return JsonResponse({"message": "User saved successfully."}, status=201)


# Update name or role of a user
# Email should not be updateable since thats the identifying username
# A new email should be a new user #TODO Requirement to be confirmed
def update_user(request):
    ...

# TODO: Determine if this is needed
def remove_user(request):
    ...

# View role and name of a user
def view_user(request):
    ...

# Add a volunteer to the system
# NOTE Frontend dev: please pass values for normalized fields as well.
# The API will separate out the fields and add into the relevant normnalized tables
def add_volunteer(request):

    ...

# Update one or more characteristics of a volunteer
def update_volunteer(request):
    ...

# Mark volunteer as inactive in the database
# NOTE for other APIs: Filter out inactive volunteers (consider them deleted)
def remove_volunteer(request):
    ...

# View details of a selected volunteer
def view_volunteer(request):
    ...

# View volunteer's schedule for given date
# NOTE UI developers: please pass current date when looking for today's apts
def view_volunteer_apt_by_date(request):
    ...

