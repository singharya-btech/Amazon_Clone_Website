from rest_framework import serializers
from .models import Category, Product, Banner


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'brand', 'name', 'slug',
            'description', 'price', 'compare_price', 'image', 'image_2',
            'image_3', 'stock', 'is_featured', 'rating', 'num_reviews',
            'is_active', 'created_at', 'updated_at'
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'brand', 'name', 'slug',
            'price', 'compare_price', 'image', 'stock', 'is_featured',
            'rating', 'num_reviews', 'is_active', 'created_at'
        ]


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'title', 'subtitle', 'image', 'link', 'is_active', 'order']
