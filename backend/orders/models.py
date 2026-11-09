from django.db import models

STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('processing', 'Processing'),
    ('shipped', 'Shipped'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled'),
]


class Order(models.Model):
    user_id = models.IntegerField(db_index=True)  # Django User ID
    user_username = models.CharField(max_length=150)
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='India')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    # Each item: {"product_id": ..., "product_name": ..., "product_price": ...,
    #             "product_image": ..., "quantity": ..., "subtotal": ...,
    #             "seller_id": ..., "item_status": "pending"}
    # `item_status` uses the same choices as the order-level `status` above.
    # A single order can contain products from several sellers, so each
    # seller only ever updates the status of their own line item(s); the
    # order-level `status` is then kept in sync automatically (see
    # Order.recompute_status below).
    items = models.JSONField(default=list, blank=True)
    total = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} by {self.user_username}"

    def recompute_status(self):
        """Derive the overall order status from each line item's item_status.

        - all items cancelled          -> cancelled
        - all items delivered          -> delivered
        - all (non-cancelled) shipped  -> shipped
        - anything still pending       -> processing (once at least one item
          has moved) or pending (nothing has moved yet)
        """
        statuses = [item.get('item_status', 'pending') for item in self.items]
        if not statuses:
            return self.status

        if all(s == 'cancelled' for s in statuses):
            self.status = 'cancelled'
        elif all(s == 'delivered' for s in statuses):
            self.status = 'delivered'
        elif all(s in ('shipped', 'delivered', 'cancelled') for s in statuses):
            self.status = 'shipped'
        elif any(s != 'pending' for s in statuses):
            self.status = 'processing'
        else:
            self.status = 'pending'
        return self.status
