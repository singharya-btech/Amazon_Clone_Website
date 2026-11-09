from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection
from django.utils import timezone


def health_check(request):
    """Liveness and readiness probe checking application and PostgreSQL database connectivity."""
    db_status = "healthy"
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    is_healthy = db_status == "healthy"
    status_code = 200 if is_healthy else 503

    return JsonResponse({
        "status": "healthy" if is_healthy else "degraded",
        "database": db_status,
        "timestamp": timezone.now().isoformat(),
        "version": "4.0.0"
    }, status=status_code)


urlpatterns = [
    path('health/', health_check, name='health'),
    path('api/health/', health_check, name='api-health'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),
    path('api/', include('products.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/wishlist/', include('wishlist.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/sellers/', include('sellers.urls')),
    path('api/support/', include('support.urls')),
    path('api/reviews/', include('reviews.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
