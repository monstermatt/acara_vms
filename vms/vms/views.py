from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
User = get_user_model()

# Create your views here.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# file data.json has sample like below for testing registration API:
# {"email": "user03@vms.com", "password": "Pass1234", "name": "User01", "role": "volun"}
# then:
# curl -X POST http://localhost:8000/api/register -H "Content-Type: application/json" -d '@data.json'
class RegisterView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name')
        role = request.data.get('role')

        print(f"Received registration data: email={email}, name={name}, role={role}")
        
        if not email or not password or not name or not role:
            return Response({'error': 'All fields are required'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'},
                            status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=email, email=email, password=password)
        user.first_name = name
        user.role = role
        user.save()

        # Assuming you have a profile model to store additional info like role
        # Profile.objects.create(user=user, role=role)

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    

# Authenticate user to login if registered
class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, username=email, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
# Exit application
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

# @login_required TODO: Uncomment after login is implemented
def add_user(request):
    pass

# Update name or role of a user
# Email should not be updateable since thats the identifying username
# A new email should be a new user #TODO Requirement to be confirmed
def update_user(request):
    pass

# TODO: Determine if this is needed
def remove_user(request):
    pass

# View role and name of a user
# def view_user(request):
#     pass


# Get sample JWT token for testing protected APIs
# then
# curl -X GET http://localhost:8000/api/view_user -H "Authorization: Bearer <your_token_here>" 
# Note: replace <your_token_here> with the 'access' token received from login or registration response
class ViewUser(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'email': user.email,
            'name': user.first_name,
            'role': user.role,
        })

# Add a volunteer to the system
# NOTE Frontend dev: please pass values for normalized fields as well.
# The API will separate out the fields and add into the relevant normnalized tables
def add_volunteer(request):

    pass

# Update one or more characteristics of a volunteer
def update_volunteer(request):
    pass

# Mark volunteer as inactive in the database
# NOTE for other APIs: Filter out inactive volunteers (consider them deleted)
def remove_volunteer(request):
    pass

# View details of a selected volunteer
def view_volunteer(request):
    pass

# View volunteer's schedule for given date
# NOTE UI developers: please pass current date when looking for today's apts
def view_volunteer_apt_by_date(request):
    pass

