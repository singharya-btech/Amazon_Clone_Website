from rest_framework import serializers
from .models import Wishlist


class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = ['id', 'user_id', 'user_username', 'product_ids', 'product_names', 'created_at', 'updated_at']


class WishlistToggleSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=True)
    product_name = serializers.CharField(max_length=255, required=False, default='')
