from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer

# Create your views here.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# Authenticate user to login if registered
def login_view(request):
    ...
    
# Exit application
def logout_view(request):
    ...

# Add a volunteer to the system
def add_volunteer(request):
    ...

# Update one or more characteristics of a volunteer
def update_volunteer(request):
    ...

# Mark volunteer as inactive in the database
# Note for other APIs: Filter out inactive volunteers (consider them deleted)
def remove_volunteer(request):
    ...

# View details of a selected volunteer
def view_volunteer(request):
    ...

# View volunteer's schedule for given date
# Note to UI developers: please pass current date when looking for today's apts
def view_volunteer_apt_by_date(request):
    ...

