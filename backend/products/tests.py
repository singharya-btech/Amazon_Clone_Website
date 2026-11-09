from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from products.models import Category, Product, ProductImage, ProductVariant, Coupon


class ProductCatalogEnhancementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Electronics', slug='electronics')

        self.p1 = Product.objects.create(
            name='Wireless Headphones Pro',
            slug='wireless-headphones-pro',
            sku='AUD-WHP-001',
            category=self.category,
            price=120.00,
            stock=15,
            low_stock_threshold=5,
            rating=4.8,
            is_active=True,
            is_featured=True,
            specifications={'Battery': '40h', 'Weight': '210g'}
        )

        self.p2 = Product.objects.create(
            name='Budget Wired Earphones',
            slug='budget-wired-earphones',
            sku='AUD-BWE-002',
            category=self.category,
            price=20.00,
            stock=3,
            low_stock_threshold=5,
            rating=3.9,
            is_active=True,
            is_featured=False
        )

        self.p3_out_of_stock = Product.objects.create(
            name='Vintage Boombox',
            slug='vintage-boombox',
            sku='AUD-VBB-003',
            category=self.category,
            price=75.00,
            stock=0,
            low_stock_threshold=2,
            rating=4.2,
            is_active=True
        )

        # Images
        ProductImage.objects.create(product=self.p1, image_url='https://example.com/img1.jpg', order=1, is_primary=True)
        ProductImage.objects.create(product=self.p1, image_url='https://example.com/img2.jpg', order=2, is_primary=False)

        # Variants
        ProductVariant.objects.create(product=self.p1, name='Midnight Black', sku='AUD-WHP-BLK', color='Black', stock=10)
        ProductVariant.objects.create(product=self.p1, name='Lunar White', sku='AUD-WHP-WHT', color='White', stock=5, price_override=129.99)

        # Coupon
        Coupon.objects.create(code='SAVE15', discount_type='percent', discount_value=15.0, min_order_amount=50.0, is_active=True)

    def test_product_availability_status(self):
        self.assertEqual(self.p1.availability_status, 'in_stock')
        self.assertEqual(self.p2.availability_status, 'low_stock')
        self.assertEqual(self.p3_out_of_stock.availability_status, 'out_of_stock')
        self.assertFalse(self.p3_out_of_stock.is_available)

    def test_product_detail_includes_gallery_variants_and_sku(self):
        response = self.client.get(f'/api/products/{self.p1.slug}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sku'], 'AUD-WHP-001')
        self.assertEqual(len(response.data['gallery_images']), 2)
        self.assertEqual(len(response.data['variants']), 2)
        self.assertEqual(response.data['specifications']['Battery'], '40h')

    def test_sorting_by_price_ascending(self):
        response = self.client.get('/api/products/?sort=price_asc')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        prices = [p['price'] for p in results]
        self.assertEqual(prices, sorted(prices))

    def test_sorting_by_price_descending(self):
        response = self.client.get('/api/products/?sort=price_desc')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        prices = [p['price'] for p in results]
        self.assertEqual(prices, sorted(prices, reverse=True))

    def test_filtering_by_availability_in_stock(self):
        response = self.client.get('/api/products/?availability=in_stock')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for p in response.data['results']:
            self.assertGreater(p['stock'], 0)

    def test_filtering_by_availability_out_of_stock(self):
        response = self.client.get('/api/products/?availability=out_of_stock')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for p in response.data['results']:
            self.assertEqual(p['stock'], 0)

    def test_pagination_structure(self):
        response = self.client.get('/api/products/?page_size=2')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('total_pages', response.data)
        self.assertIn('current_page', response.data)
        self.assertEqual(len(response.data['results']), 2)

    def test_recently_viewed_products_endpoint(self):
        response = self.client.post('/api/products/recently-viewed/', {'ids': [self.p2.id, self.p1.id]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        # Should preserve requested viewing order
        self.assertEqual(response.data[0]['id'], self.p2.id)
        self.assertEqual(response.data[1]['id'], self.p1.id)

    def test_coupon_simulation_valid(self):
        payload = {'code': 'SAVE15', 'subtotal': 100.0}
        response = self.client.post('/api/coupons/validate/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        self.assertEqual(response.data['discount_amount'], 15.0)
        self.assertEqual(response.data['total_after_discount'], 85.0)

    def test_coupon_simulation_below_minimum(self):
        payload = {'code': 'SAVE15', 'subtotal': 30.0}
        response = self.client.post('/api/coupons/validate/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['valid'])
