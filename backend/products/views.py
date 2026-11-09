from django.db.models import Q
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from .models import Category, Product, ProductVariant, Banner, Coupon
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductListSerializer,
    ProductVariantSerializer,
    BannerSerializer,
    CouponValidateSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })


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
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        query = Product.objects.filter(is_active=True).select_related('category').prefetch_related('gallery_images')

        # Filter by category slug
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
            return Response({'detail': 'min_price and max_price must be numbers.'}, status=status.HTTP_400_BAD_REQUEST)

        # Filter by product availability
        availability = request.query_params.get('availability')
        if availability == 'in_stock':
            query = query.filter(stock__gt=0)
        elif availability == 'out_of_stock':
            query = query.filter(stock__lte=0)

        # Filter by minimum rating
        min_rating = request.query_params.get('min_rating')
        if min_rating:
            try:
                query = query.filter(rating__gte=float(min_rating))
            except ValueError:
                pass

        # Filter by featured
        is_featured = request.query_params.get('is_featured')
        if is_featured and is_featured.lower() == 'true':
            query = query.filter(is_featured=True)

        # Keyword Search across name, description, SKU, brand
        search = request.query_params.get('search')
        if search:
            query = query.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(sku__icontains=search) |
                Q(brand__icontains=search)
            )

        # Advanced Sorting
        sort_map = {
            'price_asc': 'price',
            'price_desc': '-price',
            'rating_desc': '-rating',
            'newest': '-created_at',
            'name_asc': 'name',
            'name_desc': '-name',
        }
        sort_param = request.query_params.get('ordering') or request.query_params.get('sort', 'newest')
        order_field = sort_map.get(sort_param, '-created_at')
        query = query.order_by(order_field)

        # Pagination support
        paginator = self.pagination_class()
        # If client explicitly disables pagination with ?no_page=true, return plain list
        if request.query_params.get('no_page') == 'true':
            serializer = ProductListSerializer(query, many=True)
            return Response(serializer.data)

        page = paginator.paginate_queryset(query, request)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ProductListSerializer(query, many=True)
        return Response(serializer.data)


class FeaturedProducts(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        products = Product.objects.filter(is_active=True, is_featured=True)[:8]
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class ProductDetail(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        product = None
        if slug.isdigit():
            product = Product.objects.filter(pk=int(slug), is_active=True).prefetch_related('gallery_images', 'variants').first()
        if not product:
            product = Product.objects.filter(slug=slug, is_active=True).prefetch_related('gallery_images', 'variants').first()

        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product)
        return Response(serializer.data)


class ProductVariantsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        variants = ProductVariant.objects.filter(product_id=product_id, is_active=True)
        serializer = ProductVariantSerializer(variants, many=True)
        return Response(serializer.data)


class RecentlyViewedProductsView(APIView):
    """Accepts a list of product IDs from client localStorage and returns ordered product previews."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ids = request.data.get('ids', [])
        if not isinstance(ids, list):
            return Response({'error': 'ids must be a list of integers'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch products matching IDs
        products = Product.objects.filter(id__in=ids, is_active=True).select_related('category')
        product_map = {p.id: p for p in products}

        # Maintain original viewed sequence
        ordered_products = [product_map[pid] for pid in ids if pid in product_map]
        serializer = ProductListSerializer(ordered_products, many=True)
        return Response(serializer.data)


class CouponValidateView(APIView):
    """Simulates coupon validation against cart subtotal."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code'].strip().upper()
        subtotal = serializer.validated_data['subtotal']

        now = timezone.now()
        coupon = Coupon.objects.filter(code__iexact=code, is_active=True).first()

        if not coupon:
            return Response({
                'valid': False,
                'error': f'Coupon code "{code}" is invalid or does not exist.'
            }, status=status.HTTP_404_NOT_FOUND)

        if coupon.valid_until and coupon.valid_until < now:
            return Response({
                'valid': False,
                'error': f'Coupon code "{code}" has expired.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if subtotal < coupon.min_order_amount:
            return Response({
                'valid': False,
                'error': f'Coupon "{code}" requires a minimum order amount of ${coupon.min_order_amount:.2f}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        discount = coupon.calculate_discount(subtotal)
        final_total = max(0.0, round(subtotal - discount, 2))

        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': coupon.discount_value,
            'discount_amount': discount,
            'subtotal': subtotal,
            'total_after_discount': final_total,
            'message': f'Coupon "{coupon.code}" applied! You saved ${discount:.2f}.'
        }, status=status.HTTP_200_OK)


class BannerList(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        banners = Banner.objects.filter(is_active=True).order_by('order')
        serializer = BannerSerializer(banners, many=True)
        return Response(serializer.data)
