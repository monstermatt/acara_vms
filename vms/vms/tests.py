from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from .models import User, Volunteer, VolunteerAvailability, VolunteerAbsence, VolunteerSchedule, Visit, Recognition, Skill, Language, VolunteeringPreference

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