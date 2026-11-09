from django.urls import path
from . import views

urlpatterns = [
    path('products/<int:product_id>/', views.ProductReviewListView.as_view(), name='product-reviews'),
    path('my-reviews/', views.UserReviewListView.as_view(), name='user-reviews'),
    path('submit/', views.ReviewCreateUpdateView.as_view(), name='review-submit'),
    path('<int:pk>/vote/', views.ReviewVoteView.as_view(), name='review-vote'),
    path('<int:pk>/moderate/', views.ReviewModerationView.as_view(), name='review-moderate'),
    path('', views.ReviewCreateUpdateView.as_view(), name='review-create-update'),
]
