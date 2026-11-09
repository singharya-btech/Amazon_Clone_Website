from django.contrib import admin
from .models import CustomerQuery


@admin.register(CustomerQuery)
class CustomerQueryAdmin(admin.ModelAdmin):
    list_display = ('subject', 'customer_name', 'customer_email', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('subject', 'customer_name', 'customer_email')
    readonly_fields = ('replies',)
