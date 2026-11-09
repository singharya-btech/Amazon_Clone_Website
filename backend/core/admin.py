from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'username', 'email', 'first_name', 'last_name', 'is_flagged', 'created_at')
    list_filter = ('is_flagged', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name')
