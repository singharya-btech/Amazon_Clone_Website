import mongoengine as me
from datetime import datetime


class Wishlist(me.Document):
    user_id = me.IntField(required=True)  # Django User ID
    user_username = me.StringField(required=True)
    product_ids = me.ListField(me.ObjectIdField(), default=list)
    product_names = me.ListField(me.StringField(), default=list)
    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'wishlists',
        'indexes': ['user_id'],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Wishlist of {self.user_username}"