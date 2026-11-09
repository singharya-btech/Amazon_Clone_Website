from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListCreateView.as_view(), name='order-list-create'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/cancel/', views.OrderCancelView.as_view(), name='order-cancel'),
    path('<int:pk>/return/', views.OrderReturnView.as_view(), name='order-return'),
    path('<int:pk>/refund/', views.OrderRefundView.as_view(), name='order-refund'),
    path('<int:pk>/reorder/', views.OrderReorderView.as_view(), name='order-reorder'),
    path('<int:pk>/invoice/', views.OrderInvoiceView.as_view(), name='order-invoice'),
    path('coupons/validate/', views.CouponValidateView.as_view(), name='coupon-validate'),
    path('coupons/active/', views.ActiveCouponsView.as_view(), name='coupons-active'),
]
