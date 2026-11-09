from rest_framework import serializers
from .models import (
    Category,
    Product,
    Banner,
    SearchHistory,
    ProductQuestion,
    ProductAnswer,
    BackInStockNotification,
    FlashSale,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'brand', 'sku', 'name', 'slug',
            'description', 'price', 'compare_price', 'image', 'image_2',
            'image_3', 'stock', 'is_featured', 'rating', 'num_reviews',
            'specifications', 'tags', 'is_active', 'created_at', 'updated_at'
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'brand', 'sku', 'name', 'slug',
            'price', 'compare_price', 'image', 'stock', 'is_featured',
            'rating', 'num_reviews', 'is_active', 'created_at'
        ]


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'title', 'subtitle', 'image', 'link', 'is_active', 'order']


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ['id', 'user_id', 'query', 'created_at']
        read_only_fields = ['id', 'user_id', 'created_at']


class ProductAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAnswer
        fields = ['id', 'question_id', 'user_id', 'user_name', 'answer_text', 'is_seller', 'upvotes', 'created_at']
        read_only_fields = ['id', 'user_id', 'created_at']


class ProductQuestionSerializer(serializers.ModelSerializer):
    answers = ProductAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = ProductQuestion
        fields = ['id', 'product_id', 'user_id', 'user_name', 'question_text', 'is_approved', 'answers', 'created_at']
        read_only_fields = ['id', 'user_id', 'created_at']


class BackInStockNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackInStockNotification
        fields = ['id', 'product_id', 'user_id', 'email', 'is_notified', 'created_at']
        read_only_fields = ['id', 'user_id', 'is_notified', 'created_at']


class FlashSaleSerializer(serializers.ModelSerializer):
    products = ProductListSerializer(many=True, read_only=True)
    is_live = serializers.BooleanField(source='is_currently_live', read_only=True)

    class Meta:
        model = FlashSale
        fields = ['id', 'title', 'discount_percent', 'start_time', 'end_time', 'is_active', 'is_live', 'products']
