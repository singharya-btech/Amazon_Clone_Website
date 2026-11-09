from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryList.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetail.as_view(), name='category-detail'),
    path('products/', views.ProductList.as_view(), name='product-list'),
    path('products/featured/', views.FeaturedProducts.as_view(), name='featured-products'),
    path('products/search/', views.SearchSuggestions.as_view(), name='product-search'),
    path('products/admin/', views.AdminProductListView.as_view(), name='admin-product-list'),
    path('products/admin/<int:product_id>/flag/', views.AdminProductFlagView.as_view(), name='admin-product-flag'),
    path('products/admin/<int:product_id>/unflag/', views.AdminProductUnflagView.as_view(), name='admin-product-unflag'),
    path('products/admin/<int:product_id>/remove/', views.SuperAdminProductRemoveView.as_view(), name='superadmin-product-remove'),
    path('products/id/<int:product_id>/', views.ProductDetailById.as_view(), name='product-detail-by-id'),
    path('products/<slug:slug>/', views.ProductDetail.as_view(), name='product-detail'),
    path('banners/', views.BannerList.as_view(), name='banner-list'),
]