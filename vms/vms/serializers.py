from rest_framework import serializers
from .models import Volunteer, User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Serializer for the User model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role'] 
        
# Serializer for the Volunteer model
class VolunteerSerializer(serializers.ModelSerializer):
    user = UserSerializer()  # Nested serializer for the related User model

    class Meta:
        model = Volunteer
        fields = ['id', 'user', 'phone_number', 'address', 'age_group', 'max_distance_preferred', 
                  'sub_duty_preference', 'last_monthly_training_attended', 'performance_eval_date', 'team'] 

#Serializer for role based auth
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token