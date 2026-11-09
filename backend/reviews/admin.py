from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'customer_name', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('customer_name', 'comment', 'product__name')
