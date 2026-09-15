import logging
import os
import uuid
from datetime import timedelta
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.db import models
from django.utils import timezone
from .models import Visit, VolunteerAbsence, VolunteerAvailability, Notification

logger = logging.getLogger(__name__)


def _dump_email(sender: str, recipient: str, subject: str, message: str) -> str:
    """
    Write the email content to a .eml file under EMAIL_DUMP_PATH.

    Returns the absolute file path on success, or an empty string if
    EMAIL_DUMP_PATH is not configured or the write fails.
    """
    dump_dir = getattr(settings, 'EMAIL_DUMP_PATH', '').strip()
    if not dump_dir:
        return ''

    try:
        os.makedirs(dump_dir, exist_ok=True)
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{uuid.uuid4().hex[:8]}.eml"
        path = os.path.join(dump_dir, filename)

        content = (
            f"From: {sender}\r\n"
            f"To: {recipient}\r\n"
            f"Subject: {subject}\r\n"
            f"Date: {timezone.now().isoformat()}\r\n"
            f"\r\n"
            f"{message}"
        )
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(content)

        return path
    except Exception as exc:
        logger.error("Failed to dump email to disk | error: %s", exc)
        return ''


def send_email(sender, recipient, subject: str, message: str) -> bool:
    """
    Send an email from sender to recipient. Returns True on success, False on failure.

    On success the call also:
    - writes a .eml dump to EMAIL_DUMP_PATH
    - records sender, recipient, subject, date_sent, and dump_path
      in the Notification table

        sender: User instance (sender).
        recipient: User instance (recipient).
        subject:   Email subject line.
        message:   Email body.
    """
    sender_email = sender.email
    recipient_email = recipient.email

    msg = EmailMultiAlternatives(
        subject=subject,
        body=message,
        from_email=sender_email,
        to=[recipient_email],
    )
    try:
        msg.send()
        logger.info("Email sent from %s to %s | subject: %s", sender_email, recipient_email, subject)

        dump_path = _dump_email(
            sender=sender_email,
            recipient=recipient_email,
            subject=subject,
            message=message,
        )
        Notification.objects.create(
            sender=sender,
            recipient=recipient,
            subject=subject,
            dump_path=dump_path,
        )

        return True
    except Exception as exc:
        logger.error("Failed to send email from %s to %s | subject: %s | error: %s", sender_email, recipient_email, subject, exc)
        return False

def generate_visits(schedule, force=False):
    # day of week mapped  to a number
    day_map = {
        'MON' : 0,
        'TUE' : 1,
        'WED' : 2,
        'THU' : 3,
        'FRI' : 4,
        'SAT' : 5,
        'SUN' : 6
    }

    target_day = day_map[schedule.dayofweek]
    current_date = schedule.start_date
    visits = []

    # NOTE: Schedule is passed as a range
    while current_date <= schedule.end_date:
        # Checking if current day is same as day of week in schedule
        if current_date.weekday() == target_day:

            # Ensuring volunteer has availability usually — skip if force=True
            if not force:
                availability_exists = VolunteerAvailability.objects.filter(
                    volunteer = schedule.volunteer,
                    dayofweek = schedule.dayofweek,
                    start_time__lte = schedule.start_time,
                    end_time__gte = schedule.end_time
                ).exists()
                if not availability_exists:
                    current_date += timedelta(days = 1)
                    # don't process this date foe visit further
                    continue

            # Ensuring it doesn't conflict with planned absence
            absence_exists = VolunteerAbsence.objects.filter(
                volunteer = schedule.volunteer,
                start_date__lte = current_date,
                end_date__gte = current_date,
            ).filter(
                # full day absence
                models.Q(start_time__isnull =True) | 
                # partial day's absence
                models.Q(
                    start_time__lt = schedule.end_time,
                    end_time__gte = schedule.start_time
                )
                
            ).exists()

            if not absence_exists:
                visits.append(Visit(
                    schedule = schedule,
                    volunteer = schedule.volunteer,
                    visit_date = current_date,
                    visit_start_time = schedule.start_time,
                    visit_end_time = schedule.end_time,
                ))

        current_date += timedelta(days=1) # increment the current date in the loop

    # create visits from the visit list 
    Visit.objects.bulk_create(visits)

# Compute available slots on a selected day in the calendar

def compute_available_slots_in_a_day(volunteer, date, availabilities, absences, schedules, visits):

    # Initialize time slots for the selected day
    slots = []

    # If date matches a day of week volunteer is available
    if availabilities:
        availability = availabilities.first()

        # Check if there is planned absence at given time
        absence_exists = absences.filter(
            start_date__lte = date,
            end_date__gte = date,
        ).filter(
            models.Q(start_time__isnull=True) | 
            models.Q(start_time__lt=availability.end_time, 
            end_time__gt=availability.start_time
        )
        ).exists()

        # Check if volunteer is already scheduled at given time
        if not absence_exists:
            # Check for recurring schedule
            schedule_exists = schedules.filter(
                start_date__lte = date,
                end_date__gte = date,
                start_time__lt=availability.end_time, 
                end_time__gt=availability.start_time
            ).exists()
            
            # Check for single visit instances
            visit_exists = visits.filter(
                visit_date = date,
                visit_start_time__lt=availability.end_time, 
                visit_end_time__gt=availability.start_time
            ).exists()

            if not schedule_exists and not visit_exists:
                slots.append(
                    {
                        'dayofweek': availability.dayofweek,
                        'start_time':availability.start_time,
                        'end_time': availability.end_time,
                        'available_dates': [date]
                    }
                )

    return slots
    
    
    

