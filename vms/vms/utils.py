from datetime import timedelta
from django.db import models
from .models import Visit, VolunteerAbsence, VolunteerAvailability

def generate_visits(schedule):
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

            # Ensuring volunteer has availability usually
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
    
    
    

