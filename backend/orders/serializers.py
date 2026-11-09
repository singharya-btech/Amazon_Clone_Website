from rest_framework import serializers
from .models import STATUS_CHOICES


class OrderItemSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    product_name = serializers.CharField()
    product_price = serializers.FloatField()
    product_image = serializers.URLField(allow_blank=True, required=False)
    quantity = serializers.IntegerField()
    subtotal = serializers.FloatField()
    seller_id = serializers.IntegerField(required=False, allow_null=True)
    item_status = serializers.CharField(required=False, default='pending')


class UpdateItemStatusSerializer(serializers.Serializer):
    item_status = serializers.ChoiceField(choices=STATUS_CHOICES)


class OrderItemInputSerializer(serializers.Serializer):
    """What the frontend sends per cart line when placing an order. Just an
    id + quantity — the view looks the product up itself for the real
    name/price/image/seller so the client can't spoof those."""
    product_id = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1)


class OrderSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField()
    user_username = serializers.CharField()
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    zip_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100)
    status = serializers.CharField()
    items = OrderItemSerializer(many=True, read_only=True)
    total = serializers.FloatField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class CreateOrderSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    zip_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100, default='India')
    items = OrderItemInputSerializer(many=True)