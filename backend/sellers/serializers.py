from rest_framework import serializers
from .models import Seller, SellerPayout, AuditLog, PaymentTransaction, ShippingShipment


class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = [
            'id', 'user_id', 'business_name', 'owner_name', 'email', 'phone',
            'category_focus', 'registration_id', 'business_description',
            'commission_rate', 'balance', 'bank_details', 'status',
            'is_flagged', 'flag_reason', 'created_at'
        ]
        read_only_fields = ['id', 'user_id', 'balance', 'status', 'is_flagged', 'flag_reason', 'created_at']


class SellerRegisterSerializer(serializers.Serializer):
    business_name = serializers.CharField(max_length=255)
    owner_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=32, allow_blank=True, required=False)
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)
    category_focus = serializers.CharField(max_length=100, allow_blank=True, required=False)
    registration_id = serializers.CharField(max_length=100, allow_blank=True, required=False)
    business_description = serializers.CharField(allow_blank=True, required=False)
    bank_details = serializers.CharField(max_length=255, allow_blank=True, required=False, default='')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs


class SellerLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class SellerProductCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    category = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(allow_blank=True, required=False, default='')
    price = serializers.FloatField()
    compare_price = serializers.FloatField(required=False, default=None)
    image = serializers.CharField(allow_blank=True, required=False, default='')
    image_2 = serializers.CharField(allow_blank=True, required=False, default='')
    image_3 = serializers.CharField(allow_blank=True, required=False, default='')
    stock = serializers.IntegerField(default=10)


class SellerPayoutSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.business_name', read_only=True)

    class Meta:
        model = SellerPayout
        fields = [
            'id', 'seller', 'seller_name', 'amount', 'status',
            'transaction_reference', 'bank_details', 'notes',
            'requested_at', 'processed_at'
        ]
        read_only_fields = ['id', 'seller', 'seller_name', 'transaction_reference', 'requested_at', 'processed_at']


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'user_id', 'username', 'role', 'action', 'resource_type', 'resource_id', 'ip_address', 'details', 'created_at']


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = ['id', 'order_id', 'user_id', 'amount', 'gateway_name', 'status', 'transaction_id', 'metadata', 'created_at']


class ShippingShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingShipment
        fields = ['id', 'order_id', 'seller_id', 'carrier', 'tracking_number', 'status', 'shipped_at', 'delivered_at']
