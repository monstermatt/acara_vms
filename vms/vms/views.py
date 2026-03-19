from django.shortcuts import render
from rest_framework_simplejwt.view import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer

# Create your views here.
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer