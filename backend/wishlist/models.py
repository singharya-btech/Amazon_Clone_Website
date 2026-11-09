from django.db import models


class Wishlist(models.Model):
    user_id = models.IntegerField(default=1, unique=True, db_index=True)
    user_username = models.CharField(max_length=150, blank=True, default='customer')
    product_ids = models.JSONField(default=list, blank=True)
    product_names = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wishlist of {self.user_username or self.user_id}"
