from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListCreateView.as_view(), name='order-list'),
    path('seller/mine/', views.SellerOrderListView.as_view(), name='seller-order-list'),
    path('seller/mine/<int:order_id>/items/<str:product_id>/status/',
         views.SellerOrderItemStatusUpdateView.as_view(), name='seller-order-item-status'),
    path('<int:order_id>/', views.OrderDetailView.as_view(), name='order-detail'),
]