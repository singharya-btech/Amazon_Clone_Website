from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from products.models import Category, Product
from orders.models import Order
from reviews.models import Review, ReviewImage, ReviewVote


class AdvancedReviewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='reviewer', password='Password123!')
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name='Audio', slug='audio')
        self.product = Product.objects.create(
            name='Noise Canceling Earbuds Pro',
            slug='noise-canceling-earbuds-pro',
            category=self.category,
            price=149.99,
            stock=20,
            is_active=True
        )

    def test_submit_review_with_images_and_rating_recomputation(self):
        payload = {
            'product_id': self.product.id,
            'title': 'Best earbuds I have ever owned',
            'rating': 5,
            'comment': 'Outstanding audio clarity and deep bass!',
            'images': ['https://example.com/earbuds-unbox.jpg', 'https://example.com/earbuds-case.jpg']
        }
        response = self.client.post('/api/reviews/submit/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['title'], payload['title'])
        self.assertEqual(len(response.data['images']), 2)

        # Recomputed product rating
        self.product.refresh_from_db()
        self.assertEqual(self.product.rating, 5.0)
        self.assertEqual(self.product.num_reviews, 1)

    def test_verified_purchase_badge_automatic_grant(self):
        # Create past delivered order containing product for this user
        Order.objects.create(
            user_id=self.user.id,
            user_username=self.user.username,
            full_name='Reviewer Person',
            email='reviewer@example.com',
            status='delivered',
            items=[{'product_id': self.product.id, 'quantity': 1, 'product_price': 149.99}]
        )

        payload = {
            'product_id': self.product.id,
            'rating': 5,
            'title': 'Verified test',
            'comment': 'Arrived quickly.'
        }
        res = self.client.post('/api/reviews/submit/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['verified_purchase'])

    def test_review_voting_helpful_unhelpful(self):
        review = Review.objects.create(
            product=self.product,
            customer_user_id=999,
            customer_name='Other Customer',
            rating=4,
            comment='Pretty good battery life.'
        )

        # Vote helpful
        vote_res = self.client.post(f'/api/reviews/{review.id}/vote/', {'vote_type': 'helpful'}, format='json')
        self.assertEqual(vote_res.status_code, status.HTTP_200_OK)
        self.assertEqual(vote_res.data['helpful_votes'], 1)

        # Cancel vote
        cancel_res = self.client.post(f'/api/reviews/{review.id}/vote/', {'vote_type': 'helpful'}, format='json')
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_res.data['helpful_votes'], 0)

    def test_review_moderation(self):
        # Create admin
        admin_user = User.objects.create_superuser(username='admin_mod', password='AdminPassword123!', email='admin@test.com')
        self.client.force_authenticate(user=admin_user)

        review = Review.objects.create(
            product=self.product,
            customer_user_id=self.user.id,
            customer_name='reviewer',
            rating=1,
            comment='Spam comment with external links',
            is_approved=True
        )

        # Moderate and hide review
        mod_res = self.client.post(f'/api/reviews/{review.id}/moderate/', {'is_approved': False}, format='json')
        self.assertEqual(mod_res.status_code, status.HTTP_200_OK)
        self.assertFalse(mod_res.data['review']['is_approved'])

        review.refresh_from_db()
        self.assertFalse(review.is_approved)

    def test_swagger_schema_endpoint(self):
        response = self.client.get('/api/schema/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
