from rest_framework import serializers
from .models import Volunteer, User, Skill, Recognition, Language,VolunteeringPreference, VolunteerSchedule, VolunteerAbsence, VolunteerAvailability, Visit
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
    user = UserSerializer(read_only=True)  # Nested serializer for the related User model
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True  # accept user_id on POST/PUT
    )
    skills = SkillSerializer(many=True, read_only=True)
    recognitions = RecognitionSerializer(many=True, read_only=True)
    preferences = VolunteeringPreferenceSerializer(many=True, read_only=True)
    languages = LanguageSerializer(many=True, read_only=True)

    class Meta:
        model = Volunteer
        fields = '__all__'


# Serializer for role based auth
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token

# Serializer for volunteer schedule
class VolunteerScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerSchedule
        fields = '__all__'

    # Custom validation for schedule to check on availability
    def validate(self, data):
        volunteer = data.get('volunteer')
        dayofweek = data.get('dayofweek')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        # Check availability
        availability = VolunteerAvailability.objects.filter(
            volunteer = volunteer,
            dayofweek = dayofweek,
            start_time__lte=start_time,
            end_time__gte=end_time
        ).exists()

        if not availability:
            raise serializers.ValidationError("Volunteer not available on requested date/time")
        
        # Check for planned full day absence at requested date/time
        full_day_absence = VolunteerAbsence.objects.filter(
            volunteer = volunteer,
            start_date__lte=end_date,
            end_date__gte=start_date,
            start_time__isnull=True, # this should be null for full day absence
            end_time__isnull=True # this should be null for full day absence
        ).exists()

        # If full day absence returns data then volunteer is absent at requested date/time
        if full_day_absence:
            raise serializers.ValidationError("Volunteer has planned absence during requested date/time")
        
        # Check for partial day absence at requested date/time
        partial_absence = VolunteerAbsence.objects.filter(
            volunteer = volunteer,
            start_date__lte=end_date,
            end_date__gte=start_date,
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exists()

        # If partial absence returns data, then volunteer is absence durign requested time of the day
        if partial_absence:
            raise serializers.ValidationError("Volunteer absent during requested time window of the selected day")
        
        # Check for overlapping schedule at requested date/time
        overlapping_schedule = VolunteerSchedule.objects.filter(
            volunteer=volunteer,
            dayofweek=dayofweek,
            start_date__lte=end_date,
            end_date__gte=start_date,
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exists()
        if overlapping_schedule:
            raise serializers.ValidationError("Volunteer already has a schedule during this time")

        return data

# Serializer for VolunteerAbsence
class VolunteerAbsenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerAbsence
        fields = '__all__'

# Serializer for Availability
class VolunteerAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerAvailability
        fields = '__all__'

# Serializer for Visit
class VisitSerializer(serializers.ModelSerializer):
    volunteer = VolunteerSerializer(read_only = True)
    volunteer_id = serializers.PrimaryKeyRelatedField(
        queryset = Volunteer.objects.all(),
        source = 'volunteer',
        write_only = True
    )
    schedule = VolunteerSerializer(read_only = True)
    schedule_id = serializers.PrimaryKeyRelatedField(
        queryset = VolunteerSchedule.objects.all(),
        source = 'schedule',
        write_only = True,
        allow_null = True
    )
    class Meta:
        model = Visit
        fields = '__all__'

# Serializer for AvailabilitySlots
class VolunteerAvailableSlotSerializer(serializers.Serializer):
    dayofweek = serializers.CharField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    available_dates = serializers.ListField(child=serializers.DateField())