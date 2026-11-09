from django.db import models


class UserProfile(models.Model):
    user_id = models.IntegerField(unique=True, db_index=True)
    username = models.CharField(max_length=150, db_index=True)
    email = models.EmailField(db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_flagged = models.BooleanField(default=False)
    flag_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username
