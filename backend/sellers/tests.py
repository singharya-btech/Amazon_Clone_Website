from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from sellers.models import Seller, SellerPayout, PaymentTransaction, ShippingShipment, AuditLog
from products.models import Product, Category
from orders.models import Order


class SellerRoleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='admin_boss', email='admin@example.com', password='AdminPassword123!'
        )
        self.seller_user = User.objects.create_user(
            username='apex_seller@example.com', email='apex_seller@example.com', password='SellerPassword123!'
        )
        self.seller = Seller.objects.create(
            user_id=self.seller_user.id,
            business_name='Apex Gadgets',
            owner_name='Alex Apex',
            email='apex_seller@example.com',
            phone='18005550100',
            category_focus='Electronics',
            commission_rate=10.0,
            balance=5000.0,
            status='verified'
        )

    def test_seller_registration(self):
        payload = {
            'business_name': 'Quantum Retail',
            'owner_name': 'Quantum Q',
            'email': 'quantum@example.com',
            'phone': '9876543210',
            'password': 'StrongPassword123!',
            'password2': 'StrongPassword123!',
            'category_focus': 'Gadgets'
        }
        response = self.client.post('/api/sellers/register/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('seller', response.data)
        self.assertEqual(response.data['seller']['business_name'], 'Quantum Retail')
        self.assertEqual(response.data['seller']['status'], 'pending')
        self.assertIn('access', response.data)

    def test_seller_profile_retrieval(self):
        self.client.force_authenticate(user=self.seller_user)
        response = self.client.get('/api/sellers/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'verified')
        self.assertEqual(response.data['business_name'], 'Apex Gadgets')

    def test_bulk_csv_product_upload(self):
        self.client.force_authenticate(user=self.seller_user)
        csv_data = "name,price,stock,category,description\nSmart Band,2499,50,Wearables,Fitness tracker\nWireless Earbuds,3999,30,Audio,Noise cancelling"
        response = self.client.post('/api/sellers/me/products/bulk-csv/', {'csv_data': csv_data}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['created_count'], 2)
        self.assertTrue(Product.objects.filter(name='Smart Band', seller=self.seller).exists())
        self.assertTrue(Product.objects.filter(name='Wireless Earbuds', seller=self.seller).exists())

    def test_seller_order_listing_and_shipping(self):
        order = Order.objects.create(
            user_id=99,
            user_username='customer1',
            full_name='John Buyer',
            email='john@buyer.com',
            address='123 Market St',
            city='Bangalore',
            state='KA',
            zip_code='560001',
            status='pending',
            total=1999.0,
            items=[{
                'product_id': 1,
                'product_name': 'Smart Band',
                'product_price': 1999.0,
                'quantity': 1,
                'seller_id': self.seller.id,
                'item_status': 'pending'
            }]
        )
        self.client.force_authenticate(user=self.seller_user)
        # Check seller orders
        res_orders = self.client.get('/api/sellers/me/orders/')
        self.assertEqual(res_orders.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_orders.data), 1)

        # Dispatch order
        res_ship = self.client.post(f'/api/sellers/me/orders/{order.id}/ship/', {'carrier': 'BlueDart Express'}, format='json')
        self.assertEqual(res_ship.status_code, status.HTTP_200_OK)
        self.assertIn('tracking_number', res_ship.data)
        self.assertEqual(res_ship.data['carrier'], 'BlueDart Express')

        order.refresh_from_db()
        self.assertEqual(order.status, 'shipped')
        self.assertEqual(order.items[0]['item_status'], 'shipped')

    def test_seller_payout_lifecycle(self):
        self.client.force_authenticate(user=self.seller_user)
        # Request payout of 2000 from 5000 balance
        res_payout = self.client.post('/api/sellers/me/payouts/', {'amount': 2000.0, 'notes': 'Weekly withdrawal'}, format='json')
        self.assertEqual(res_payout.status_code, status.HTTP_201_CREATED)
        payout_id = res_payout.data['id']
        self.seller.refresh_from_db()
        self.assertEqual(self.seller.balance, 3000.0)

        # Admin processes payout
        self.client.force_authenticate(user=self.admin_user)
        res_process = self.client.post(f'/api/sellers/admin/payouts/{payout_id}/process/', {'action': 'process'}, format='json')
        self.assertEqual(res_process.status_code, status.HTTP_200_OK)
        payout = SellerPayout.objects.get(id=payout_id)
        self.assertEqual(payout.status, 'processed')

    def test_payment_sandbox_and_webhook(self):
        # Sandbox checkout simulation
        payload = {
            'order_id': 101,
            'amount': 2999.0,
            'payment_method': 'upi'
        }
        res_pay = self.client.post('/api/sellers/payments/sandbox-checkout/', payload, format='json')
        self.assertEqual(res_pay.status_code, status.HTTP_201_CREATED)
        txn_id = res_pay.data['transaction_id']
        webhook_sig = res_pay.data['webhook_signature']

        # Webhook signature verification
        res_webhook = self.client.post(
            '/api/sellers/payments/webhook/',
            {'transaction_id': txn_id, 'signature': webhook_sig},
            format='json'
        )
        self.assertEqual(res_webhook.status_code, status.HTTP_200_OK)
        self.assertEqual(res_webhook.data['status'], 'verified')

    def test_admin_marketplace_analytics_and_audit(self):
        self.client.force_authenticate(user=self.admin_user)
        res_analytics = self.client.get('/api/sellers/admin/analytics/')
        self.assertEqual(res_analytics.status_code, status.HTTP_200_OK)
        self.assertIn('total_gmv', res_analytics.data)
        self.assertIn('total_sellers', res_analytics.data)

        res_audit = self.client.get('/api/sellers/admin/audit-logs/')
        self.assertEqual(res_audit.status_code, status.HTTP_200_OK)
