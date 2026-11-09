from django.db.models import Avg, Count
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from orders.models import Order
from .models import Review, ReviewImage, ReviewVote
from .serializers import (
    ReviewSerializer,
    ReviewCreateSerializer,
    ReviewVoteSerializer,
)


def _recompute_product_rating(product):
    agg = product.reviews.filter(is_approved=True).aggregate(avg=Avg('rating'), count=Count('id'))
    product.rating = round(agg['avg'] or 0, 1)
    product.num_reviews = agg['count'] or 0
    product.save(update_fields=['rating', 'num_reviews'])


class ProductReviewListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        reviews = Review.objects.filter(
            product_id=product_id,
            is_approved=True
        ).prefetch_related('images').select_related('product')
        return Response(ReviewSerializer(reviews, many=True).data)


class ReviewCreateUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pid = serializer.validated_data['product_id']
        rating = serializer.validated_data['rating']
        title = serializer.validated_data.get('title', '')
        comment = serializer.validated_data.get('comment', '')
        image_urls = serializer.validated_data.get('images', [])

        product = Product.objects.filter(pk=pid, is_active=True).first()
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if user actually purchased this product for verified badge
        user_orders = Order.objects.filter(user_id=request.user.id)
        verified = False
        matching_order = None
        for order in user_orders:
            for item in order.items:
                if item.get('product_id') == product.id:
                    verified = True
                    matching_order = order
                    break
            if verified:
                break

        with transaction.atomic():
            review, created = Review.objects.update_or_create(
                product=product,
                customer_user_id=request.user.id,
                defaults={
                    'customer_name': request.user.get_full_name() or request.user.username,
                    'title': title,
                    'rating': rating,
                    'comment': comment,
                    'verified_purchase': verified,
                    'order': matching_order,
                    'is_approved': True,
                }
            )

            # Attach images
            if image_urls:
                review.images.all().delete()
                for img_url in image_urls[:5]:
                    if img_url and img_url.strip():
                        ReviewImage.objects.create(review=review, image_url=img_url.strip())

            _recompute_product_rating(product)

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ReviewVoteView(APIView):
    """
    Vote a review as helpful or unhelpful.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        review = Review.objects.filter(pk=pk).first()
        if not review:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReviewVoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vote_type = serializer.validated_data['vote_type']

        existing_vote = ReviewVote.objects.filter(review=review, user_id=request.user.id).first()

        with transaction.atomic():
            if existing_vote:
                if existing_vote.vote_type == vote_type:
                    # Cancel vote
                    if vote_type == 'helpful':
                        review.helpful_votes = max(0, review.helpful_votes - 1)
                    else:
                        review.unhelpful_votes = max(0, review.unhelpful_votes - 1)
                    existing_vote.delete()
                    review.save(update_fields=['helpful_votes', 'unhelpful_votes'])
                    return Response({'message': 'Vote removed', 'helpful_votes': review.helpful_votes, 'unhelpful_votes': review.unhelpful_votes})
                else:
                    # Switch vote
                    if vote_type == 'helpful':
                        review.helpful_votes += 1
                        review.unhelpful_votes = max(0, review.unhelpful_votes - 1)
                    else:
                        review.unhelpful_votes += 1
                        review.helpful_votes = max(0, review.helpful_votes - 1)
                    existing_vote.vote_type = vote_type
                    existing_vote.save(update_fields=['vote_type'])
            else:
                ReviewVote.objects.create(review=review, user_id=request.user.id, vote_type=vote_type)
                if vote_type == 'helpful':
                    review.helpful_votes += 1
                else:
                    review.unhelpful_votes += 1

            review.save(update_fields=['helpful_votes', 'unhelpful_votes'])

        return Response({
            'message': f"Voted as {vote_type}",
            'helpful_votes': review.helpful_votes,
            'unhelpful_votes': review.unhelpful_votes
        }, status=status.HTTP_200_OK)


class ReviewModerationView(APIView):
    """
    Staff review moderation endpoint (approve or hide review).
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        review = Review.objects.filter(pk=pk).first()
        if not review:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

        is_approved = request.data.get('is_approved', True)
        review.is_approved = bool(is_approved)
        review.save(update_fields=['is_approved'])
        _recompute_product_rating(review.product)

        return Response({
            'message': f"Review {'approved' if review.is_approved else 'hidden'} successfully.",
            'review': ReviewSerializer(review).data
        })


class UserReviewListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        reviews = Review.objects.filter(customer_user_id=request.user.id).prefetch_related('images')
        return Response(ReviewSerializer(reviews, many=True).data)
