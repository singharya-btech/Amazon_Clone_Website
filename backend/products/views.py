from django.db.models import Q
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Category, Product, Banner
from sellers.models import Seller
from core.permissions import IsSuperAdminUser
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductListSerializer,
    BannerSerializer,
)


class CategoryList(APIView):
    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class CategoryDetail(APIView):
    def get(self, request, slug):
        try:
            category = Category.objects.get(slug=slug)
            serializer = CategorySerializer(category)
            return Response(serializer.data)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)


class ProductList(APIView):
    def get(self, request):
        query = Product.objects.filter(is_active=True, is_flagged=False)

        # Storefront gating: a product only shows to customers if it has no
        # seller (legacy/admin-added) or belongs to a verified, non-flagged seller.
        verified_ids = list(
            Seller.objects.filter(status='verified', is_flagged=False).values_list('id', flat=True)
        )
        query = query.filter(Q(seller=None) | Q(seller__in=verified_ids))

        # Filter by category
        category = request.query_params.get('category')
        if category:
            query = query.filter(category__slug=category)

        # Filter by featured
        is_featured = request.query_params.get('is_featured')
        if is_featured and is_featured.lower() == 'true':
            query = query.filter(is_featured=True)

        # Search
        search = request.query_params.get('search')
        if search:
            query = query.filter(name__icontains=search)

        # Ordering
        ordering = request.query_params.get('ordering', '-created_at')
        query = query.order_by(ordering)

        serializer = ProductListSerializer(query, many=True)
        return Response(serializer.data)

    # NOTE: there is intentionally no `post` here anymore. This endpoint used
    # to allow creating a product with no seller attached at all — and since
    # DRF's default permission is AllowAny, it didn't even require being
    # logged in. A product with no seller can never be claimed/managed by
    # any seller (no one to mark it shipped/delivered), which is exactly the
    # "orders only show in admin, never in the seller panel" bug. Every
    # product now has to go through /sellers/me/products/ (SellerMeProductsView),
    # which always sets `seller` correctly.


class ProductDetail(APIView):
    def get(self, request, slug):
        try:
            product = Product.objects.get(slug=slug, is_active=True)
            serializer = ProductSerializer(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


class ProductDetailById(APIView):
    """Same storefront gating as ProductList — used by the product detail
    page since the frontend links by id, not slug."""
    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, is_active=True, is_flagged=False)
        except (Product.DoesNotExist, ValueError):
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        if product.seller and (product.seller.status != 'verified' or product.seller.is_flagged):
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response(ProductSerializer(product).data)


class FeaturedProducts(APIView):
    def get(self, request):
        products = Product.objects.filter(is_active=True, is_featured=True)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class SearchSuggestions(APIView):
    def get(self, request):
        term = (request.query_params.get('q') or '').strip()
        if not term:
            return Response({'matches': [], 'related': [], 'related_category': None})

        verified_ids = list(
            Seller.objects.filter(status='verified', is_flagged=False).values_list('id', flat=True)
        )
        base = Product.objects.filter(is_active=True, is_flagged=False).filter(
            Q(seller=None) | Q(seller__in=verified_ids)
        )

        matches = list(base.filter(name__icontains=term)[:6])

        if not matches:
            categories = Category.objects.all()
            category_hit = next(
                (c for c in categories
                 if term.lower() in c.name.lower() or c.name.lower() in term.lower()),
                None,
            )
            if category_hit:
                related = list(base.filter(category=category_hit)[:6])
                return Response({
                    'matches': [],
                    'related': ProductListSerializer(related, many=True).data,
                    'related_category': category_hit.name,
                })
            return Response({'matches': [], 'related': [], 'related_category': None})

        matched_categories = {p.category_id for p in matches if p.category_id}
        matched_ids = {p.id for p in matches}
        related = [
            p for p in base.filter(category__in=list(matched_categories))
            if p.id not in matched_ids
        ][:6]

        related_category_name = matches[0].category.name if matches[0].category else None

        return Response({
            'matches': ProductListSerializer(matches, many=True).data,
            'related': ProductListSerializer(related, many=True).data,
            'related_category': related_category_name,
        })


# ---------------------------------------------------------------------------
# Admin: browse + flag any product.  SuperAdmin: permanently remove one.
# ---------------------------------------------------------------------------

class AdminProductListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        query = Product.objects.all()
        flagged_only = request.query_params.get('flagged')
        if flagged_only == 'true':
            query = query.filter(is_flagged=True)
        query = query.order_by('-created_at')
        return Response(ProductListSerializer(query, many=True).data)


class AdminProductFlagView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, product_id):
        product = Product.objects.filter(id=product_id).first()
        if not product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        product.is_flagged = True
        product.flag_reason = request.data.get('reason', '')
        product.save()
        return Response(ProductSerializer(product).data)


class AdminProductUnflagView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, product_id):
        product = Product.objects.filter(id=product_id).first()
        if not product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        product.is_flagged = False
        product.flag_reason = ''
        product.save()
        return Response(ProductSerializer(product).data)


class SuperAdminProductRemoveView(APIView):
    permission_classes = [IsSuperAdminUser]

    def delete(self, request, product_id):
        product = Product.objects.filter(id=product_id).first()
        if not product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BannerList(APIView):
    def get(self, request):
        banners = Banner.objects.filter(is_active=True).order_by('order')
        serializer = BannerSerializer(banners, many=True)
        return Response(serializer.data)
