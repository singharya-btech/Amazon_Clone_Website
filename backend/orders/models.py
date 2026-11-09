import uuid
from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    DISCOUNT_TYPES = [
        ('percent', 'Percentage Discount'),
        ('fixed', 'Fixed Amount Discount'),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default='percent')
    discount_value = models.FloatField()
    min_order_amount = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    usage_limit = models.IntegerField(default=1000)
    times_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self, subtotal=0):
        if not self.is_active:
            return False, "This coupon is no longer active."
        if self.valid_until and timezone.now() > self.valid_until:
            return False, "This coupon has expired."
        if self.times_used >= self.usage_limit:
            return False, "This coupon's usage limit has been reached."
        if subtotal < self.min_order_amount:
            return False, f"Minimum order amount of ₹{self.min_order_amount:.2f} required for this coupon."
        return True, "Coupon is valid."

    def calculate_discount(self, subtotal):
        valid, _ = self.is_valid(subtotal)
        if not valid:
            return 0.0
        if self.discount_type == 'percent':
            discount = (subtotal * self.discount_value) / 100.0
        else:
            discount = min(self.discount_value, subtotal)
        return round(discount, 2)

    def __str__(self):
        return f"{self.code} ({self.discount_value}{'%' if self.discount_type == 'percent' else '₹'})"


STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('processing', 'Processing'),
    ('shipped', 'Shipped'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled'),
    ('return_requested', 'Return Requested'),
    ('returned', 'Returned'),
    ('refunded', 'Refunded'),
]

PAYMENT_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('paid', 'Paid'),
    ('refunded', 'Refunded'),
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
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending', db_index=True)
    items = models.JSONField(default=list, blank=True)
    subtotal = models.FloatField(default=0.0)
    discount = models.FloatField(default=0.0)
    coupon_code = models.CharField(max_length=50, blank=True, default='')
    shipping_cost = models.FloatField(default=0.0)
    total = models.FloatField(default=0.0)
    payment_method = models.CharField(max_length=50, default='cod')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def can_cancel(self):
        return self.status in ['pending', 'processing']

    @property
    def can_return(self):
        return self.status == 'delivered'

    def __str__(self):
        return f"Order #{self.id} by {self.user_username} (₹{self.total})"


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=30)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Order #{self.order_id} -> {self.status} at {self.created_at}"


class ReturnRequest(models.Model):
    RETURN_STATUS = [
        ('requested', 'Requested'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='return_requests')
    user_id = models.IntegerField(db_index=True)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=RETURN_STATUS, default='requested')
    requested_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Return #{self.id} for Order #{self.order_id} ({self.status})"


class Refund(models.Model):
    REFUND_STATUS = [
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='refunds')
    return_request = models.ForeignKey(ReturnRequest, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.FloatField()
    status = models.CharField(max_length=20, choices=REFUND_STATUS, default='pending')
    transaction_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Refund #{self.transaction_id} (₹{self.amount}) for Order #{self.order_id}"
