from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from products.models import Category, Product, ProductVariant
from cart.models import Cart


class CartEnhancementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Apparel', slug='apparel')
        self.product = Product.objects.create(
            name='Cotton Polo Shirt',
            slug='cotton-polo-shirt',
            sku='APP-POLO-001',
            category=self.category,
            price=35.00,
            stock=10,
            is_active=True
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            name='Size L - Navy',
            sku='APP-POLO-L-NVY',
            size='L',
            color='Navy',
            stock=3,
            price_override=38.00
        )

    def test_add_variant_to_cart(self):
        payload = {
            'product_id': self.product.id,
            'variant_id': self.variant.id,
            'quantity': 2
        }
        response = self.client.post('/api/cart/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_items'], 2)
        self.assertAlmostEqual(response.data['total_price'], 76.00)
        item = response.data['items'][0]
        self.assertEqual(item['variant_id'], self.variant.id)
        self.assertEqual(item['sku'], 'APP-POLO-L-NVY')

    def test_stock_management_prevents_overselling(self):
        # Variant only has 3 in stock, request 5
        payload = {
            'product_id': self.product.id,
            'variant_id': self.variant.id,
            'quantity': 5
        }
        response = self.client.post('/api/cart/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('exceeds available stock', response.data['error'])
