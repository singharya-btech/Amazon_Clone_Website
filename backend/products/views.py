from django.db.models import Q
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

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
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductListSerializer,
    BannerSerializer,
    SearchHistorySerializer,
    ProductQuestionSerializer,
    ProductAnswerSerializer,
    BackInStockNotificationSerializer,
    FlashSaleSerializer,
)


class CategoryList(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cache_key = "v3_categories_list"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)
        categories = Category.objects.all()
        data = CategorySerializer(categories, many=True).data
        cache.set(cache_key, data, timeout=300)
        return Response(data)


class CategoryDetail(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        try:
            category = Category.objects.get(slug=slug)
            return Response(CategorySerializer(category).data)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)


class ProductList(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = Product.objects.filter(is_active=True).select_related('category')

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
            query = query.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(brand__icontains=search) |
                Q(sku__icontains=search)
            )
            # Log to search history if authenticated
            if request.user.is_authenticated:
                SearchHistory.objects.create(user_id=request.user.id, query=search.strip())

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
        cache_key = "v3_featured_products"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)
        products = Product.objects.filter(is_active=True, is_featured=True).select_related('category')[:10]
        data = ProductListSerializer(products, many=True).data
        cache.set(cache_key, data, timeout=180)
        return Response(data)


class ProductDetail(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        product = None
        if slug.isdigit():
            product = Product.objects.filter(pk=int(slug), is_active=True).select_related('category').first()
        if not product:
            product = Product.objects.filter(slug=slug, is_active=True).select_related('category').first()

        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product)
        return Response(serializer.data)


class BannerList(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        banners = Banner.objects.filter(is_active=True).order_by('order')
        return Response(BannerSerializer(banners, many=True).data)


class ProductComparisonView(APIView):
    """
    Side-by-side product comparison for up to 4 products.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ids_param = request.query_params.get('ids', '')
        if not ids_param:
            return Response({'error': 'Provide comma-separated product ids (e.g. ?ids=1,2,3)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ids = [int(i.strip()) for i in ids_param.split(',') if i.strip()]
        except ValueError:
            return Response({'error': 'Product ids must be integers'}, status=status.HTTP_400_BAD_REQUEST)

        products = Product.objects.filter(id__in=ids[:4], is_active=True).select_related('category')
        serialized = ProductSerializer(products, many=True).data

        # Aggregate common specifications keys
        all_specs_keys = set()
        for p in serialized:
            for k in p.get('specifications', {}).keys():
                all_specs_keys.add(k)

        return Response({
            'count': len(serialized),
            'products': serialized,
            'specification_keys': sorted(list(all_specs_keys))
        })


class ProductRecommendationView(APIView):
    """
    Category and rating-affinity recommendation engine.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        target = Product.objects.filter(pk=pk).first()
        if not target:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        # Find items in same category, ranked by rating and popularity
        recs = Product.objects.filter(
            category=target.category,
            is_active=True
        ).exclude(pk=target.id).order_by('-rating', '-num_reviews')[:6]

        # If not enough, backfill with top-rated items
        if recs.count() < 4:
            more = Product.objects.filter(is_active=True).exclude(
                pk__in=[target.id] + list(recs.values_list('id', flat=True))
            ).order_by('-rating')[:(4 - recs.count())]
            recs = list(recs) + list(more)

        return Response(ProductListSerializer(recs, many=True).data)


class FrequentlyBoughtTogetherView(APIView):
    """
    Returns the target product + 2 complementary items with a bundle savings calculation.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        target = Product.objects.filter(pk=pk).first()
        if not target:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        complementary = Product.objects.filter(
            is_active=True
        ).exclude(pk=target.id).order_by('price')[:2]

        bundle_items = [target] + list(complementary)
        total_price = sum(item.price for item in bundle_items)
        bundle_discount = round(total_price * 0.10, 2) # 10% bundle discount
        bundle_price = round(total_price - bundle_discount, 2)

        return Response({
            'bundle_items': ProductListSerializer(bundle_items, many=True).data,
            'total_price': round(total_price, 2),
            'bundle_discount': bundle_discount,
            'bundle_price': bundle_price,
            'savings_percent': 10
        })


class RelatedProductsView(APIView):
    """
    Related products by brand and category.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        target = Product.objects.filter(pk=pk).first()
        if not target:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        related = Product.objects.filter(
            Q(category=target.category) | Q(brand__iexact=target.brand),
            is_active=True
        ).exclude(pk=target.id)[:6]

        return Response(ProductListSerializer(related, many=True).data)


class SearchAutocompleteView(APIView):
    """
    Real-time search autocomplete suggestion engine.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response({'suggestions': [], 'products': []})

        cache_key = f"v3_autocomplete_{query.lower()}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        # Match product titles
        products = Product.objects.filter(
            Q(name__icontains=query) | Q(brand__icontains=query),
            is_active=True
        )[:5]

        # Match category titles
        categories = Category.objects.filter(name__icontains=query).values_list('name', flat=True)[:3]

        suggestions = list(categories) + [p.name for p in products]

        result = {
            'query': query,
            'suggestions': list(set(suggestions))[:8],
            'products': ProductListSerializer(products, many=True).data
        }
        cache.set(cache_key, result, timeout=120)
        return Response(result)


class SearchHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        history = SearchHistory.objects.filter(user_id=request.user.id)[:10]
        return Response(SearchHistorySerializer(history, many=True).data)

    def post(self, request):
        q = request.data.get('query', '').strip()
        if not q:
            return Response({'error': 'query required'}, status=status.HTTP_400_BAD_REQUEST)
        obj = SearchHistory.objects.create(user_id=request.user.id, query=q)
        return Response(SearchHistorySerializer(obj).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        SearchHistory.objects.filter(user_id=request.user.id).delete()
        return Response({'message': 'Search history cleared'})


class ProductQAView(APIView):
    """
    Product Q&A list.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        questions = ProductQuestion.objects.filter(product_id=pk, is_approved=True).prefetch_related('answers')
        return Response(ProductQuestionSerializer(questions, many=True).data)


class ProductQuestionCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        product = Product.objects.filter(pk=pk).first()
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        q_text = request.data.get('question_text', '').strip()
        if not q_text:
            return Response({'error': 'question_text is required'}, status=status.HTTP_400_BAD_REQUEST)

        question = ProductQuestion.objects.create(
            product=product,
            user_id=request.user.id,
            user_name=request.user.get_full_name() or request.user.username,
            question_text=q_text
        )
        return Response(ProductQuestionSerializer(question).data, status=status.HTTP_201_CREATED)


class ProductAnswerCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, question_id):
        question = ProductQuestion.objects.filter(pk=question_id).first()
        if not question:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)

        ans_text = request.data.get('answer_text', '').strip()
        if not ans_text:
            return Response({'error': 'answer_text is required'}, status=status.HTTP_400_BAD_REQUEST)

        answer = ProductAnswer.objects.create(
            question=question,
            user_id=request.user.id,
            user_name=request.user.get_full_name() or request.user.username,
            answer_text=ans_text,
            is_seller=request.user.is_staff
        )
        return Response(ProductAnswerSerializer(answer).data, status=status.HTTP_201_CREATED)


class BackInStockView(APIView):
    """
    Subscribe to back in stock notifications.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        product = Product.objects.filter(pk=pk).first()
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        email = request.data.get('email', '').strip()
        if not email and request.user.is_authenticated:
            email = request.user.email

        if not email:
            return Response({'error': 'Email address is required'}, status=status.HTTP_400_BAD_REQUEST)

        notif, created = BackInStockNotification.objects.get_or_create(
            product=product,
            email=email,
            defaults={
                'user_id': request.user.id if request.user.is_authenticated else None,
                'is_notified': False
            }
        )
        return Response({
            'message': f"We will notify {email} as soon as '{product.name}' is back in stock!",
            'product_name': product.name
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class FlashSaleListView(APIView):
    """
    Active flash sales with real-time discount promotions.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        now = timezone.now()
        sales = FlashSale.objects.filter(is_active=True, start_time__lte=now, end_time__gte=now).prefetch_related('products')
        if not sales.exists():
            # If none live, return upcoming or general active flash sale
            sales = FlashSale.objects.filter(is_active=True).prefetch_related('products')[:2]
        return Response(FlashSaleSerializer(sales, many=True).data)
