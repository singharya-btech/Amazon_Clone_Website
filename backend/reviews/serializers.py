from rest_framework import serializers
from .models import Review, ReviewImage, ReviewVote


class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image_url', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'product_name', 'order', 'customer_user_id', 'customer_name',
            'title', 'rating', 'comment', 'verified_purchase', 'is_approved',
            'helpful_votes', 'unhelpful_votes', 'images', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'product_name', 'customer_user_id', 'customer_name',
            'verified_purchase', 'helpful_votes', 'unhelpful_votes',
            'created_at', 'updated_at'
        ]


class ReviewCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    comment = serializers.CharField(allow_blank=True, required=False, default='')
    images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )


class ReviewVoteSerializer(serializers.Serializer):
    vote_type = serializers.ChoiceField(choices=['helpful', 'unhelpful'])
