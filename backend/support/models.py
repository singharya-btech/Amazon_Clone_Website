from django.db import models
from products.models import Product
from sellers.models import Seller

STATUS_CHOICES = [
    ('open', 'Open'),
    ('replied', 'Replied'),
    ('escalated', 'Escalated'),
    ('resolved', 'Resolved'),
]


class CustomerQuery(models.Model):
    customer_user_id = models.IntegerField(db_index=True)
    customer_name = models.CharField(max_length=150, blank=True)
    customer_email = models.EmailField(blank=True)

    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, default='general')
    message = models.TextField()

    # Optional links — a query can be a general message (both blank) or tied
    # to a specific order/product.
    order_id = models.CharField(max_length=100, blank=True)
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL, related_name='queries')
    seller = models.ForeignKey(Seller, null=True, blank=True, on_delete=models.SET_NULL, related_name='queries')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', db_index=True)
    # Each reply: {"author_role": "...", "author_name": "...", "message": "...", "created_at": "..."}
    replies = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.subject
