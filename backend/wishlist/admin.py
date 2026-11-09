from django.contrib import admin
from .models import Wishlist


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'user_username', 'created_at')
    search_fields = ('user_username',)
