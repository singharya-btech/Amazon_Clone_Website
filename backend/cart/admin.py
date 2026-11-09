from django.contrib import admin
from .models import Cart


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'user_username', 'total_items', 'total_price', 'created_at')
    search_fields = ('user_username',)
