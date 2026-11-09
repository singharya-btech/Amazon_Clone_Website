from django.contrib.auth.models import User
from django.db import connection
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile, Address
from .serializers import (
    UserSerializer,
    UserProfileSerializer,
    AddressSerializer,
    RegisterSerializer,
    LoginSerializer,
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
            "version": "3.0.0"
        }, status=response_status)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class UserProfileListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        profiles = UserProfile.objects.all()
        serializer = UserProfileSerializer(profiles, many=True)
        return Response(serializer.data)


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
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
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

        user = request.user
        updated = False
        if 'email' in request.data:
            user.email = request.data['email']
            updated = True
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
            updated = True
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
            updated = True
        if updated:
            user.save()

        return Response(serializer.data)

    patch = put


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_pass = request.data.get('old_password')
        new_pass = request.data.get('new_password')
        confirm_pass = request.data.get('confirm_password')

        if not old_pass or not request.user.check_password(old_pass):
            return Response({'old_password': 'Old password is not correct.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_pass and confirm_pass and new_pass != confirm_pass:
            return Response({'new_password': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_pass)
        request.user.save()
        return Response({'detail': 'Password updated successfully.'})



class AddressListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        addresses = Address.objects.filter(user_id=request.user.id)
        return Response(AddressSerializer(addresses, many=True).data)

    def post(self, request):
        serializer = AddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get('is_default', False):
            Address.objects.filter(user_id=request.user.id).update(is_default=False)
        address = serializer.save(user_id=request.user.id)
        return Response(AddressSerializer(address).data, status=status.HTTP_201_CREATED)


class AddressDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        address = Address.objects.filter(pk=pk, user_id=request.user.id).first()
        if not address:
            return Response({'error': 'Address not found'}, status=status.HTTP_404_NOT_FOUND)
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
