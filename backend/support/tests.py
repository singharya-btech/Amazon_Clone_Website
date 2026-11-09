from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from support.models import CustomerQuery


class SupportTicketTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='customer_ticket', password='Password123!')
        self.client.force_authenticate(user=self.user)

    def test_create_support_ticket(self):
        payload = {
            'subject': 'Order Delivery Delay',
            'category': 'order',
            'message': 'My package has not arrived yet. Please assist.'
        }
        response = self.client.post('/api/support/tickets/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'open')
        self.assertEqual(response.data['subject'], 'Order Delivery Delay')

    def test_list_user_tickets(self):
        CustomerQuery.objects.create(
            customer_user_id=self.user.id,
            customer_name='customer_ticket',
            customer_email='ticket@example.com',
            subject='Product Inquiry',
            category='product',
            message='Is this available in black?'
        )
        response = self.client.get('/api/support/tickets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
