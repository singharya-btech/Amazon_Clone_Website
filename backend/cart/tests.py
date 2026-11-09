from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from cart.models import Cart
from products.models import Product, Category


class CartAndMergeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='shopper', password='Password123!')
        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.product1 = Product.objects.create(
            name='Wireless Mouse',
            slug='wireless-mouse',
            category=self.category,
            price=25.0,
            stock=10,
            is_active=True
        )
        self.product2 = Product.objects.create(
            name='USB-C Hub',
            slug='usb-c-hub',
            category=self.category,
            price=45.0,
            stock=5,
            is_active=True
        )

    def test_add_to_cart_enforces_stock_limit(self):
        self.client.force_authenticate(user=self.user)

        # Attempt to add more than stock (15 > 10)
        res = self.client.post('/api/cart/', {'product_id': self.product1.id, 'quantity': 15}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Only 10 items available', res.data['error'])

        # Valid add
        valid_res = self.client.post('/api/cart/', {'product_id': self.product1.id, 'quantity': 3}, format='json')
        self.assertEqual(valid_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(valid_res.data['items']), 1)
        self.assertEqual(valid_res.data['items'][0]['quantity'], 3)

    def test_persistent_guest_cart_merging_after_login(self):
        self.client.force_authenticate(user=self.user)

        # Existing user DB cart has 2 of product1
        Cart.objects.create(
            user_id=self.user.id,
            user_username=self.user.username,
            items=[{
                'product_id': self.product1.id,
                'product_name': self.product1.name,
                'product_price': self.product1.price,
                'quantity': 2,
                'stock': self.product1.stock
            }]
        )

        # Guest cart items from client storage
        guest_payload = {
            'items': [
                {'product_id': self.product1.id, 'quantity': 3}, # Should add up to 5
                {'product_id': self.product2.id, 'quantity': 2}, # New item
            ]
        }

        res = self.client.post('/api/cart/merge/', guest_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        cart = Cart.objects.get(user_id=self.user.id)
        self.assertEqual(len(cart.items), 2)

        # Check product1 merged quantity is 5 (2 + 3)
        p1_item = next(item for item in cart.items if item['product_id'] == self.product1.id)
        self.assertEqual(p1_item['quantity'], 5)

        # Check product2 added quantity is 2
        p2_item = next(item for item in cart.items if item['product_id'] == self.product2.id)
        self.assertEqual(p2_item['quantity'], 2)
