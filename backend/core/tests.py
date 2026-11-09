from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from core.models import Address, UserProfile, EmailVerificationToken, PasswordResetToken, Notification


class CoreAuthCustomerExperienceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_payload = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'SecurePassword123!',
            'password2': 'SecurePassword123!',
            'first_name': 'John',
            'last_name': 'Doe'
        }

    def test_health_check_endpoint(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertEqual(response.data['version'], '2.0.0')

    def test_user_registration_and_verification_token_dispatch(self):
        response = self.client.post('/api/auth/register/', self.register_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('verification_token', response.data)

        # Check EmailVerificationToken created
        user = User.objects.get(username='john_doe')
        token = EmailVerificationToken.objects.filter(user_id=user.id).first()
        self.assertIsNotNone(token)
        self.assertTrue(token.is_valid())

        # Check welcome notification
        notif = Notification.objects.filter(user_id=user.id).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.notification_type, 'account')

    def test_email_verification_success(self):
        user = User.objects.create_user(username='alice', email='alice@example.com', password='Password123!')
        profile = UserProfile.objects.create(user_id=user.id, username=user.username, email=user.email, email_verified=False)
        token = EmailVerificationToken.create_token(user_id=user.id, email=user.email)

        # Verify with token
        res = self.client.post('/api/auth/verify-email/', {'token': token.token}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])

        profile.refresh_from_db()
        self.assertTrue(profile.email_verified)

    def test_forgot_and_reset_password_workflow(self):
        user = User.objects.create_user(username='bob', email='bob@example.com', password='OldPassword123!')

        # 1. Forgot password request
        forgot_res = self.client.post('/api/auth/forgot-password/', {'email': 'bob@example.com'}, format='json')
        self.assertEqual(forgot_res.status_code, status.HTTP_200_OK)
        token_str = forgot_res.data['reset_token']

        # 2. Reset password using token
        reset_res = self.client.post('/api/auth/reset-password/', {
            'token': token_str,
            'new_password': 'BrandNewPassword456!'
        }, format='json')
        self.assertEqual(reset_res.status_code, status.HTTP_200_OK)
        self.assertTrue(reset_res.data['success'])

        # 3. Verify user can log in with new password
        login_res = self.client.post('/api/auth/login/', {
            'username': 'bob',
            'password': 'BrandNewPassword456!'
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_res.data)

    def test_change_password_authenticated(self):
        user = User.objects.create_user(username='clara', email='clara@example.com', password='ClaraPassword1!')
        self.client.force_authenticate(user=user)

        res = self.client.post('/api/auth/change-password/', {
            'old_password': 'ClaraPassword1!',
            'new_password': 'UpdatedPassword99!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.check_password('UpdatedPassword99!'))

    def test_user_profile_management(self):
        user = User.objects.create_user(username='david', email='david@example.com', password='Password123!')
        self.client.force_authenticate(user=user)

        # GET profile
        get_res = self.client.get('/api/auth/profile/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['username'], 'david')

        # PUT profile update
        update_res = self.client.put('/api/auth/profile/', {
            'first_name': 'David',
            'last_name': 'Beckham',
            'phone': '+91 9999888877',
            'avatar': 'https://example.com/avatar.jpg'
        }, format='json')
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data['first_name'], 'David')
        self.assertEqual(update_res.data['phone'], '+91 9999888877')

    def test_multiple_delivery_addresses_and_default_toggle(self):
        user = User.objects.create_user(username='emma', password='Password123!')
        self.client.force_authenticate(user=user)

        # 1. Create Home Address (Default)
        addr1 = self.client.post('/api/auth/addresses/', {
            'full_name': 'Emma Watson',
            'phone': '1234567890',
            'street_address': 'Flat 101, Rose Tower',
            'city': 'Mumbai',
            'state': 'MH',
            'postal_code': '400001',
            'address_type': 'home',
            'is_default': True
        }, format='json')
        self.assertEqual(addr1.status_code, status.HTTP_201_CREATED)
        self.assertTrue(addr1.data['is_default'])

        # 2. Create Office Address (New Default)
        addr2 = self.client.post('/api/auth/addresses/', {
            'full_name': 'Emma Watson Office',
            'phone': '9876543210',
            'street_address': 'Tech Park 4, BKC',
            'city': 'Mumbai',
            'state': 'MH',
            'postal_code': '400051',
            'address_type': 'work',
            'is_default': True
        }, format='json')
        self.assertEqual(addr2.status_code, status.HTTP_201_CREATED)
        self.assertTrue(addr2.data['is_default'])

        # Check that addr1 is no longer default
        first_addr = Address.objects.get(pk=addr1.data['id'])
        self.assertFalse(first_addr.is_default)

        # 3. Set addr1 back as default
        set_def_res = self.client.post(f"/api/auth/addresses/{addr1.data['id']}/set-default/")
        self.assertEqual(set_def_res.status_code, status.HTTP_200_OK)
        self.assertTrue(set_def_res.data['is_default'])

    def test_notification_centre(self):
        user = User.objects.create_user(username='fiona', password='Password123!')
        self.client.force_authenticate(user=user)

        n1 = Notification.objects.create(user_id=user.id, title='Order Shipped', message='Your package is on the way.')
        n2 = Notification.objects.create(user_id=user.id, title='Flash Sale', message='50% off today only.')

        # List notifications
        list_res = self.client.get('/api/notifications/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data['unread_count'], 2)

        # Mark single notification as read
        mark_res = self.client.post(f"/api/notifications/{n1.id}/mark-read/")
        self.assertEqual(mark_res.status_code, status.HTTP_200_OK)
        self.assertTrue(mark_res.data['is_read'])

        # Mark all read
        put_res = self.client.put('/api/notifications/')
        self.assertEqual(put_res.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(user_id=user.id, is_read=False).count(), 0)
