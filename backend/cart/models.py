from django.db import models


class Cart(models.Model):
    user_id = models.IntegerField(default=1, unique=True, db_index=True)
    user_username = models.CharField(max_length=150, blank=True, default='customer')
    items = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user_username or self.user_id}"

    @property
    def total_price(self):
        return sum((item.get('product_price') or 0) * (item.get('quantity') or 0) for item in self.items)

    @property
    def total_items(self):
        return sum(item.get('quantity') or 0 for item in self.items)
