from django.urls import path
from . import views

urlpatterns = [
    path('', views.CartView.as_view(), name='cart-detail'),
    path('items/<int:item_id>/', views.CartItemDetailView.as_view(), name='cart-item-detail'),
    path('merge/', views.CartMergeView.as_view(), name='cart-merge'),
    path('clear/', views.ClearCartView.as_view(), name='cart-clear'),
]
