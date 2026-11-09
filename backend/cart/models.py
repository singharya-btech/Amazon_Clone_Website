from django.db import models


class Cart(models.Model):
    user_id = models.IntegerField(unique=True, db_index=True)  # Django User ID
    user_username = models.CharField(max_length=150)
    # Each item: {"product_id": ..., "product_name": ..., "product_price": ...,
    #             "product_image": ..., "quantity": ..., "created_at": "..."}
    items = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Django ORM has no get_or_create with default list-y syntax issue,
        # this mirrors the original single-cart-per-user design.
        pass

    def __str__(self):
        return f"Cart of {self.user_username}"

    @property
    def total_price(self):
        return sum((item.get('product_price') or 0) * (item.get('quantity') or 0) for item in self.items)

    @property
    def total_items(self):
        return sum(item.get('quantity') or 0 for item in self.items)
