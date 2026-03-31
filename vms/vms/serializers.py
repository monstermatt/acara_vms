from rest_framework import serializers
from .models import Volunteer, User, Skill, Recognition, Language,VolunteeringPreference
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Serializer for the User model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'role'] 

# NOTE: Serializers of many to many fields need to be created before referencing in Volunteer and other calling tables

# TODO Add role based permissions 

# Serializer for the Skill model
class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

# Serializer for the Recognition model
class RecognitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recognition
        fields = '__all__'
        
# Serializer for Volunteering preference model
class VolunteeringPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteeringPreference
        fields = '__all__'

# Serializer for Language model
class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = '__all__'


# Serializer for the Volunteer model
class VolunteerSerializer(serializers.ModelSerializer):
    user = UserSerializer()  # Nested serializer for the related User model
    skills = SkillSerializer(many=True, read_only=True)
    recognitions = RecognitionSerializer(many=True, read_only=True)
    preferences = VolunteeringPreferenceSerializer(many=True, read_only=True)
    languages = LanguageSerializer(many=True, read_only=True)

    class Meta:
        model = Volunteer
        fields = '__all__'


#Serializer for role based auth
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token
