from django.db.models import Avg, Count
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from orders.models import Order
from sellers.views import _get_seller_for_user
from support.views import _display_name, _make_reply

from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer


def _recompute_product_rating(product):
    agg = product.reviews.aggregate(avg=Avg('rating'), count=Count('id'))
    product.rating = round(agg['avg'] or 0, 1)
    product.num_reviews = agg['count'] or 0
    product.save(update_fields=['rating', 'num_reviews'])


def _purchase_status_for(user_id, product_id):
    """Look across all of this user's orders for this product and report:
    - order: the order containing it (any status), or None if never bought
    - delivered: whether THAT SPECIFIC LINE ITEM has been marked delivered
      by the seller (per-item, since one order can span several sellers)
    Reviews are only allowed once delivered — same as real marketplaces,
    where you review what you actually received, not what you ordered.
    """
    for order in Order.objects.filter(user_id=user_id):
        for item in order.items:
            if str(item.get('product_id')) == str(product_id):
                if item.get('item_status') == 'delivered':
                    return order, True
                return order, False  # found it, but not delivered yet
    return None, False


class ProductReviewListView(APIView):
    """Public: anyone can read the reviews for a product."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        reviews = Review.objects.filter(product_id=product_id)
        return Response(ReviewSerializer(reviews, many=True).data)


class ReviewEligibilityView(APIView):
    """Can the logged-in user review this product? (bought it + hasn't
    already reviewed it). Lets the frontend decide whether to show the
    'Write a review' form."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'detail': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        order, delivered = _purchase_status_for(request.user.id, product_id)
        already_reviewed = Review.objects.filter(product_id=product_id, customer_user_id=request.user.id).exists()
        return Response({
            'can_review': delivered and not already_reviewed,
            'has_purchased': bool(order),
            'is_delivered': delivered,
            'already_reviewed': already_reviewed,
        })


class ReviewCreateView(APIView):
    """A customer writes a review for a product they've actually bought."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product = Product.objects.filter(id=data['product_id']).first()
        if not product:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        order, delivered = _purchase_status_for(request.user.id, data['product_id'])
        if not order:
            return Response(
                {'detail': "You can only review products you've purchased."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not delivered:
            return Response(
                {'detail': "You can review this once your order has been delivered."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if Review.objects.filter(product=product, customer_user_id=request.user.id).exists():
            return Response(
                {'detail': "You've already reviewed this product."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review = Review(
            product=product,
            order=order,
            customer_user_id=request.user.id,
            customer_name=_display_name(request.user),
            rating=data['rating'],
            comment=data.get('comment', ''),
        )
        review.save()
        _recompute_product_rating(product)
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class SellerReviewListView(APIView):
    """Reviews left on this seller's products."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'detail': 'Seller account not found.'}, status=status.HTTP_404_NOT_FOUND)
        reviews = Review.objects.filter(product__seller=seller)
        return Response(ReviewSerializer(reviews, many=True).data)


class SellerReviewReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, review_id):
        seller = _get_seller_for_user(request.user)
        if not seller:
            return Response({'detail': 'Seller account not found.'}, status=status.HTTP_404_NOT_FOUND)

        review = Review.objects.filter(id=review_id, product__seller=seller).first()
        if not review:
            return Response({'detail': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        message = (request.data.get('message') or '').strip()
        if not message:
            return Response({'detail': 'Reply message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        review.replies = [*review.replies, _make_reply('seller', seller.business_name, message)]
        review.save()
        return Response(ReviewSerializer(review).data)


class AdminReviewListView(APIView):
    """Admins see every review across the marketplace."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        reviews = Review.objects.all()
        return Response(ReviewSerializer(reviews, many=True).data)


class AdminReviewReplyView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, review_id):
        review = Review.objects.filter(id=review_id).first()
        if not review:
            return Response({'detail': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        message = (request.data.get('message') or '').strip()
        if not message:
            return Response({'detail': 'Reply message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        review.replies = [*review.replies, _make_reply('admin', _display_name(request.user), message)]
        review.save()
        return Response(ReviewSerializer(review).data)
