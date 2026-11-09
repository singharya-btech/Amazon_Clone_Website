from django.db import models


class Cart(models.Model):
    user_id = models.IntegerField(unique=True, db_index=True)
    user_username = models.CharField(max_length=150, blank=True)
    # Each item: {"product_id": 1, "product_name": "...", "product_price": 99.99,
    #             "product_image": "...", "quantity": 1, "variant_id": 2, "variant_name": "M - Black", "sku": "..."}
    items = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart #{self.id} for user {self.user_username or self.user_id}"

    @property
    def total_price(self):
        return round(sum((item.get('product_price') or 0) * (item.get('quantity') or 0) for item in self.items), 2)

    @property
    def total_items(self):
        return sum(item.get('quantity') or 0 for item in self.items)
