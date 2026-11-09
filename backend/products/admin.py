from django.contrib import admin
from .models import Category, Product, Banner


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    search_fields = ('name', 'slug')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'seller', 'category', 'price', 'is_active', 'is_flagged', 'created_at')
    list_filter = ('is_active', 'is_flagged', 'is_featured', 'category', 'seller')
    search_fields = ('name', 'description')
    list_select_related = ('category', 'seller')


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'order', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'subtitle')
