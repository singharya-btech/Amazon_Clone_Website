from django.urls import path
from . import views

urlpatterns = [
    path('', views.CartView.as_view(), name='cart'),
    path('items/<int:item_id>/', views.CartItemDetailView.as_view(), name='cart-item-detail'),
]