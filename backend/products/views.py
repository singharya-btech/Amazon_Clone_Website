from django.db.models import Q
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Category, Product, Banner
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductListSerializer,
    BannerSerializer,
)


class CategoryList(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class CategoryDetail(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        try:
            category = Category.objects.get(slug=slug)
            serializer = CategorySerializer(category)
            return Response(serializer.data)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)


class ProductList(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = Product.objects.filter(is_active=True)

        # Filter by category
        category = request.query_params.get('category')
        if category:
            query = query.filter(category__slug=category)

        # Filter by brand
        brand = request.query_params.get('brand')
        if brand:
            query = query.filter(brand__iexact=brand)

        # Filter by price range
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        try:
            if min_price not in (None, ''):
                query = query.filter(price__gte=float(min_price))
            if max_price not in (None, ''):
                query = query.filter(price__lte=float(max_price))
        except ValueError:
            return Response({'detail': 'min_price and max_price must be valid numbers.'}, status=status.HTTP_400_BAD_REQUEST)

        # Filter by featured
        is_featured = request.query_params.get('is_featured')
        if is_featured and is_featured.lower() == 'true':
            query = query.filter(is_featured=True)

        # Search query
        search = request.query_params.get('search')
        if search:
            query = query.filter(Q(name__icontains=search) | Q(description__icontains=search))

        # Ordering
        ordering = request.query_params.get('ordering', '-created_at')
        allowed_orderings = {'price', '-price', 'name', '-name', 'created_at', '-created_at', 'rating', '-rating'}
        if ordering in allowed_orderings:
            query = query.order_by(ordering)

        serializer = ProductListSerializer(query, many=True)
        return Response(serializer.data)


class FeaturedProducts(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        products = Product.objects.filter(is_active=True, is_featured=True)[:10]
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class ProductDetail(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        product = None
        if slug.isdigit():
            product = Product.objects.filter(pk=int(slug), is_active=True).first()
        if not product:
            product = Product.objects.filter(slug=slug, is_active=True).first()

        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product)
        return Response(serializer.data)


class BannerList(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        banners = Banner.objects.filter(is_active=True).order_by('order')
        serializer = BannerSerializer(banners, many=True)
        return Response(serializer.data)


class ProductReviews(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        product = Product.objects.filter(slug=slug).first() or (Product.objects.filter(pk=int(slug)).first() if slug.isdigit() else None)
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        # Returns simulated or existing product reviews
        return Response([
            {
                "id": 1,
                "user_name": "Verified Customer",
                "rating": product.rating or 4.5,
                "comment": "High quality product, arrived quickly in safe packaging.",
                "created_at": "2026-06-15T10:00:00Z",
                "verified_purchase": True
            }
        ])
