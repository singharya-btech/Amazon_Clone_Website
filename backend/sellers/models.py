import uuid
from django.db import models

STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('verified', 'Verified'),
    ('rejected', 'Rejected'),
]


class Seller(models.Model):
    user_id = models.IntegerField(unique=True, db_index=True)  # linked Django auth_user.id
    business_name = models.CharField(max_length=255)
    owner_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=32, blank=True)
    category_focus = models.CharField(max_length=100, blank=True)
    registration_id = models.CharField(max_length=100, blank=True)
    business_description = models.TextField(blank=True)
    commission_rate = models.FloatField(default=10.0)  # 10% marketplace commission
    balance = models.FloatField(default=0.0)
    bank_details = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    is_flagged = models.BooleanField(default=False)
    flag_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.business_name} ({self.status})"


class SellerPayout(models.Model):
    PAYOUT_STATUS = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('processed', 'Processed'),
        ('rejected', 'Rejected'),
    ]

    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='payouts')
    amount = models.FloatField()
    status = models.CharField(max_length=20, choices=PAYOUT_STATUS, default='pending', db_index=True)
    transaction_reference = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    bank_details = models.CharField(max_length=255, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Payout #{self.transaction_reference} for {self.seller.business_name}: ₹{self.amount} ({self.status})"


class AuditLog(models.Model):
    user_id = models.IntegerField(null=True, blank=True, db_index=True)
    username = models.CharField(max_length=150, default='system')
    role = models.CharField(max_length=50, default='customer')  # customer, seller, admin, system
    action = models.CharField(max_length=100, db_index=True)
    resource_type = models.CharField(max_length=50, db_index=True)
    resource_id = models.CharField(max_length=100, blank=True, default='')
    ip_address = models.CharField(max_length=50, blank=True, default='127.0.0.1')
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {self.role.upper()} {self.username}: {self.action} on {self.resource_type} #{self.resource_id}"


class PaymentTransaction(models.Model):
    PAYMENT_STATUS = [
        ('initiated', 'Initiated'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    order_id = models.CharField(max_length=100, db_index=True)
    user_id = models.IntegerField(db_index=True)
    amount = models.FloatField()
    gateway_name = models.CharField(max_length=50, default='sandbox_gateway')
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='initiated', db_index=True)
    transaction_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    webhook_signature = models.CharField(max_length=255, blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Txn #{self.transaction_id} ({self.gateway_name}) for Order {self.order_id}: ₹{self.amount} ({self.status})"


class ShippingShipment(models.Model):
    SHIPMENT_STATUS = [
        ('manifested', 'Label Created'),
        ('in_transit', 'In Transit'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
    ]

    order_id = models.CharField(max_length=100, db_index=True)
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='shipments')
    carrier = models.CharField(max_length=100, default='Amazon Logistics / Delhivery')
    tracking_number = models.CharField(max_length=100, unique=True, db_index=True)
    status = models.CharField(max_length=30, choices=SHIPMENT_STATUS, default='manifested', db_index=True)
    shipped_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Shipment #{self.tracking_number} ({self.carrier}) for Order {self.order_id} ({self.status})"
