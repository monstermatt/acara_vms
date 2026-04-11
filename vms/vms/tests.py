from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from .models import User, Volunteer, VolunteerAvailability, VolunteerAbsence, VolunteerSchedule, Visit, Recognition, Skill, Language, VolunteeringPreference
from datetime import date, time

# Tests for the Volunteer APIs
# Tests emulate and bypass frontend code

# NOTE To run these tests, from the shell in the venv, run:
# python manage.py test vms (optionally include the class name as needed)
class UserAPITests(APITestCase):

    # Set up for tests
    def setUp(self):
        self.client = APIClient()

        # Adding add_user within setUp since all other tests will need a user
        self.user = User.objects.create_user(
            username ='admin',
            email = 'admin@vmstest.com',
            role = User.Role.ADMIN,
            is_active = True
        )
        self.client.force_authenticate(user=self.user)
    
    # Sanity test if user of type coordinator can be created
    def test_add_coordinator(self):
        response = self.client.post('/api/users/', {
            'username': 'user1',
            'email': 'user1@vmstest.com',
            'role': User.Role.COORDINATOR
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='user1').exists())

    # Sanity test if user of type volunteer can be created
    def test_add_volunteer(self):
        response = self.client.post('/api/users/', {
            'username': 'volunteer1',
            'email': 'volunteer1@vmstest.com',
            'role': User.Role.VOLUNTEER
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='volunteer1').exists())

    def test_view_user(self):
        response = self.client.get(f'/api/users/{self.user.pk}/')
        self.assertEqual(response.status_code, 200)

    def test_update_user(self):
        ...


class VolunteerAPITests(APITestCase):

    # Set up volunteer for tests
    def setUp(self):
        self.client = APIClient()

        # Adding add_user within setUp since all other tests will need a user
        self.adminuser = User.objects.create_user(
            username ='admin2',
            email = 'admin2@vmstest.com',
            role = User.Role.ADMIN,
            is_active = True
        )
        self.client.force_authenticate(user=self.adminuser)
        
        # Adding volunteer type within setUp for tests
        self.vol = User.objects.create_user(
            username ='testvolunteer',
            email = 'test_volunteer1@vmstest.com',
            role = User.Role.VOLUNTEER,
            is_active = True
        )

        # Adding volunteer type within setUp for other tests
        self.vol2 = User.objects.create_user(
            username ='testvolunteer2',
            email = 'test_volunteer2@vmstest.com',
            role = User.Role.VOLUNTEER,
            is_active = True
        )

        # Adding a test volunteer
        self.volunteer = Volunteer.objects.create(
            user=self.vol,
            phone_number='650-111-1111',
            address='test address',
            age_group='AGEGROUP1',
            gender='F'
        )

        # create availability
        self.availability = VolunteerAvailability.objects.create(
            volunteer=self.volunteer,
            dayofweek='MON',
            start_time='08:00:00',
            end_time='17:00:00'
        )

    def test_create_volunteer(self):
        response = self.client.post('/api/volunteers/', {
            'user_id': self.vol2.pk,
            'phone_number': '111-111-1111',
            'address': 'test vol 1 address',
            'age_group': 'AGEGROUP1',
            'gender': 'M',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Volunteer.objects.filter(user=self.vol).exists())

    def test_list_volunteers(self):
        # create a volunteer from the user created of volunteer type
        response = self.client.post('/api/volunteers/', {
            'user_id': self.vol2.pk,
            'phone_number': '111-111-1111',
            'address': 'test vol 1 address',
            'age_group': 'AGEGROUP1',
            'gender': 'M',
        })

        # list volunteers
        response = self.client.get('/api/volunteers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        

    def test_update_volunteer(self):
        # create a volunteer 
        volunteer = Volunteer.objects.create(
        user=self.vol2,
        phone_number='111-111-1111',
        address='test address',
        age_group='AGEGROUP1',
        gender='M'
    )

        # update that volunteer
        response = self.client.put(f'/api/volunteers/{volunteer.pk}/', {
            'user_id': self.vol2.pk,
            'phone_number': '222-222-2222', 
            'address': 'changed address',
            'age_group': 'AGEGROUP2',
            'gender': 'F'
        },format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Volunteer.objects.get(pk=volunteer.pk).phone_number, '222-222-2222')
        self.assertEqual(Volunteer.objects.get(pk=volunteer.pk).address, 'changed address')
        self.assertEqual(Volunteer.objects.get(pk=volunteer.pk).gender, 'F')
    
    def test_remove_volunteer(self):
    
        # remove a volunteer by making a user of type volunteer as inactive
        # NOTE patch is used here instead of PUT since not all fields of user are updated
        response = self.client.patch(f'/api/users/{self.vol2.pk}/', {
            'is_active': False
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.get(pk=self.vol2.pk).is_active)
    

    def test_reactivate_volunteer(self):
    
        # remove a volunteer by making a user of type volunteer as inactive
        response = self.client.patch(f'/api/users/{self.vol2.pk}/', {
            'is_active': True
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(User.objects.get(pk=self.vol2.pk).is_active)

    def test_create_availability(self):
        # create a volunteer 
        volunteer = Volunteer.objects.create(
        user=self.vol2,
        phone_number='111-111-1111',
        address='test address',
        age_group='AGEGROUP1',
        gender='M'
        )

        # add availability for volunteer
        response = self.client.post('/api/availability/', {
            'volunteer': volunteer.pk,
            'dayofweek': 'TUE',
            'start_time': '09:00:00',
            'end_time': '18:00:00',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_availability(self):
        # List for volunteer and availablity from setUp
        response = self.client.get('/api/availability/', {'volunteer': self.volunteer.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.availability.dayofweek, 'MON')

    def test_create_schedule(self):
        # Create schedule for volunteer created in setUo
        response = self.client.post('/api/schedules/', {
            'volunteer' : self.volunteer.pk,
            'start_date' : '2026-04-01',
            'end_date' :'2026-04-03',
            'dayofweek' : 'MON',
            'start_time' : '10:00:00',
            'end_time' : '14:00:00'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_absence(self):
        # Create absence for volunteer created in setUp
        response = self.client.post('/api/absences/',{
            'volunteer' : self.volunteer.pk,
            'start_date' : '2026-04-05',
            'end_date' :'2026-04-06',
            'start_time' : '10:00:00',
            'end_time' : '14:00:00'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_available_slots_in_a_day(self):
        # list available slots in a day for a volunteer created in setUp
        response = self.client.get(f'/api/volunteers/{self.volunteer.pk}/available-slots-in-a-day/?start_date=2026-05-01')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

# Tests to ensure Volunteer Schedule Serializer works with all checks passing
class VolunteerScheduleSerializerTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testvolunteer',
            password='testpass123'
        )
        self.volunteer = Volunteer.objects.create(user=self.user)

        self.availability = VolunteerAvailability.objects.create(
            volunteer=self.volunteer,
            dayofweek='MON',
            start_time=time(9, 0),
            end_time=time(17, 0)
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    #  test should succeed when booking visit within available hours
    def test_valid_schedule_within_availability(self):
        data = {
            'volunteer': self.volunteer.id,
            'dayofweek': 'MON',
            'start_time': '10:00:00',
            'end_time': '12:00:00',
            'start_date': '2026-05-01',
            'end_date': '2026-08-01',
        }
        response = self.client.post('/api/schedules/', data, format='json')
        print('valid schedule response:', response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # test should fail when booking visit outside available hours
    def test_schedule_outside_availability_fails(self):
        data = {
            'volunteer': self.volunteer.id,
            'dayofweek': 'MON',
            'start_time': '07:00:00', 
            'end_time': '09:00:00',
            'start_date': '2026-05-01',
            'end_date': '2026-08-01',
        }
        response = self.client.post('/api/schedules/', data, format='json')
        print('outside availability response:', response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # test should fail when booking visit on day a volunteer is unavailable
    def test_schedule_wrong_day_fails(self):
        data = {
            'volunteer': self.volunteer.id,
            'dayofweek': 'TUE', 
            'start_time': '10:00:00',
            'end_time': '12:00:00',
            'start_date': '2026-05-01',
            'end_date': '2026-08-01',
        }
        response = self.client.post('/api/schedules/', data, format='json')
        print('wrong day response:', response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # test should fail when booking overlaps an existing schedule
    def test_overlapping_schedule_fails(self):
        VolunteerSchedule.objects.create(
            volunteer=self.volunteer,
            dayofweek='MON',
            start_time=time(10, 0),
            end_time=time(12, 0),
            start_date=date(2026, 5, 1),
            end_date=date(2026, 8, 1),
        )
        data = {
            'volunteer': self.volunteer.id,
            'dayofweek': 'MON',
            'start_time': '11:00:00',
            'end_time': '13:00:00',
            'start_date': '2026-05-01',
            'end_date': '2026-08-01',
        }
        response = self.client.post('/api/schedules/', data, format='json')
        print('overlap response:', response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # test should succeed when booking visit does not overlap an existing schedule
    def test_non_overlapping_schedule_succeeds(self):
        VolunteerSchedule.objects.create(
            volunteer=self.volunteer,
            dayofweek='MON',
            start_time=time(10, 0),
            end_time=time(12, 0),
            start_date=date(2026, 5, 1),
            end_date=date(2026, 8, 1),
        )
        data = {
            'volunteer': self.volunteer.id,
            'dayofweek': 'MON',
            'start_time': '13:00:00',
            'end_time': '15:00:00',
            'start_date': '2026-05-01',
            'end_date': '2026-08-01',
        }
        response = self.client.post('/api/schedules/', data, format='json')
        print('non overlap response:', response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    #  test should fail when volunteer has a full day absence
    def test_schedule_during_full_day_absence_fails(self):
        VolunteerAbsence.objects.create(
            volunteer=self.volunteer,
            start_date=date(2026, 5, 1),
            end_date=date(2026, 8, 1),
            start_time=None, 
            end_time=None,     
        )

        data = {
            'volunteer': self.volunteer.id,
            'dayofweek': 'MON',
            'start_time': '10:00:00',
            'end_time': '12:00:00',
            'start_date': '2026-05-01',
            'end_date': '2026-08-01',
        }
        response = self.client.post('/api/schedules/', data, format='json')
        print('full day absence response:', response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # test should fail when volunteer has a partial absence which 
    # overlaps the requested time
    def test_schedule_during_partial_absence_fails(self):
        VolunteerAbsence.objects.create(
            volunteer=self.volunteer,
            start_date=date(2026, 5, 1),
            end_date=date(2026, 8, 1),
            start_time=time(9, 0),
            end_time=time(17, 0),
        )

        data = {
            'volunteer': self.volunteer.id,
            'dayofweek': 'MON',
            'start_time': '10:00:00',
            'end_time': '12:00:00',
            'start_date': '2026-05-01',
            'end_date': '2026-08-01',
        }
        response = self.client.post('/api/schedules/', data, format='json')
        print('partial absence response:', response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    #  test should succeed when schedule dates do not overlap absence dates
    def test_schedule_outside_absence_period_succeeds(self):
        VolunteerAbsence.objects.create(
            volunteer=self.volunteer,
            start_date=date(2026, 9, 1),    
            end_date=date(2026, 12, 1),
            start_time=time(9, 0),
            end_time=time(17, 0),
        )

        data = {
            'volunteer': self.volunteer.id,
            'dayofweek': 'MON',
            'start_time': '10:00:00',
            'end_time': '12:00:00',
            'start_date': '2026-05-01',
            'end_date': '2026-08-01',
        }
        response = self.client.post('/api/schedules/', data, format='json')
        print('outside absence period response:', response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)