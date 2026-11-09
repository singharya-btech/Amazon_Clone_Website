from django.db import models
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    image = models.URLField(blank=True, null=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='products')
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True)
    brand = models.CharField(max_length=100, blank=True, db_index=True)
    sku = models.CharField(max_length=100, blank=True, default='', db_index=True)
    description = models.TextField(blank=True)
    price = models.FloatField(db_index=True)
    compare_price = models.FloatField(blank=True, null=True)
    image = models.TextField(blank=True, null=True)
    image_2 = models.TextField(blank=True, null=True)
    image_3 = models.TextField(blank=True, null=True)
    stock = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False, db_index=True)
    rating = models.FloatField(default=0.0, db_index=True)
    num_reviews = models.IntegerField(default=0)
    specifications = models.JSONField(default=dict, blank=True)
    tags = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Banner(models.Model):
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    image = models.URLField(blank=True, null=True, max_length=500)
    link = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title


class SearchHistory(models.Model):
    user_id = models.IntegerField(db_index=True)
    query = models.CharField(max_length=255, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"User {self.user_id}: '{self.query}' at {self.created_at}"


class ProductQuestion(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='questions')
    user_id = models.IntegerField(db_index=True)
    user_name = models.CharField(max_length=150, default='Customer')
    question_text = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Q for {self.product.name}: {self.question_text[:50]}"


class ProductAnswer(models.Model):
    question = models.ForeignKey(ProductQuestion, on_delete=models.CASCADE, related_name='answers')
    user_id = models.IntegerField(db_index=True)
    user_name = models.CharField(max_length=150, default='Shopper')
    answer_text = models.TextField()
    is_seller = models.BooleanField(default=False)
    upvotes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-upvotes', '-created_at']

    def __str__(self):
        return f"A by {self.user_name}: {self.answer_text[:50]}"


class BackInStockNotification(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_notifications')
    user_id = models.IntegerField(null=True, blank=True, db_index=True)
    email = models.EmailField(db_index=True)
    is_notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notify {self.email} when {self.product.name} back in stock"


class FlashSale(models.Model):
    title = models.CharField(max_length=255)
    discount_percent = models.FloatField(default=20.0)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    products = models.ManyToManyField(Product, related_name='flash_sales', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_currently_live(self):
        now = timezone.now()
        return self.is_active and self.start_time <= now <= self.end_time

    def __str__(self):
        return f"{self.title} ({self.discount_percent}% OFF)"
