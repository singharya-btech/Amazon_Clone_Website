from django.contrib.auth.models import User
from django.db import connection
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    UserProfile,
    Address,
    EmailVerificationToken,
    PasswordResetToken,
    Notification,
)
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    AddressSerializer,
    NotificationSerializer,
    RegisterSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    VerifyEmailSerializer,
    ChangePasswordSerializer,
)
from .services.email_service import (
    send_verification_email,
    send_password_reset_email,
)


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        db_status = "healthy"
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"

        is_healthy = db_status == "healthy"
        response_status = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response({
            "status": "healthy" if is_healthy else "degraded",
            "database": db_status,
            "timestamp": timezone.now().isoformat(),
            "version": "2.0.0"
        }, status=response_status)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate email verification token
        token_obj = EmailVerificationToken.create_token(user_id=user.id, email=user.email)
        send_verification_email(user.email, user.username, token_obj.token)

        # Welcome notification
        Notification.objects.create(
            user_id=user.id,
            title="Welcome to AmazonClone!",
            message="Your account has been created. Please verify your email to unlock all features.",
            notification_type="account"
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'verification_token': token_obj.token, # Included for ease of testing & simulation
            'message': 'Registration successful! Verification email has been sent.'
        }, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_str = serializer.validated_data['token']

        token_obj = EmailVerificationToken.objects.filter(token=token_str).first()
        if not token_obj or not token_obj.is_valid():
            return Response(
                {'error': 'Invalid or expired email verification token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        token_obj.is_used = True
        token_obj.save(update_fields=['is_used'])

        profile = UserProfile.objects.filter(user_id=token_obj.user_id).first()
        if profile:
            profile.email_verified = True
            profile.save(update_fields=['email_verified'])

        Notification.objects.create(
            user_id=token_obj.user_id,
            title="Email Verified",
            message="Your email address has been successfully verified.",
            notification_type="account"
        )

        return Response({
            'success': True,
            'message': 'Email successfully verified!'
        }, status=status.HTTP_200_OK)


class ResendVerificationEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email and request.user.is_authenticated:
            email = request.user.email

        if not email:
            return Response({'error': 'Email address required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'User with this email not found.'}, status=status.HTTP_404_NOT_FOUND)

        token_obj = EmailVerificationToken.create_token(user_id=user.id, email=user.email)
        send_verification_email(user.email, user.username, token_obj.token)

        return Response({
            'message': 'Verification email resent.',
            'verification_token': token_obj.token
        }, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email=email).first()
        if not user:
            # Security practice: Return success message even if email not found to avoid user enumeration
            return Response({
                'message': 'If an account exists with this email, a password reset link has been dispatched.'
            }, status=status.HTTP_200_OK)

        token_obj = PasswordResetToken.create_token(user_id=user.id)
        send_password_reset_email(user.email, user.username, token_obj.token)

        return Response({
            'message': 'If an account exists with this email, a password reset link has been dispatched.',
            'reset_token': token_obj.token # for simulation/testing
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_str = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        token_obj = PasswordResetToken.objects.filter(token=token_str).first()
        if not token_obj or not token_obj.is_valid():
            return Response(
                {'error': 'Invalid or expired password reset token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(pk=token_obj.user_id).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save()

        token_obj.is_used = True
        token_obj.save(update_fields=['is_used'])

        Notification.objects.create(
            user_id=user.id,
            title="Password Changed",
            message="Your account password was successfully reset.",
            notification_type="account"
        )

        return Response({
            'success': True,
            'message': 'Password has been successfully reset. You may now login.'
        }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Incorrect current password.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        Notification.objects.create(
            user_id=user.id,
            title="Security Alert: Password Updated",
            message="Your password was changed from your account settings.",
            notification_type="account"
        )

        return Response({'message': 'Password updated successfully.'})


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        profile, _ = UserProfile.objects.get_or_create(
            user_id=user.id,
            defaults={
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'profile': UserProfileSerializer(profile).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={
                'username': request.user.username,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
            }
        )
        return Response(UserProfileSerializer(profile).data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(
            user_id=request.user.id,
            defaults={
                'username': request.user.username,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
            }
        )
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Update User model first_name and last_name as well
        user = request.user
        updated = False
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
            updated = True
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
            updated = True
        if updated:
            user.save()

        return Response(serializer.data)


class UserProfileListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        profiles = UserProfile.objects.all()
        serializer = UserProfileSerializer(profiles, many=True)
        return Response(serializer.data)


class AddressListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        addresses = Address.objects.filter(user_id=request.user.id)
        return Response(AddressSerializer(addresses, many=True).data)

    def post(self, request):
        serializer = AddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_default = serializer.validated_data.get('is_default', False)
        if is_default:
            Address.objects.filter(user_id=request.user.id).update(is_default=False)
        address = serializer.save(user_id=request.user.id)
        return Response(AddressSerializer(address).data, status=status.HTTP_201_CREATED)


class AddressDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        address = Address.objects.filter(pk=pk, user_id=request.user.id).first()
        if not address:
            return Response({'error': 'Address not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AddressSerializer(address).data)

    def put(self, request, pk):
        address = Address.objects.filter(pk=pk, user_id=request.user.id).first()
        if not address:
            return Response({'error': 'Address not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AddressSerializer(address, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get('is_default', False):
            Address.objects.filter(user_id=request.user.id).exclude(pk=pk).update(is_default=False)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        address = Address.objects.filter(pk=pk, user_id=request.user.id).first()
        if not address:
            return Response({'error': 'Address not found'}, status=status.HTTP_404_NOT_FOUND)
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddressSetDefaultView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        address = Address.objects.filter(pk=pk, user_id=request.user.id).first()
        if not address:
            return Response({'error': 'Address not found'}, status=status.HTTP_404_NOT_FOUND)
        Address.objects.filter(user_id=request.user.id).update(is_default=False)
        address.is_default = True
        address.save(update_fields=['is_default'])
        return Response(AddressSerializer(address).data)


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user_id=request.user.id)
        unread_count = notifications.filter(is_read=False).count()
        return Response({
            'unread_count': unread_count,
            'notifications': NotificationSerializer(notifications[:50], many=True).data
        })

    def put(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(user_id=request.user.id, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        notification = Notification.objects.filter(pk=pk, user_id=request.user.id).first()
        if not notification:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data)
