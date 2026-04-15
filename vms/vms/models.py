from django.contrib.auth.models import AbstractUser # To extend the default User model with custom fields
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
""" # User Embedding model
from pgvector.django import VectorField """

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

# Skills model to represent the types of skills
class Skill(models.Model):
    skill_name = models.CharField(max_length=100)

    def __str__(self):
        return self.skill_name  # Display the skill name
    
# Language model to represent languages
class Language(models.Model):
    language_name = models.CharField(max_length=100)

    def __str__(self):
        return self.language_name  # Display the language name
    

# Recognition model to represent the types of skills
class Recognition(models.Model):
    recognition_name = models.CharField(max_length=100)

    def __str__(self):
        return self.recognition_name  # Display the skill name

# Possible preferences of volunteering duties
class VolunteeringPreference(models.Model):
    preference = models.CharField(max_length=100)

    def __str__(self):
        return self.preference  # Display the duty name
    

# Volunteer model extending the default User model
class Volunteer(models.Model):

    # One-to-one relationship with the User model
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='volunteer_profile')

    # Many to many relationships
    skills = models.ManyToManyField(Skill, blank = True)
    recognitions = models.ManyToManyField(Recognition, blank=True)
    preferences = models.ManyToManyField(VolunteeringPreference, blank=True)
    languages = models.ManyToManyField(Language, blank=True)
    
    # Additional fields for volunteers
    phone_number = models.CharField(max_length=15, blank=False)
    address = models.TextField(blank=False)

    class AgeGroup(models.TextChoices):
        AGEGROUP1 = "AGEGROUP1", _("18-25")
        AGEGROUP2 = "AGEGROUP2", _("26-50")
        AGEGROUP3 = "AGEGROUP3", _("51 and above")
    
    age_group = models.CharField(
        max_length=9,
        choices = AgeGroup.choices,
        blank = True

    )
    max_distance_preferred = models.PositiveIntegerField(blank=True, null=True)  # Distance in miles
    sub_duty_preference = models.BooleanField(default=False)  # True if the volunteer prefers sub-duty, False otherwise
    last_monthly_training_attended = models.DateField(blank=True, null=True)
    performance_eval_date = models.DateField(blank=True, null=True)
    team=models.CharField(max_length=1, blank=True)  # Team the volunteer belongs to
    employed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Gender(models.TextChoices):
        MALE = "M", _("Male")
        FEMALE = "F", _("Female")
        OTHER = "O", _("Non binary/Other")
        
    gender = models.CharField(
        max_length=1,
        choices=Gender.choices,
        blank = True
    )

    def __str__(self):
        return self.user.username  # Display the username

# Model for day of week definition to be used across models
class DayOfWeek(models.TextChoices):
    MONDAY = "MON", _("Monday")
    TUESDAY = "TUE", _("Tuesday")
    WEDNESDAY = "WED", _("Wednesday")
    THURSDAY = "THU", _("Thursday")
    FRIDAY = "FRI", _("Friday")
    SATURDAY = "SAT", _("Saturday")
    SUNDAY = "SUN", _("Sunday")

# Model to represent volunteer availability
class VolunteerAvailability(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='availabilities')
    dayofweek = models.CharField(max_length=3, choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.volunteer.user} - {self.dayofweek} ({self.start_time} to {self.end_time})"  # Display the volunteer's username and availability details
    
# Model to represent volunteer's planned absences
class VolunteerAbsence(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='absences')
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.volunteer.user} - Absence from {self.start_date} to {self.end_date} ({self.start_time} to {self.end_time})"  # Display the volunteer's username and absence details
    
# Model to represent volunteer schedule
class VolunteerSchedule(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='schedules')
    start_date = models.DateField()
    end_date = models.DateField()
    dayofweek = models.CharField(max_length=3, choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.volunteer.user} - {self.dayofweek} ({self.start_time} to {self.end_time})"  # Display the volunteer's username and schedule details

# Model to represent a specific visit
# TODO write a transaction that creates or removes a visit based on schedule and absence
class Visit(models.Model):
    schedule = models.ForeignKey(VolunteerSchedule, on_delete=models.SET_NULL, null=True, blank=True)
    visit_date = models.DateField()
    visit_start_time = models.TimeField()
    visit_end_time = models.TimeField()
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='visits')
    charted = models.BooleanField(default=False) # Remains false till user updates that they finished charting
    visited = models.BooleanField(default=False) # Remains false till user updates that they did visit the patient
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
# Notification template model to represent the types of skills
class Template(models.Model):
    template_type = models.CharField(max_length=75)
    template_content = models.TextField()

    def __str__(self):
        return self.template_type # Display the template type

# Log of every email dispatched by the system
class Notification(models.Model):
    """ 
    * Sender: The email address of the sender. 
    In our case, it will be a no-reply email address like 
    "noreply@acara.com".
    * Recipient: The recipient_id is a foreign key to the User model, representing the recipient of the email.
        This allows us to easily query all notifications sent to a particular user and maintain a clear 
        relationship between notifications and users.
    * Subject: The subject is the subject line of the email.
    * Date Sent: The date_sent is a timestamp of when the email was sent.
    * Dump Path: The dump_path is a string that stores the path to the dumped .eml file, which contains the full content 
        of the email for record-keeping and debugging purposes.
    """
    sender = models.EmailField() 
    # email_to = models.EmailField()
    recipient_id = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    date_sent = models.DateTimeField(auto_now_add=True)
    # Path to the dumped .eml file — local filesystem today, S3-compatible later
    dump_path = models.CharField(max_length=1024, blank=True, default='')

    def __str__(self):
        return f"To: {self.recipient_id} | Subject: {self.subject} | Sent: {self.date_sent}"
    
""" # Model to represent volunteer embeddings for enhanced matching
class UserEmbedding(models.Model):
    volunteer = models.OneToOneField(Volunteer, on_delete=models.CASCADE, related_name='embedding')
    embedding = VectorField(dimensions=384)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Embedding for {self.volunteer}" """
