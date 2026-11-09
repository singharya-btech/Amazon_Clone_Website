from rest_framework import serializers


class QueryReplySerializer(serializers.Serializer):
    author_role = serializers.CharField(read_only=True)
    author_name = serializers.CharField(read_only=True)
    message = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)


class CustomerQuerySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    customer_name = serializers.CharField(read_only=True)
    customer_email = serializers.CharField(read_only=True)
    subject = serializers.CharField(max_length=255)
    category = serializers.CharField(max_length=100, required=False, default='general')
    message = serializers.CharField()
    order_id = serializers.CharField(allow_blank=True, required=False)
    product = serializers.CharField(source='product.id', read_only=True, allow_null=True)
    product_name = serializers.CharField(source='product.name', read_only=True, allow_null=True)
    seller = serializers.CharField(source='seller.id', read_only=True, allow_null=True)
    seller_name = serializers.CharField(source='seller.business_name', read_only=True, allow_null=True)
    status = serializers.CharField(read_only=True)
    replies = QueryReplySerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class CustomerQueryCreateSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=255)
    category = serializers.CharField(max_length=100, required=False, default='general')
    message = serializers.CharField()
    order_id = serializers.CharField(allow_blank=True, required=False)
    product_id = serializers.CharField(allow_blank=True, required=False)
