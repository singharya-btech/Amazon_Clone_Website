from rest_framework import serializers


class CartItemSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    product_name = serializers.CharField()
    product_price = serializers.FloatField()
    product_image = serializers.URLField(allow_blank=True, required=False)
    quantity = serializers.IntegerField()
    created_at = serializers.DateTimeField(required=False, allow_null=True)
    subtotal = serializers.SerializerMethodField()

    def get_subtotal(self, obj):
        price = obj.get('product_price') or 0
        qty = obj.get('quantity') or 0
        return price * qty


class CartSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField()
    user_username = serializers.CharField()
    items = CartItemSerializer(many=True)
    total_price = serializers.FloatField(read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)