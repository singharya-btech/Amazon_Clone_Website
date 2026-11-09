from rest_framework import serializers
from .models import Cart


class CartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=True)
    product_name = serializers.CharField(read_only=True)
    product_price = serializers.FloatField(read_only=True)
    product_image = serializers.CharField(read_only=True, allow_blank=True)
    sku = serializers.CharField(read_only=True, allow_blank=True)
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    variant_name = serializers.CharField(read_only=True, allow_blank=True)
    quantity = serializers.IntegerField(default=1, min_value=1)
    subtotal = serializers.FloatField(read_only=True)


class CartSerializer(serializers.ModelSerializer):
    total_price = serializers.FloatField(read_only=True)
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user_id', 'user_username', 'items', 'total_price', 'total_items', 'created_at', 'updated_at']


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=True)
    variant_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    quantity = serializers.IntegerField(default=1, min_value=1)


class UpdateCartItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    quantity = serializers.IntegerField(min_value=0)
