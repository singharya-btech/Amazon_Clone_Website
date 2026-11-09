from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from cart.models import Cart
from products.models import Product, Category
from orders.models import Order, Coupon, OrderStatusHistory, ReturnRequest, Refund


class OrderLifecycleAndInventoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='buyer', password='BuyerPassword123!')
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name='Tech', slug='tech')
        self.product = Product.objects.create(
            name='Mechanical Gaming Keyboard',
            slug='mechanical-gaming-keyboard',
            category=self.category,
            price=100.0,
            stock=10,
            is_active=True
        )

        self.coupon = Coupon.objects.create(
            code='SAVE20',
            discount_type='percent',
            discount_value=20.0,
            min_order_amount=50.0,
            is_active=True
        )

    def test_coupon_validation_endpoint(self):
        # Valid coupon
        res = self.client.post('/api/orders/coupons/validate/', {'code': 'SAVE20', 'subtotal': 100.0}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['valid'])
        self.assertEqual(res.data['discount_amount'], 20.0)
        self.assertEqual(res.data['final_total'], 80.0)

        # Minimum order amount not met
        low_res = self.client.post('/api/orders/coupons/validate/', {'code': 'SAVE20', 'subtotal': 30.0}, format='json')
        self.assertEqual(low_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(low_res.data['valid'])

    def test_transaction_safe_order_placement_and_stock_deduction(self):
        # Place 4 items in user cart
        Cart.objects.create(
            user_id=self.user.id,
            user_username=self.user.username,
            items=[{
                'product_id': self.product.id,
                'product_name': self.product.name,
                'product_price': self.product.price,
                'quantity': 4
            }]
        )

        payload = {
            'full_name': 'Jane Buyer',
            'email': 'jane@example.com',
            'phone': '9876543210',
            'address': '123 Tech Street',
            'city': 'Bengaluru',
            'state': 'KA',
            'zip_code': '560001',
            'coupon_code': 'SAVE20',
            'payment_method': 'cod'
        }

        res = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'pending')
        # Subtotal: 400, 20% discount: 80, Total: 320
        self.assertEqual(res.data['subtotal'], 400.0)
        self.assertEqual(res.data['discount'], 80.0)
        self.assertEqual(res.data['total'], 320.0)

        # Inventory check: stock should be deducted from 10 to 6
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 6)

        # History check
        history = OrderStatusHistory.objects.filter(order_id=res.data['id'])
        self.assertTrue(history.exists())
        self.assertEqual(history.first().status, 'pending')

        # Cart should be empty
        cart = Cart.objects.get(user_id=self.user.id)
        self.assertEqual(len(cart.items), 0)

    def test_order_cancellation_restores_stock(self):
        # Create pending order
        order = Order.objects.create(
            user_id=self.user.id,
            user_username=self.user.username,
            full_name='Jane Buyer',
            email='jane@example.com',
            total=200.0,
            status='pending',
            items=[{
                'product_id': self.product.id,
                'product_name': self.product.name,
                'product_price': 100.0,
                'quantity': 3
            }]
        )
        self.product.stock = 7
        self.product.save()

        # Cancel order
        cancel_res = self.client.post(f"/api/orders/{order.id}/cancel/", {'reason': 'Changed my mind'}, format='json')
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_res.data['status'], 'cancelled')

        # Stock should be restored from 7 to 10
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)

        # Check history
        last_history = OrderStatusHistory.objects.filter(order=order).last()
        self.assertEqual(last_history.status, 'cancelled')
        self.assertIn('Changed my mind', last_history.comment)

    def test_return_request_workflow(self):
        order = Order.objects.create(
            user_id=self.user.id,
            user_username=self.user.username,
            full_name='Jane Buyer',
            email='jane@example.com',
            total=100.0,
            status='delivered',
            items=[{
                'product_id': self.product.id,
                'product_name': self.product.name,
                'product_price': 100.0,
                'quantity': 1
            }]
        )

        res = self.client.post(f"/api/orders/{order.id}/return/", {'reason': 'Defective switch'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['order']['status'], 'return_requested')

        return_req = ReturnRequest.objects.filter(order=order).first()
        self.assertIsNotNone(return_req)
        self.assertEqual(return_req.reason, 'Defective switch')

    def test_refund_workflow(self):
        order = Order.objects.create(
            user_id=self.user.id,
            user_username=self.user.username,
            full_name='Jane Buyer',
            email='jane@example.com',
            total=100.0,
            status='cancelled',
            items=[]
        )

        res = self.client.post(f"/api/orders/{order.id}/refund/", {'reason': 'Cancellation refund'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['order']['status'], 'refunded')
        self.assertEqual(res.data['order']['payment_status'], 'refunded')

        refund = Refund.objects.filter(order=order).first()
        self.assertIsNotNone(refund)
        self.assertEqual(refund.status, 'processed')

    def test_reorder_previous_purchase(self):
        order = Order.objects.create(
            user_id=self.user.id,
            user_username=self.user.username,
            full_name='Jane Buyer',
            email='jane@example.com',
            total=100.0,
            status='delivered',
            items=[{
                'product_id': self.product.id,
                'product_name': self.product.name,
                'product_price': 100.0,
                'quantity': 2
            }]
        )

        res = self.client.post(f"/api/orders/{order.id}/reorder/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('Added 1 items', res.data['message'])

        cart = Cart.objects.get(user_id=self.user.id)
        self.assertEqual(len(cart.items), 1)
        self.assertEqual(cart.items[0]['product_id'], self.product.id)

    def test_invoice_generation_endpoint(self):
        order = Order.objects.create(
            user_id=self.user.id,
            user_username=self.user.username,
            full_name='Jane Buyer',
            email='jane@example.com',
            phone='9876543210',
            address='123 Tech Street',
            city='Bengaluru',
            state='KA',
            zip_code='560001',
            total=100.0,
            subtotal=100.0,
            discount=0.0,
            status='delivered',
            items=[{
                'product_id': self.product.id,
                'product_name': self.product.name,
                'product_price': 100.0,
                'quantity': 1
            }]
        )

        res = self.client.get(f"/api/orders/{order.id}/invoice/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn(b'TAX INVOICE', res.content)
        self.assertIn(b'Mechanical Gaming Keyboard', res.content)
        self.assertIn(b'Jane Buyer', res.content)
