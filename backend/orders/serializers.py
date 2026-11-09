from rest_framework import serializers


class OrderItemSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    product_name = serializers.CharField()
    product_price = serializers.FloatField()
    product_image = serializers.URLField(allow_blank=True, required=False)
    quantity = serializers.IntegerField()
    subtotal = serializers.FloatField()


class OrderSerializer(serializers.Serializer):
    id = serializers.CharField(source='id', read_only=True)
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