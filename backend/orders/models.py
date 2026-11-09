from django.db import models

STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('processing', 'Processing'),
    ('shipped', 'Shipped'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled'),
]


class Order(models.Model):
    user_id = models.IntegerField(default=1, db_index=True)
    user_username = models.CharField(max_length=150, default='customer')
    full_name = models.CharField(max_length=255, default='')
    email = models.EmailField(default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    zip_code = models.CharField(max_length=20, blank=True, default='')
    country = models.CharField(max_length=100, default='India')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    items = models.JSONField(default=list, blank=True)
    total = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} by {self.user_username} (${self.total})"
