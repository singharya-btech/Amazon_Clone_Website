from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryList.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetail.as_view(), name='category-detail'),
    path('products/', views.ProductList.as_view(), name='product-list'),
    path('products/featured/', views.FeaturedProducts.as_view(), name='featured-products'),
    path('products/<slug:slug>/reviews/', views.ProductReviews.as_view(), name='product-reviews'),
    path('products/<slug:slug>/', views.ProductDetail.as_view(), name='product-detail'),
    path('banners/', views.BannerList.as_view(), name='banner-list'),
]
