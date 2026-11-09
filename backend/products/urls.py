from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryList.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetail.as_view(), name='category-detail'),
    path('products/', views.ProductList.as_view(), name='product-list'),
    path('products/featured/', views.FeaturedProducts.as_view(), name='featured-products'),
    path('products/recently-viewed/', views.RecentlyViewedProductsView.as_view(), name='recently-viewed'),
    path('products/<int:product_id>/variants/', views.ProductVariantsView.as_view(), name='product-variants'),
    path('products/<slug:slug>/', views.ProductDetail.as_view(), name='product-detail'),
    path('coupons/validate/', views.CouponValidateView.as_view(), name='coupon-validate'),
    path('banners/', views.BannerList.as_view(), name='banner-list'),
]
