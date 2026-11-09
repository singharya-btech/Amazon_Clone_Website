from rest_framework.permissions import BasePermission


class IsSuperAdminUser(BasePermission):
    """Only Django superusers — the one role above regular Admin (is_staff).
    Regular Admins can verify/flag; only a SuperAdmin can actually remove
    a flagged seller, product, or customer."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)
