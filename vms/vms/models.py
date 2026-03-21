from django.contrib.auth.models import AbstractUser # To extend the default User model with custom fields
from django.db import models
from django.utils.translation import gettext_lazy as _

# TODO : Add constraints across all tables as needed

# User model extending AbstractUser
class User(AbstractUser):
    # Default fields for reference:

    # username (inherited from AbstractUser)
    # password (inherited from AbstractUser)
    # first_name (inherited from AbstractUser)
    # last_name (inherited from AbstractUser)
    # is_staff (inherited from AbstractUser)
    # is_active (inherited from AbstractUser)
    # date_joined (inherited from AbstractUser)
    # email (inherited from AbstractUser)
    # is_superuser (inherited from AbstractUser)
    # last_login (inherited from AbstractUser)
    # groups (inherited from AbstractUser)
    # user_permissions (inherited from AbstractUser)

    #modifying abstractuser to expect email rather than username
    email = models.EmailField(_("email address"), unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ['username']

    class Role(models.TextChoices):
        VOLUNTEER = "VOLUN", _("Volunteer")
        ADMIN = "ADMIN", _("Admin")
        COORDINATOR = "COORD", _("Coordinator")

    role = models.CharField(
        max_length=5,
        choices=Role.choices,
        default=Role.VOLUNTEER
    )

    def __str__(self):
        return self.username  # Display the username

# Volunteer model extending the default User model
class Volunteer(models.Model):

    # One-to-one relationship with the User model
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='volunteer_profile')
    # Additional fields for volunteers
    phone_number = models.CharField(max_length=15, blank=False)
    address = models.TextField(blank=False)

    class AgeGroup(model.TextChoices):
        AGEGROUP1 = "AGEGROUO1", _("18-25")
        AGEGROUP2 = "AGEGROUP2", _("26-50")
        AGEGROUP3 = "AGEGROUP3", _("51 and above")
    
    age_group = models.CharField(
        max_length=8,
        choices = AgeGroup.choices

    )
    max_distance_preferred = models.PositiveIntegerField(blank=True, null=True)  # Distance in miles
    sub_duty_preference = models.BooleanField(default=False)  # True if the volunteer prefers sub-duty, False otherwise
    last_monthly_training_attended = models.DateField(blank=True, null=True)
    performance_eval_date = models.DateField(blank=True, null=True)
    team=models.CharField(max_length=1, blank=True)  # Team the volunteer belongs to
    employed = models.BooleanField
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Status(model.TextChoices):
        ACTIVE = "ACTIVE", _("Active")
        INACTIVE = "INACTIVE", _("Inactive")
        PENDING = "PENDING", _("Pending")
    
    status = models.CharField(
        max_length=8,
        choices = Status.choices

    )

    class Gender(models.TextChoices):
        MALE = "M", _("Male")
        FEMALE = "F", _("Female")
        OTHER = "O", _("Non binary/Other")
        
    gender = models.CharField(
        max_length=1,
        choices=Gender.choices
    )

    def __str__(self):
        return self.user  # Display the username



# Skills model to represent the types of skills
class Language(models.Model):
    language_id = models.AutoField(primary_key=True)
    language_name = models.CharField(max_length=100)

    def __str__(self):
        return self.language_name  # Display the skill name
    
# LanguageVolunteer model to represent the languages of volunteers
class VolunteerLanguage(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='languages')
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    class LanguageType(models.TextChoices):
        MALE = "NATIVE", _("Native")
        FEMALE = "SPOKEN", _("Spoken")
        
    language_type = models.CharField(
        max_length=6,
        choices=LanguageType.choices
    )

    def __str__(self):
        return f"{self.volunteer.user} - {self.language.language_name}"  # Display the volunteer's username and language name

# Skills model to represent the types of skills
class Skill(models.Model):
    skill_id = models.AutoField(primary_key=True)
    skill_name = models.CharField(max_length=100)

    def __str__(self):
        return self.skill_name  # Display the skill name
    
# Skils model to represent the skills of volunteers
class VolunteerSkill(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.volunteer.user} - {self.skill.skill_name}"  # Display the volunteer's username and skill name
    

# Recognition model to represent the types of skills
class Recognotion(models.Model):
    recognition_id = models.AutoField(primary_key=True)
    recognition_name = models.CharField(max_length=100)

    def __str__(self):
        return self.recognition_name  # Display the skill name
    
# Skils model to represent the skills of volunteers
class VolunteerRecognition(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='recognitions')
    recognition = models.ForeignKey(Skill, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.volunteer.user} - {self.recognition}"  # Display the volunteer's username and skill name

# Possible preferences of volunteering duties
class DutyPreference(models.Model):
    pref_id = models.AutoField(primary_key=True)
    duty_name = models.CharField(max_length=100)

    def __str__(self):
        return self.duty_name  # Display the duty name
    
# Model to represent the duty preferences of volunteers
class VolunteerDutyPreference(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='duty_preferences')
    duty_preference = models.ForeignKey(DutyPreference, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.volunteer.user} - {self.duty_preference.duty_name}"  # Display the volunteer's username and duty preference name
    
# Model to represent volunteer availability
class VolunteerAvailability(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='availabilities')
    class DayOfWeek(models.TextChoices):
        MONDAY = "MON", _("Monday")
        TUESDAY = "TUE", _("Tuesday")
        WEDNESDAY = "WED", _("Wednesday")
        THURSDAY = "THU", _("Thursday")
        FRIDAY = "FRI", _("Friday")
        SATURDAY = "SAT", _("Saturday")
        SUNDAY = "SUN", _("Sunday")
    dayofweek = models.CharField(
        max_length=3,
        choices=DayOfWeek.choices
    )
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.volunteer.user} - {self.dayofweek} ({self.start_time} to {self.end_time})"  # Display the volunteer's username and availability details
    
# Model to represent volunteer's planned absences
class VolunteerAbsence(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='absences')
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.volunteer.user} - Absence from {self.start_date} to {self.end_date} ({self.start_time} to {self.end_time})"  # Display the volunteer's username and absence details
    
# Model to represent volunteer schedule
class VolunteerSchedule(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='schedules')
    start_date = models.DateField()
    end_date = models.DateField()
    class DayOfWeek(models.TextChoices):
        MONDAY = "MON", _("Monday")
        TUESDAY = "TUE", _("Tuesday")
        WEDNESDAY = "WED", _("Wednesday")
        THURSDAY = "THU", _("Thursday")
        FRIDAY = "FRI", _("Friday") 
        SATURDAY = "SAT", _("Saturday")
        SUNDAY = "SUN", _("Sunday")
    dayofweek = models.CharField(
        max_length=3,
        choices=DayOfWeek.choices
    )
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.volunteer.user} - {self.dayofweek} ({self.start_time} to {self.end_time})"  # Display the volunteer's username and schedule details

# Model to represent a specific visit
# TODO write a transaction that creates or removes a visit based on schedule and absence
class Visit(models.Model):
    visit_id = models.AutoField(primary_key=True)
    visit_date = models.DateField()
    visit_start_time = models.TimeField()
    visit_end_time = models.TimeField()
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='visits')
    charted = models.BooleanField(default=False) # Remains false till user updates that they finished charting
    visited = models.BooleanField(default=False) # Remains false till user updates that they did visit the patient
    
# Notification template model to represent the types of skills
class Template(models.Model):
    template_id = models.AutoField(primary_key=True)
    template_type = models.CharField(max_length=75)
    template_content = models.TextField()

    def __str__(self):
        return self.template_type # Display the template type
    
