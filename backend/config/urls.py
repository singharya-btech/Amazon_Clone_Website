from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from core.views import HealthCheckView, NotificationListView, NotificationMarkReadView
from orders.views import CouponValidateView, ActiveCouponsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', HealthCheckView.as_view(), name='api-health'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/', include('core.urls')),
    path('api/notifications/', NotificationListView.as_view(), name='api-notifications-list'),
    path('api/notifications/<int:pk>/mark-read/', NotificationMarkReadView.as_view(), name='api-notifications-mark-read'),
    path('api/coupons/validate/', CouponValidateView.as_view(), name='api-coupon-validate'),
    path('api/coupons/active/', ActiveCouponsView.as_view(), name='api-coupon-active'),
    path('api/', include('products.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/wishlist/', include('wishlist.urls')),
    path('api/orders/', include('orders.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
