from rest_framework import serializers
from .models import Order, OrderStatusHistory, ReturnRequest, Refund, Coupon


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_type', 'discount_value',
            'min_order_amount', 'is_active', 'valid_from', 'valid_until'
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'comment', 'created_at']


class ReturnRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnRequest
        fields = ['id', 'order_id', 'user_id', 'reason', 'status', 'requested_at', 'resolved_at']
        read_only_fields = ['id', 'user_id', 'requested_at', 'resolved_at']


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = ['id', 'order_id', 'amount', 'status', 'transaction_id', 'reason', 'created_at']
        read_only_fields = ['id', 'transaction_id', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    history = OrderStatusHistorySerializer(many=True, read_only=True)
    return_requests = ReturnRequestSerializer(many=True, read_only=True)
    refunds = RefundSerializer(many=True, read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    can_return = serializers.BooleanField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user_id', 'user_username', 'full_name', 'email', 'phone',
            'address', 'city', 'state', 'zip_code', 'country', 'status',
            'items', 'subtotal', 'discount', 'coupon_code', 'shipping_cost',
            'total', 'payment_method', 'payment_status', 'can_cancel', 'can_return',
            'history', 'return_requests', 'refunds', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user_id', 'user_username', 'subtotal', 'discount', 'total',
            'status', 'payment_status', 'created_at', 'updated_at'
        ]


class CreateOrderSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(max_length=500)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    zip_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100, default='India')
    payment_method = serializers.CharField(max_length=50, default='cod')
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
