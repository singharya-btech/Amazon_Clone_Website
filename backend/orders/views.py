import uuid
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order, OrderStatusHistory, ReturnRequest, Refund, Coupon
from .serializers import (
    OrderSerializer,
    CreateOrderSerializer,
    ReturnRequestSerializer,
    RefundSerializer,
    CouponSerializer,
)
from cart.models import Cart
from products.models import Product
from core.models import Notification
from core.services.email_service import (
    send_order_notification_email,
)


class OrderListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user_id=request.user.id).prefetch_related('history', 'return_requests', 'refunds')
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        cart = Cart.objects.filter(user_id=request.user.id).first()
        if not cart or not cart.items:
            return Response(
                {'error': 'Cart is empty. Add products before placing an order.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Transaction-safe order placement and inventory reservation
        try:
            with transaction.atomic():
                subtotal = 0.0
                order_items = []

                # Verify and lock each product row to prevent race conditions
                for item in cart.items:
                    product_id = item.get('product_id')
                    quantity = int(item.get('quantity') or 1)
                    if quantity <= 0:
                        continue

                    # Select for update guarantees concurrency safety
                    product = Product.objects.select_for_update().filter(pk=product_id, is_active=True).first()
                    if not product:
                        return Response(
                            {'error': f"Product '{item.get('product_name', product_id)}' no longer exists."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if product.stock < quantity:
                        return Response(
                            {'error': f"Insufficient stock for '{product.name}'. Only {product.stock} available."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Deduct stock safely
                    product.stock -= quantity
                    product.save(update_fields=['stock'])

                    item_total = float(product.price) * quantity
                    subtotal += item_total

                    order_items.append({
                        'product_id': product.id,
                        'product_name': product.name,
                        'product_price': float(product.price),
                        'product_image': product.image,
                        'quantity': quantity,
                        'subtotal': round(item_total, 2)
                    })

                # Coupon validation and discount application
                discount_amount = 0.0
                coupon_code = validated_data.get('coupon_code', '').strip().upper()
                if coupon_code:
                    coupon = Coupon.objects.filter(code=coupon_code, is_active=True).first()
                    if coupon:
                        valid, _ = coupon.is_valid(subtotal)
                        if valid:
                            discount_amount = coupon.calculate_discount(subtotal)
                            coupon.times_used += 1
                            coupon.save(update_fields=['times_used'])

                shipping_cost = 0.0
                final_total = max(0.0, round(subtotal - discount_amount + shipping_cost, 2))

                # Create Order record
                order = Order.objects.create(
                    user_id=request.user.id,
                    user_username=request.user.username,
                    full_name=validated_data['full_name'],
                    email=validated_data['email'],
                    phone=validated_data.get('phone', ''),
                    address=validated_data['address'],
                    city=validated_data['city'],
                    state=validated_data['state'],
                    zip_code=validated_data['zip_code'],
                    country=validated_data.get('country', 'India'),
                    status='pending',
                    items=order_items,
                    subtotal=round(subtotal, 2),
                    discount=round(discount_amount, 2),
                    coupon_code=coupon_code if discount_amount > 0 else '',
                    shipping_cost=shipping_cost,
                    total=final_total,
                    payment_method=validated_data.get('payment_method', 'cod'),
                    payment_status='pending',
                )

                # Create Order Status History
                OrderStatusHistory.objects.create(
                    order=order,
                    status='pending',
                    comment='Order placed successfully.'
                )

                # Clear cart
                cart.items = []
                cart.save(update_fields=['items'])

                # Customer Notification
                Notification.objects.create(
                    user_id=request.user.id,
                    title="Order Placed Successfully",
                    message=f"Your order #{order.id} for ₹{final_total:.2f} has been received and is being processed.",
                    notification_type="order",
                    link=f"/orders/{order.id}"
                )

                # Transactional email
                send_order_notification_email(
                    email=order.email,
                    username=order.full_name,
                    order_id=order.id,
                    total=order.total,
                    status_text="Order Placed"
                )

                return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f"Transaction failed during order checkout: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = Order.objects.filter(pk=pk).prefetch_related('history', 'return_requests', 'refunds').first()
        if not order:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if order.user_id != request.user.id and not request.user.is_staff:
            return Response({'error': 'Unauthorized access to this order.'}, status=status.HTTP_403_FORBIDDEN)

        return Response(OrderSerializer(order).data)


class OrderCancelView(APIView):
    """
    Cancels an order and safely restores stock inventory.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = Order.objects.filter(pk=pk).first()
        if not order:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if order.user_id != request.user.id and not request.user.is_staff:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        if not order.can_cancel:
            return Response(
                {'error': f"Cannot cancel order in '{order.status}' status. Only pending/processing orders can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', 'Cancelled by customer')

        # Safely restore inventory within a transaction
        with transaction.atomic():
            for item in order.items:
                product_id = item.get('product_id')
                qty = int(item.get('quantity') or 1)
                product = Product.objects.filter(pk=product_id).first()
                if product:
                    product.stock += qty
                    product.save(update_fields=['stock'])

            order.status = 'cancelled'
            order.save(update_fields=['status', 'updated_at'])

            OrderStatusHistory.objects.create(
                order=order,
                status='cancelled',
                comment=f"Order cancelled: {reason}"
            )

            Notification.objects.create(
                user_id=order.user_id,
                title=f"Order #{order.id} Cancelled",
                message=f"Your order has been cancelled and any reserved items have been restored.",
                notification_type="order"
            )

            send_order_notification_email(
                email=order.email,
                username=order.full_name,
                order_id=order.id,
                total=order.total,
                status_text="Cancelled"
            )

        return Response(OrderSerializer(order).data)


class OrderReturnView(APIView):
    """
    Submits a return request for a delivered order.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = Order.objects.filter(pk=pk).first()
        if not order:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if order.user_id != request.user.id:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        if not order.can_return:
            return Response(
                {'error': f"Returns can only be requested for delivered orders. Current status: '{order.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({'error': 'Return reason is required.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            return_req = ReturnRequest.objects.create(
                order=order,
                user_id=request.user.id,
                reason=reason,
                status='requested'
            )
            order.status = 'return_requested'
            order.save(update_fields=['status', 'updated_at'])

            OrderStatusHistory.objects.create(
                order=order,
                status='return_requested',
                comment=f"Customer requested return: {reason}"
            )

            Notification.objects.create(
                user_id=order.user_id,
                title=f"Return Requested for #{order.id}",
                message=f"Your return request has been submitted and is under review.",
                notification_type="order"
            )

        return Response({
            'message': 'Return request submitted successfully.',
            'return_request': ReturnRequestSerializer(return_req).data,
            'order': OrderSerializer(order).data
        }, status=status.HTTP_201_CREATED)


class OrderRefundView(APIView):
    """
    Processes refund for an eligible order (cancellation / approved return).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = Order.objects.filter(pk=pk).first()
        if not order:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if order.user_id != request.user.id and not request.user.is_staff:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        if order.status not in ['cancelled', 'return_requested', 'returned']:
            return Response(
                {'error': f"Refund not applicable for order in '{order.status}' state."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            refund = Refund.objects.create(
                order=order,
                amount=order.total,
                status='processed',
                transaction_id=f"RFND-{uuid.uuid4().hex[:12].upper()}",
                reason=request.data.get('reason', 'Order refund processed.')
            )

            order.status = 'refunded'
            order.payment_status = 'refunded'
            order.save(update_fields=['status', 'payment_status', 'updated_at'])

            OrderStatusHistory.objects.create(
                order=order,
                status='refunded',
                comment=f"Refund of ₹{refund.amount:.2f} processed. Ref: {refund.transaction_id}"
            )

            Notification.objects.create(
                user_id=order.user_id,
                title=f"Refund Processed for Order #{order.id}",
                message=f"Refund of ₹{refund.amount:.2f} has been processed under transaction {refund.transaction_id}.",
                notification_type="order"
            )

        return Response({
            'message': 'Refund processed successfully.',
            'refund': RefundSerializer(refund).data,
            'order': OrderSerializer(order).data
        }, status=status.HTTP_200_OK)


class OrderReorderView(APIView):
    """
    Copies items from a previous order into the current user's active cart.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        order = Order.objects.filter(pk=pk, user_id=request.user.id).first()
        if not order:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        cart, _ = Cart.objects.get_or_create(
            user_id=request.user.id,
            defaults={'user_username': request.user.username, 'items': []}
        )

        current_items = list(cart.items)
        added_count = 0
        out_of_stock = []

        for item in order.items:
            product_id = item.get('product_id')
            qty = int(item.get('quantity') or 1)
            product = Product.objects.filter(pk=product_id, is_active=True).first()

            if not product or product.stock <= 0:
                out_of_stock.append(item.get('product_name', f"Product #{product_id}"))
                continue

            matched = False
            for c_item in current_items:
                if c_item.get('product_id') == product.id:
                    c_item['quantity'] = min(c_item.get('quantity', 0) + qty, product.stock)
                    matched = True
                    break

            if not matched:
                current_items.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'product_price': product.price,
                    'product_image': product.image,
                    'quantity': min(qty, product.stock),
                    'stock': product.stock
                })
            added_count += 1

        cart.items = current_items
        cart.save()

        return Response({
            'message': f"Added {added_count} items from Order #{order.id} to your cart.",
            'out_of_stock_items': out_of_stock,
            'cart': {
                'total_items': cart.total_items,
                'total_price': cart.total_price,
                'items': cart.items
            }
        }, status=status.HTTP_200_OK)


class OrderInvoiceView(APIView):
    """
    Generates a printable, standardized invoice for an order.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = Order.objects.filter(pk=pk).first()
        if not order:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if order.user_id != request.user.id and not request.user.is_staff:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        items_html = ""
        for idx, item in enumerate(order.items, start=1):
            qty = item.get('quantity', 1)
            price = item.get('product_price', 0)
            subtotal = qty * price
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{idx}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">{item.get('product_name', 'Item')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">{qty}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹{price:.2f}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹{subtotal:.2f}</td>
            </tr>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8"/>
            <title>Tax Invoice - #{order.id}</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #333; }}
                .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #232f3e; padding-bottom: 20px; }}
                .logo {{ font-size: 26px; font-weight: bold; color: #ff9900; background: #232f3e; padding: 6px 14px; border-radius: 4px; display: inline-block; }}
                .invoice-title {{ font-size: 24px; font-weight: bold; text-align: right; }}
                .details-grid {{ display: flex; justify-content: space-between; margin: 30px 0; }}
                .details-box {{ width: 48%; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th {{ background: #f8f9fa; padding: 12px 10px; text-align: left; border-bottom: 2px solid #ccc; }}
                .total-section {{ width: 350px; margin-left: auto; margin-top: 25px; }}
                .total-row {{ display: flex; justify-content: space-between; padding: 6px 0; }}
                .grand-total {{ font-size: 18px; font-weight: bold; border-top: 2px solid #232f3e; padding-top: 10px; color: #b12704; }}
                .btn-print {{ padding: 10px 20px; background: #ffd814; border: 1px solid #fcd200; border-radius: 6px; cursor: pointer; font-weight: bold; }}
                @media print {{ .btn-print {{ display: none; }} }}
            </style>
        </head>
        <body>
            <div style="text-align: right; margin-bottom: 15px;">
                <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
            </div>
            <div class="header">
                <div>
                    <span class="logo">amazon<span style="color:white">clone</span></span>
                    <p style="margin-top: 8px; color: #666; font-size: 13px;">AmazonClone Marketplace India Pvt Ltd</p>
                </div>
                <div class="invoice-title">
                    TAX INVOICE
                    <div style="font-size: 14px; color: #555; margin-top: 5px;">Order ID: #{order.id}</div>
                    <div style="font-size: 13px; color: #777;">Date: {order.created_at.strftime('%d %B %Y')}</div>
                </div>
            </div>

            <div class="details-grid">
                <div class="details-box">
                    <strong>Sold By:</strong><br/>
                    AmazonClone Retail Services<br/>
                    GSTIN: 27AABCA1234F1Z8<br/>
                    Warehouse 4, Electronic City, Bengaluru - 560100
                </div>
                <div class="details-box">
                    <strong>Shipping Address:</strong><br/>
                    {order.full_name}<br/>
                    {order.address}<br/>
                    {order.city}, {order.state} - {order.zip_code}<br/>
                    Phone: {order.phone} | Email: {order.email}
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>Item Description</th>
                        <th style="text-align: center; width: 80px;">Qty</th>
                        <th style="text-align: right; width: 120px;">Price</th>
                        <th style="text-align: right; width: 120px;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₹{order.subtotal:.2f}</span>
                </div>
                {f'<div class="total-row" style="color: green;"><span>Discount ({order.coupon_code}):</span><span>-₹{order.discount:.2f}</span></div>' if order.discount > 0 else ''}
                <div class="total-row">
                    <span>Shipping Fee:</span>
                    <span>₹{order.shipping_cost:.2f}</span>
                </div>
                <div class="total-row grand-total">
                    <span>Grand Total:</span>
                    <span>₹{order.total:.2f}</span>
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: #777;">
                    Payment Mode: {order.payment_method.upper()} | Status: {order.payment_status.upper()}
                </div>
            </div>

            <div style="margin-top: 50px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #888; text-align: center;">
                This is a computer generated invoice and does not require a physical signature.
            </div>
        </body>
        </html>
        """
        return HttpResponse(html_content, content_type='text/html')


class CouponValidateView(APIView):
    """
    Validates a coupon code against current subtotal.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        subtotal = float(request.data.get('subtotal', 0.0))

        coupon = Coupon.objects.filter(code=code).first()
        if not coupon:
            return Response({'valid': False, 'error': 'Invalid coupon code.'}, status=status.HTTP_400_BAD_REQUEST)

        valid, msg = coupon.is_valid(subtotal)
        if not valid:
            return Response({'valid': False, 'error': msg}, status=status.HTTP_400_BAD_REQUEST)

        discount = coupon.calculate_discount(subtotal)
        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': coupon.discount_value,
            'discount_amount': discount,
            'final_total': max(0.0, round(subtotal - discount, 2)),
            'message': f"Coupon '{coupon.code}' applied successfully!"
        })


class ActiveCouponsView(APIView):
    """
    Lists currently active coupons for customers.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        coupons = Coupon.objects.filter(is_active=True)
        return Response(CouponSerializer(coupons, many=True).data)
