from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APIClient
from products.models import (
    Category,
    Product,
    SearchHistory,
    ProductQuestion,
    ProductAnswer,
    BackInStockNotification,
    FlashSale,
)


class AdvancedEcommerceProductsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='alex', password='AlexPassword123!')
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name='Laptops', slug='laptops')

        self.product1 = Product.objects.create(
            name='MacBook Pro 16 M3 Max',
            slug='macbook-pro-16-m3-max',
            category=self.category,
            brand='Apple',
            sku='APL-MBP-16',
            price=2499.0,
            stock=15,
            rating=4.9,
            num_reviews=120,
            specifications={'RAM': '36GB', 'Storage': '512GB SSD', 'Chip': 'M3 Max'},
            is_featured=True,
            is_active=True
        )

        self.product2 = Product.objects.create(
            name='Dell XPS 16 OLED',
            slug='dell-xps-16-oled',
            category=self.category,
            brand='Dell',
            sku='DEL-XPS-16',
            price=2199.0,
            stock=8,
            rating=4.6,
            num_reviews=85,
            specifications={'RAM': '32GB', 'Storage': '1TB SSD', 'Display': '4K OLED'},
            is_active=True
        )

        self.product3 = Product.objects.create(
            name='USB-C Multiport Adapter Hub',
            slug='usb-c-multiport-adapter-hub',
            category=self.category,
            brand='Anker',
            price=49.0,
            stock=50,
            rating=4.7,
            is_active=True
        )

    def test_product_comparison_endpoint(self):
        # Compare product1 and product2 side by side
        res = self.client.get(f'/api/v1/products/compare/?ids={self.product1.id},{self.product2.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 2)
        self.assertIn('RAM', res.data['specification_keys'])
        self.assertIn('Storage', res.data['specification_keys'])
        product_ids = [p['id'] for p in res.data['products']]
        self.assertIn(self.product1.id, product_ids)
        self.assertIn(self.product2.id, product_ids)

    def test_product_recommendation_engine(self):
        res = self.client.get(f'/api/v1/products/{self.product1.id}/recommendations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Should recommend product2 (same category, high rating)
        rec_ids = [p['id'] for p in res.data]
        self.assertIn(self.product2.id, rec_ids)
        self.assertNotIn(self.product1.id, rec_ids)

    def test_frequently_bought_together_bundle(self):
        res = self.client.get(f'/api/v1/products/{self.product1.id}/frequently-bought-together/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('bundle_items', res.data)
        self.assertGreater(len(res.data['bundle_items']), 1)
        self.assertIn('bundle_price', res.data)
        self.assertEqual(res.data['savings_percent'], 10)

    def test_search_autocomplete(self):
        res = self.client.get('/api/v1/products/autocomplete/?q=MacBook')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['query'], 'MacBook')
        self.assertTrue(len(res.data['products']) > 0)
        self.assertEqual(res.data['products'][0]['id'], self.product1.id)

    def test_search_history_management(self):
        # Log search query
        add_res = self.client.post('/api/v1/search/history/', {'query': 'wireless noise cancelling'}, format='json')
        self.assertEqual(add_res.status_code, status.HTTP_201_CREATED)

        # Retrieve history
        get_res = self.client.get('/api/v1/search/history/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data), 1)
        self.assertEqual(get_res.data[0]['query'], 'wireless noise cancelling')

        # Clear history
        del_res = self.client.delete('/api/v1/search/history/')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertEqual(SearchHistory.objects.filter(user_id=self.user.id).count(), 0)

    def test_product_questions_and_answers_flow(self):
        # Ask question
        q_payload = {'question_text': 'Does this laptop come with international warranty?'}
        q_res = self.client.post(f'/api/v1/products/{self.product1.id}/qa/questions/', q_payload, format='json')
        self.assertEqual(q_res.status_code, status.HTTP_201_CREATED)
        question_id = q_res.data['id']

        # Answer question
        ans_payload = {'answer_text': 'Yes, Apple provides standard 1-year global limited warranty.'}
        ans_res = self.client.post(f'/api/v1/products/qa/questions/{question_id}/answers/', ans_payload, format='json')
        self.assertEqual(ans_res.status_code, status.HTTP_201_CREATED)

        # List Q&A
        list_res = self.client.get(f'/api/v1/products/{self.product1.id}/qa/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)
        self.assertEqual(len(list_res.data[0]['answers']), 1)
        self.assertEqual(list_res.data[0]['answers'][0]['answer_text'], ans_payload['answer_text'])

    def test_back_in_stock_notification(self):
        payload = {'email': 'notify_me@example.com'}
        res = self.client.post(f'/api/v1/products/{self.product2.id}/notify-stock/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('notify', res.data['message'].lower())

        notif = BackInStockNotification.objects.filter(product=self.product2, email='notify_me@example.com').first()
        self.assertIsNotNone(notif)
        self.assertFalse(notif.is_notified)

    def test_flash_sales_active(self):
        flash_sale = FlashSale.objects.create(
            title='Mega Tech Tuesday',
            discount_percent=25.0,
            start_time=timezone.now() - timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=5),
            is_active=True
        )
        flash_sale.products.add(self.product1, self.product2)

        res = self.client.get('/api/v1/flash-sales/active/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(res.data) > 0)
        self.assertEqual(res.data[0]['title'], 'Mega Tech Tuesday')
        self.assertEqual(res.data[0]['discount_percent'], 25.0)
        self.assertTrue(res.data[0]['is_live'])
