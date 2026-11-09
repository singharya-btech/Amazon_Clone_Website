from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('admin-register/', views.AdminRegisterView.as_view(), name='admin-register'),
    path('admin/register/', views.AdminRegisterView.as_view(), name='admin-register-nested'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('me/', views.UserProfileView.as_view(), name='me'),
    path('profiles/', views.UserProfileListView.as_view(), name='profile-list'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('admin/customers/', views.AdminCustomerListView.as_view(), name='admin-customer-list'),
    path('admin/customers/<int:user_id>/flag/', views.AdminCustomerFlagView.as_view(), name='admin-customer-flag'),
    path('admin/customers/<int:user_id>/unflag/', views.AdminCustomerUnflagView.as_view(), name='admin-customer-unflag'),
    path('superadmin/customers/<int:user_id>/', views.SuperAdminCustomerRemoveView.as_view(), name='superadmin-customer-remove'),
]