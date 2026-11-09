from django.urls import path
from . import views

urlpatterns = [
    path('tickets/', views.CustomerQueryListCreateView.as_view(), name='customer-tickets'),
    path('queries/', views.CustomerQueryListCreateView.as_view(), name='customer-query-list-create'),
    path('seller/queries/', views.SellerQueryListView.as_view(), name='seller-query-list'),
    path('seller/queries/<int:query_id>/reply/', views.SellerQueryReplyView.as_view(), name='seller-query-reply'),
    path('admin/queries/', views.AdminQueryListView.as_view(), name='admin-query-list'),
    path('admin/queries/<int:query_id>/reply/', views.AdminQueryReplyView.as_view(), name='admin-query-reply'),
]
