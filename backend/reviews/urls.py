from django.urls import path
from . import views

urlpatterns = [
    path('product/<int:product_id>/', views.ProductReviewListView.as_view(), name='review-product-list'),
    path('eligibility/', views.ReviewEligibilityView.as_view(), name='review-eligibility'),
    path('', views.ReviewCreateView.as_view(), name='review-create'),

    # seller-facing
    path('seller/mine/', views.SellerReviewListView.as_view(), name='seller-review-list'),
    path('seller/mine/<int:review_id>/reply/', views.SellerReviewReplyView.as_view(), name='seller-review-reply'),

    # admin-facing
    path('admin/', views.AdminReviewListView.as_view(), name='admin-review-list'),
    path('admin/<int:review_id>/reply/', views.AdminReviewReplyView.as_view(), name='admin-review-reply'),
]
