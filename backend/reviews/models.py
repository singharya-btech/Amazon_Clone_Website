from django.db import models
from products.models import Product
from orders.models import Order


class Review(models.Model):
    """A customer review for a product. Only customers who have actually
    ordered the product may create one (enforced in the view, not here,
    since that check needs the Order table). The seller (or an admin) can
    reply — mirroring the support app's CustomerQuery reply pattern."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')

    customer_user_id = models.IntegerField(db_index=True)
    customer_name = models.CharField(max_length=150, blank=True)

    rating = models.PositiveSmallIntegerField()  # 1-5
    comment = models.TextField(blank=True)

    # Each reply: {"author_role": "seller"/"admin", "author_name": ..., "message": ..., "created_at": ...}
    replies = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        # One review per product per customer — they can edit it, not spam more.
        unique_together = ('product', 'customer_user_id')

    def __str__(self):
        return f"{self.rating}★ review of {self.product.name} by user {self.customer_user_id}"
