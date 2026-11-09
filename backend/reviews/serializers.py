from rest_framework import serializers
from .models import Review


class ReplySerializer(serializers.Serializer):
    author_role = serializers.CharField()
    author_name = serializers.CharField()
    message = serializers.CharField()
    created_at = serializers.CharField()


class ReviewSerializer(serializers.ModelSerializer):
    replies = ReplySerializer(many=True, read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'product_name', 'order', 'customer_user_id', 'customer_name',
            'rating', 'comment', 'replies', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'product_name', 'customer_user_id', 'customer_name', 'replies', 'created_at', 'updated_at']


class ReviewCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(allow_blank=True, required=False, default='')
