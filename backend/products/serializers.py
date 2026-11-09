from rest_framework import serializers
from .models import Category, Product, Banner


class CategorySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=255)
    slug = serializers.CharField(max_length=255)
    image = serializers.URLField(allow_blank=True, required=False)
    created_at = serializers.DateTimeField(read_only=True)


class ProductSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    category = serializers.CharField(source='category.id', allow_null=True, required=False)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    seller = serializers.CharField(source='seller.id', read_only=True, allow_null=True)
    seller_name = serializers.CharField(source='seller.business_name', read_only=True, allow_null=True)
    seller_status = serializers.CharField(source='seller.status', read_only=True, allow_null=True)
    name = serializers.CharField(max_length=255)
    slug = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    price = serializers.FloatField()
    compare_price = serializers.FloatField(allow_null=True, required=False)
    image = serializers.CharField(allow_blank=True, required=False)
    image_2 = serializers.CharField(allow_blank=True, required=False)
    image_3 = serializers.CharField(allow_blank=True, required=False)
    stock = serializers.IntegerField()
    is_featured = serializers.BooleanField()
    rating = serializers.FloatField()
    num_reviews = serializers.IntegerField()
    is_active = serializers.BooleanField()
    is_flagged = serializers.BooleanField(read_only=True, required=False)
    flag_reason = serializers.CharField(read_only=True, required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class ProductListSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=255)
    slug = serializers.CharField(max_length=255)
    price = serializers.FloatField()
    compare_price = serializers.FloatField(allow_null=True, required=False)
    image = serializers.CharField(allow_blank=True, required=False)
    rating = serializers.FloatField()
    num_reviews = serializers.IntegerField()
    is_featured = serializers.BooleanField()
    category = serializers.CharField(source='category.id', allow_null=True, required=False)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    seller = serializers.CharField(source='seller.id', read_only=True, allow_null=True)
    seller_name = serializers.CharField(source='seller.business_name', read_only=True, allow_null=True)
    stock = serializers.IntegerField()
    is_flagged = serializers.BooleanField(read_only=True, required=False)
    flag_reason = serializers.CharField(read_only=True, required=False, allow_blank=True)


class BannerSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=255)
    subtitle = serializers.CharField(max_length=255, allow_blank=True, required=False)
    image = serializers.URLField(allow_blank=True, required=False)
    link = serializers.URLField(allow_blank=True, required=False)
    is_active = serializers.BooleanField()
    order = serializers.IntegerField()
    created_at = serializers.DateTimeField(read_only=True)


class ProductCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    slug = serializers.CharField(max_length=255, required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(allow_blank=True, required=False)
    price = serializers.FloatField()
    compare_price = serializers.FloatField(allow_null=True, required=False)
    image = serializers.CharField(allow_blank=True, required=False)
    image_2 = serializers.CharField(allow_blank=True, required=False)
    image_3 = serializers.CharField(allow_blank=True, required=False)
    stock = serializers.IntegerField(default=0)
    is_featured = serializers.BooleanField(default=False)
    rating = serializers.FloatField(default=0.0)
    num_reviews = serializers.IntegerField(default=0)
    is_active = serializers.BooleanField(default=True)