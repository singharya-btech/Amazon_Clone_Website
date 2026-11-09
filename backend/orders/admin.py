from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_username', 'full_name', 'status', 'total', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user_username', 'full_name', 'email')
    readonly_fields = ('items', 'total')
