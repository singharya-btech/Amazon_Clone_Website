from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient


class MultiRoleAuthAndHealthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['status'], 'healthy')
        self.assertEqual(response.json()['database'], 'healthy')

    def test_customer_registration(self):
        payload = {
            'username': 'shopper1',
            'email': 'shopper1@example.com',
            'password': 'Password123!',
            'password2': 'Password123!'
        }
        response = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)

    def test_admin_registration(self):
        payload = {
            'username': 'site_admin',
            'email': 'admin@example.com',
            'password': 'AdminPassword123!',
            'password2': 'AdminPassword123!'
        }
        response = self.client.post('/api/auth/admin/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['user']['is_staff'])
