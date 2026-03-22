from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, Volunteer

# Tests for the Volunteer APIs
# Tests emulate and bypass frontend code
class VolunteerAPITests(TestCase):

    # Set up for tests
    def SetUp(self):
        self.client = APIClient()
        ...
    
    def test_add_user(self):
        ...

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
    


