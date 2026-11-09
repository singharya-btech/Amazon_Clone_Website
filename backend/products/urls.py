from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryList.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetail.as_view(), name='category-detail'),
    path('products/', views.ProductList.as_view(), name='product-list'),
    path('products/featured/', views.FeaturedProducts.as_view(), name='featured-products'),
    path('products/compare/', views.ProductComparisonView.as_view(), name='product-compare'),
    path('products/autocomplete/', views.SearchAutocompleteView.as_view(), name='product-autocomplete'),
    path('products/<int:pk>/recommendations/', views.ProductRecommendationView.as_view(), name='product-recommendations'),
    path('products/<int:pk>/frequently-bought-together/', views.FrequentlyBoughtTogetherView.as_view(), name='frequently-bought-together'),
    path('products/<int:pk>/related/', views.RelatedProductsView.as_view(), name='related-products'),
    path('products/<int:pk>/qa/', views.ProductQAView.as_view(), name='product-qa'),
    path('products/<int:pk>/qa/questions/', views.ProductQuestionCreateView.as_view(), name='product-qa-question-create'),
    path('products/qa/questions/<int:question_id>/answers/', views.ProductAnswerCreateView.as_view(), name='product-qa-answer-create'),
    path('products/<int:pk>/notify-stock/', views.BackInStockView.as_view(), name='back-in-stock-notify'),
    path('flash-sales/active/', views.FlashSaleListView.as_view(), name='flash-sales-active'),
    path('search/history/', views.SearchHistoryView.as_view(), name='search-history'),
    path('banners/', views.BannerList.as_view(), name='banner-list'),
    path('products/<slug:slug>/', views.ProductDetail.as_view(), name='product-detail'),
]
