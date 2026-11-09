import mongoengine as me
from datetime import datetime


class OrderItem(me.EmbeddedDocument):
    product_id = me.ObjectIdField()
    product_name = me.StringField()
    product_price = me.FloatField()
    product_image = me.URLField()
    quantity = me.IntField()
    subtotal = me.FloatField()


class Order(me.Document):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    user_id = me.IntField(required=True)  # Django User ID
    user_username = me.StringField(required=True)
    full_name = me.StringField(max_length=255, required=True)
    email = me.EmailField(required=True)
    phone = me.StringField(max_length=20)
    address = me.StringField()
    city = me.StringField(max_length=100)
    state = me.StringField(max_length=100)
    zip_code = me.StringField(max_length=20)
    country = me.StringField(max_length=100, default='India')
    status = me.StringField(choices=STATUS_CHOICES, default='pending')
    items = me.ListField(me.EmbeddedDocumentField(OrderItem), default=list)
    total = me.FloatField()
    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'orders',
        'ordering': ['-created_at'],
        'indexes': ['-created_at', 'user_id', 'status'],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.id} by {self.user_username}"