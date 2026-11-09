from django.db import models
from products.models import Product
from orders.models import Order


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    customer_user_id = models.IntegerField(db_index=True)
    customer_name = models.CharField(max_length=150, blank=True)
    title = models.CharField(max_length=200, blank=True, default='')
    rating = models.PositiveSmallIntegerField()  # 1-5
    comment = models.TextField(blank=True)
    verified_purchase = models.BooleanField(default=False, db_index=True)
    is_approved = models.BooleanField(default=True, db_index=True)
    helpful_votes = models.IntegerField(default=0)
    unhelpful_votes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-helpful_votes', '-created_at']
        unique_together = ('product', 'customer_user_id')

    def __str__(self):
        return f"{self.rating}★ review of {self.product.name} by user {self.customer_user_id} (Verified: {self.verified_purchase})"


class ReviewImage(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image_url = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for Review #{self.review_id}"


class ReviewVote(models.Model):
    VOTE_TYPES = [
        ('helpful', 'Helpful'),
        ('unhelpful', 'Unhelpful'),
    ]

    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='votes')
    user_id = models.IntegerField(db_index=True)
    vote_type = models.CharField(max_length=10, choices=VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('review', 'user_id')

    def __str__(self):
        return f"Vote {self.vote_type} on Review #{self.review_id} by User {self.user_id}"
