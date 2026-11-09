from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from wishlist.models import Wishlist


class WishlistTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='wishlist_user', password='Password123!')
        self.client.force_authenticate(user=self.user)

    def test_toggle_wishlist_add_and_remove(self):
        # Add to wishlist
        add_res = self.client.post('/api/wishlist/', {'product_id': 50, 'product_name': 'Smart Watch'}, format='json')
        self.assertEqual(add_res.status_code, status.HTTP_200_OK)
        self.assertEqual(add_res.data['action'], 'added')
        self.assertIn(50, add_res.data['wishlist']['product_ids'])

        # Remove from wishlist (second toggle)
        rem_res = self.client.post('/api/wishlist/', {'product_id': 50}, format='json')
        self.assertEqual(rem_res.status_code, status.HTTP_200_OK)
        self.assertEqual(rem_res.data['action'], 'removed')
        self.assertNotIn(50, rem_res.data['wishlist']['product_ids'])
