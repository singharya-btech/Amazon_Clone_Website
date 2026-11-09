from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.SellerRegisterView.as_view(), name='seller-register'),
    path('login/', views.SellerLoginView.as_view(), name='seller-login'),
    path('me/', views.SellerMeView.as_view(), name='seller-me'),
    path('profile/', views.SellerMeView.as_view(), name='seller-profile'),
    path('me/products/', views.SellerMeProductsView.as_view(), name='seller-me-products'),
    path('me/products/bulk-csv/', views.SellerBulkCSVUploadView.as_view(), name='seller-bulk-csv-upload'),
    path('me/products/<int:product_id>/', views.SellerMeProductDetailView.as_view(), name='seller-me-product-detail'),
    path('me/reports/', views.SellerReportsView.as_view(), name='seller-reports'),
    path('me/payouts/', views.SellerPayoutView.as_view(), name='seller-payouts'),
    path('me/orders/', views.SellerOrdersView.as_view(), name='seller-orders'),
    path('me/orders/<int:order_id>/ship/', views.SellerOrderShipView.as_view(), name='seller-order-ship'),

    # sandbox payment gateway
    path('payments/sandbox-checkout/', views.PaymentSandboxCheckoutView.as_view(), name='sandbox-checkout'),
    path('payments/webhook/', views.PaymentWebhookView.as_view(), name='payment-webhook'),

    # admin marketplace portal
    path('admin/', views.AdminSellerListView.as_view(), name='admin-seller-list'),
    path('admin/<int:seller_id>/verify/', views.AdminSellerVerifyView.as_view(), name='admin-seller-verify'),
    path('admin/<int:seller_id>/reject/', views.AdminSellerRejectView.as_view(), name='admin-seller-reject'),
    path('admin/<int:seller_id>/flag/', views.AdminSellerFlagView.as_view(), name='admin-seller-flag'),
    path('admin/<int:seller_id>/unflag/', views.AdminSellerUnflagView.as_view(), name='admin-seller-unflag'),
    path('admin/<int:seller_id>/', views.AdminSellerDetailView.as_view(), name='admin-seller-detail'),
    path('admin/<int:seller_id>/products/', views.AdminSellerProductsView.as_view(), name='admin-seller-products'),
    path('admin/analytics/', views.AdminMarketplaceAnalyticsView.as_view(), name='admin-marketplace-analytics'),
    path('admin/audit-logs/', views.AdminAuditLogView.as_view(), name='admin-audit-logs'),
    path('admin/payouts/<int:payout_id>/process/', views.AdminPayoutProcessView.as_view(), name='admin-payout-process'),
]
