from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from rest_framework import response, status
from unittest.mock import patch
from .models import User, Volunteer, VolunteerAvailability, VolunteerAbsence, VolunteerSchedule, Visit, Recognition, Skill, Language, VolunteeringPreference, Notification
from .utils import send_email
from datetime import date, time
import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile

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
            email='testvolunteer@vmstest.com',
            password='testpass123'
        )
        self.volunteer = Volunteer.objects.create(
            user=self.user,
            phone_number='650-000-0000',
            address='test address'
        )

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


class SendEmailAPITests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='admin',
            email='admin@vmstest.com',
            role=User.Role.ADMIN,
            is_active=True
        )
        # Recipient must be an existing User — serializer uses PrimaryKeyRelatedField
        self.recipient = User.objects.create_user(
            username='volunteer1',
            email='volunteer1@vmstest.com',
            role=User.Role.VOLUNTEER,
            is_active=True
        )
        self.client.force_authenticate(user=self.user)
        self.url = '/api/email/send/'

    # Should succeed when all fields are provided, and create a Notification record
    @patch('vms.utils._dump_email', return_value='/tmp/email_dumps/20260101_000000_abcd1234.eml')
    @patch('vms.utils.EmailMultiAlternatives')
    def test_send_email_success(self, mock_email, _mock_dump):
        mock_email.return_value.send.return_value = None
        response = self.client.post(self.url, {
            'recipient_id': self.recipient.pk,
            'subject': 'Shift Confirmed',
            'message': 'Your shift on Saturday at 10am has been confirmed.',
        }, format='json')
        print('Testing Email response:', response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Email sent successfully.')

        # Notification row must be created with correct fields
        self.assertEqual(Notification.objects.count(), 1)
        notif = Notification.objects.first()
        self.assertEqual(notif.recipient, self.recipient)
        self.assertEqual(notif.subject, 'Shift Confirmed')
        self.assertEqual(notif.dump_path, '/tmp/email_dumps/20260101_000000_abcd1234.eml')
        self.assertIsNotNone(notif.sender)
        self.assertIsNotNone(notif.date_sent)


    # Should fail when recipient_id does not match any User
    def test_send_email_invalid_recipient_id(self):
        response = self.client.post('/api/email/send/', {
            'recipient_id': 99999,
            'subject': 'Shift Confirmed',
            'message': 'Your shift has been confirmed.',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('recipient_id', response.data)


class NotificationTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='notif_admin',
            email='notif_admin@vmstest.com',
            role=User.Role.ADMIN,
            is_active=True
        )
        self.recipient = User.objects.create_user(
            username='notif_recipient',
            email='recipient@vmstest.com',
            role=User.Role.VOLUNTEER,
            is_active=True
        )
        self.client.force_authenticate(user=self.admin)
        self.url = '/api/email/send/'

    def test_notification_str(self):
        notif = Notification.objects.create(
            sender=self.admin,
            recipient=self.recipient,
            subject='Test Subject',
        )

        print('Testing Notification response:', notif.__str__())
        self.assertIn('Test Subject', str(notif))
        self.assertIn(str(self.recipient), str(notif))

    def test_notification_date_sent_auto_populated(self):
        notif = Notification.objects.create(
            sender=self.admin,
            recipient=self.recipient,
            subject='Auto Date Test',
        )
        self.assertIsNotNone(notif.date_sent)

#create test user and upload dummy profile picture
class ProfilePictureTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='pic_test_user',
            email='pictest@vmstest.com',
            role=User.Role.VOLUNTEER,
            is_active=True
        )
        self.client.force_authenticate(user=self.user)
    def generate_dummy_image(self):
        """Generates a simple 100x100 red JPEG image for testing."""
        file_obj = io.BytesIO()
        image = Image.new('RGB', (100, 100), color=(255, 0, 0))
        image.save(file_obj, 'JPEG')
        file_obj.seek(0)
        return SimpleUploadedFile(
            name='test_profile_pic.jpg',
            content=file_obj.read(),
            content_type='image/jpeg'
        )
    def test_upload_profile_picture(self):
        """Test uploading a profile picture via PATCH request."""
        image = self.generate_dummy_image()
        data = {
            'first_name': 'Pic',
            'profile_picture': image
        }
        
        response = self.client.patch(
            f'/api/users/{self.user.pk}/',
            data,
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the user object was updated in the DB
        self.user.refresh_from_db()
        self.assertTrue(bool(self.user.profile_picture))
        self.assertIn('test_profile_pic', self.user.profile_picture.name)
        
        # Verify the serializer includes the profile picture URL in the response
        self.assertIn('profile_picture', response.data)
        self.assertIsNotNone(response.data['profile_picture'])
    def test_remove_profile_picture(self):
        """Test removing a profile picture by sending an empty string."""
        # Setup: initially add an image
        self.user.profile_picture = self.generate_dummy_image()
        self.user.save()
        
        data = {
            'profile_picture': ''
        }
        
        response = self.client.patch(
            f'/api/users/{self.user.pk}/',
            data,
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.user.refresh_from_db()
        self.assertFalse(bool(self.user.profile_picture))
        self.assertIsNone(response.data['profile_picture'])