from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductVariant, Banner, Coupon


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'created_at']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'alt_text', 'order', 'is_primary']


class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.FloatField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'sku', 'color', 'size', 'specifications',
            'price_override', 'effective_price', 'stock', 'is_active', 'is_available'
        ]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    gallery_images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    availability_status = serializers.CharField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'sku', 'brand', 'name', 'slug',
            'description', 'specifications', 'price', 'compare_price',
            'image', 'image_2', 'image_3', 'gallery_images', 'variants',
            'stock', 'low_stock_threshold', 'availability_status', 'is_available',
            'is_featured', 'rating', 'num_reviews', 'is_active', 'created_at', 'updated_at'
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    availability_status = serializers.CharField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'sku', 'brand', 'name', 'slug',
            'price', 'compare_price', 'image', 'stock', 'availability_status',
            'is_available', 'is_featured', 'rating', 'num_reviews', 'is_active', 'created_at'
        ]


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'title', 'subtitle', 'image', 'link', 'is_active', 'order']


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['id', 'code', 'discount_type', 'discount_value', 'min_order_amount', 'is_active', 'valid_until']


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=30)
    subtotal = serializers.FloatField(min_value=0)
