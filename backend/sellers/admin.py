from django.contrib import admin
from .models import Seller


@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'owner_name', 'email', 'status', 'is_flagged', 'created_at')
    list_filter = ('status', 'is_flagged', 'created_at')
    search_fields = ('business_name', 'owner_name', 'email', 'registration_id')
