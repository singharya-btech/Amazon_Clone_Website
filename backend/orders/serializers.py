from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'id', 'user_id', 'user_username', 'full_name', 'email', 'phone',
            'address', 'city', 'state', 'zip_code', 'country', 'status',
            'items', 'total', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_id', 'user_username', 'created_at', 'updated_at']


class CreateOrderSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(max_length=500)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    zip_code = serializers.CharField(max_length=20)
    country = serializers.CharField(max_length=100, default='India')
