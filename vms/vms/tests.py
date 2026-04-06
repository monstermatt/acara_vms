from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from .models import User, Volunteer

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

    def test_create_volunteer(self):
        response = self.client.post('/api/volunteers/', {
            'user_id': self.vol.pk,
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
            'user_id': self.vol.pk,
            'phone_number': '111-111-1111',
            'address': 'test vol 1 address',
            'age_group': 'AGEGROUP1',
            'gender': 'M',
        })

        # list volunteers
        response = self.client.get('/api/volunteers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        

    def test_update_volunteer(self):
        # create a volunteer 
        volunteer = Volunteer.objects.create(
        user=self.vol,
        phone_number='111-111-1111',
        address='test address',
        age_group='AGEGROUP1',
        gender='M'
    )

        # update that volunteer
        response = self.client.put(f'/api/volunteers/{volunteer.pk}/', {
            'user_id': self.vol.pk,
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
        response = self.client.patch(f'/api/users/{self.vol.pk}/', {
            'is_active': False
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.get(pk=self.vol.pk).is_active)
    

    def test_reactivate_volunteer(self):
    
        # remove a volunteer by making a user of type volunteer as inactive
        response = self.client.patch(f'/api/users/{self.vol.pk}/', {
            'is_active': True
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(User.objects.get(pk=self.vol.pk).is_active)

    def test_create_availability(self):
        ...