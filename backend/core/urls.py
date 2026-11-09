from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', views.ResendVerificationEmailView.as_view(), name='resend-verification'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profiles/', views.UserProfileListView.as_view(), name='profile-list'),
    path('addresses/', views.AddressListView.as_view(), name='address-list'),
    path('addresses/<int:pk>/', views.AddressDetailView.as_view(), name='address-detail'),
    path('addresses/<int:pk>/set-default/', views.AddressSetDefaultView.as_view(), name='address-set-default'),
    path('notifications/', views.NotificationListView.as_view(), name='notifications-list'),
    path('notifications/<int:pk>/mark-read/', views.NotificationMarkReadView.as_view(), name='notifications-mark-read'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
