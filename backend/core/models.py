import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user_id = models.IntegerField(unique=True, db_index=True)
    username = models.CharField(max_length=150, db_index=True)
    email = models.EmailField(db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.URLField(blank=True, default='')
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({'Verified' if self.email_verified else 'Unverified'})"


class Address(models.Model):
    ADDRESS_TYPES = [
        ('home', 'Home'),
        ('work', 'Work'),
        ('other', 'Other'),
    ]

    user_id = models.IntegerField(db_index=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='India')
    address_type = models.CharField(max_length=20, choices=ADDRESS_TYPES, default='home')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.address_type}) - {self.city}"


class EmailVerificationToken(models.Model):
    user_id = models.IntegerField(db_index=True)
    email = models.EmailField()
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    @classmethod
    def create_token(cls, user_id, email, hours_valid=24):
        token_str = uuid.uuid4().hex
        expires_at = timezone.now() + timedelta(hours=hours_valid)
        return cls.objects.create(
            user_id=user_id,
            email=email,
            token=token_str,
            expires_at=expires_at,
        )

    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at

    def __str__(self):
        return f"VerifyToken({self.email}, valid={self.is_valid()})"


class PasswordResetToken(models.Model):
    user_id = models.IntegerField(db_index=True)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    @classmethod
    def create_token(cls, user_id, hours_valid=2):
        token_str = uuid.uuid4().hex
        expires_at = timezone.now() + timedelta(hours=hours_valid)
        return cls.objects.create(
            user_id=user_id,
            token=token_str,
            expires_at=expires_at,
        )

    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at

    def __str__(self):
        return f"PasswordResetToken(user_id={self.user_id}, valid={self.is_valid()})"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('order', 'Order Update'),
        ('promo', 'Promotions'),
        ('account', 'Account Alert'),
        ('system', 'System Notification'),
    ]

    user_id = models.IntegerField(db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='order')
    link = models.CharField(max_length=255, blank=True, default='')
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title} (User {self.user_id})"
