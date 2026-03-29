from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.response import Response
from rest_framework import status
from .models import User, Volunteer

# Tests for the Volunteer APIs
# Tests emulate and bypass frontend code

# NOTE To run these tests, from the shell in the venv, run python manage.py test vms (optionally include the class name as needed)
class VolunteerAPITests(TestCase):

    # Set up for tests
    def SetUp(self):
        self.client = APIClient()

        # Adding add_user within setUp since all other tests will need a user
        self.user = User.objects.create_user(
            username ='admin',
            email = 'admin@vmstest.com',
            role = User.Role.ADMIN,
            is_active = True
        )
    
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
    def test_add_coordinator(self):
        response = self.client.post('/api/users/', {
            'username': 'volunteer1',
            'email': 'volunteer1@vmstest.com',
            'role': User.Role.VOLUNTEER
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='volunteer1').exists())

    def test_view_user(self):
        ...

    def test_update_user(self):
        ...

    def test_add_volunteet(self):
        ...

    def test_update_volunteer(self):
        ...
    
    def test_remove_volunteer(self):
        ...
    


