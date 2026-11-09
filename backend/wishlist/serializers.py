from rest_framework import serializers


class WishlistSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.IntegerField()
    user_username = serializers.CharField()
    product_ids = serializers.ListField(child=serializers.CharField())
    product_names = serializers.ListField(child=serializers.CharField())
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class AddToWishlistSerializer(serializers.Serializer):
    product_id = serializers.CharField()