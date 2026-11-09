from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer, RegisterSerializer, LoginSerializer
from .permissions import IsSuperAdminUser


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        UserProfile(
            user_id=user.id,
            username=user.username,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
        ).save()

        refresh = RefreshToken.for_user(user)
        refresh['role'] = 'superadmin' if user.is_superuser else ('admin' if user.is_staff else 'customer')
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class AdminRegisterView(generics.CreateAPIView):
    """Separate from the customer RegisterView above — this is the endpoint
    the Admin Register page hits, and it actually grants is_staff=True so
    admin-only endpoints (verify/flag sellers, products, customers, queries)
    work immediately after signing up. SuperAdmin (is_superuser) is
    intentionally NOT grantable here — that stays a deliberate
    `python manage.py createsuperuser` step."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_staff = True
        user.save()

        UserProfile(
            user_id=user.id,
            username=user.username,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
        ).save()

        refresh = RefreshToken.for_user(user)
        refresh['role'] = 'admin'
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
        refresh['role'] = 'superadmin' if user.is_superuser else ('admin' if user.is_staff else 'customer')
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ---------------------------------------------------------------------------
# Admin: view + flag customers.  SuperAdmin: remove a flagged customer.
# ---------------------------------------------------------------------------

class AdminCustomerListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        query = UserProfile.objects.all()
        flagged_only = request.query_params.get('flagged')
        if flagged_only == 'true':
            query = query.filter(is_flagged=True)
        return Response(UserProfileSerializer(query, many=True).data)


class AdminCustomerFlagView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, user_id):
        profile = UserProfile.objects.filter(user_id=user_id).first()
        if not profile:
            return Response({'error': 'Customer not found.'}, status=status.HTTP_404_NOT_FOUND)
        profile.is_flagged = True
        profile.flag_reason = request.data.get('reason', '')
        profile.save()
        return Response(UserProfileSerializer(profile).data)


class AdminCustomerUnflagView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, user_id):
        profile = UserProfile.objects.filter(user_id=user_id).first()
        if not profile:
            return Response({'error': 'Customer not found.'}, status=status.HTTP_404_NOT_FOUND)
        profile.is_flagged = False
        profile.flag_reason = ''
        profile.save()
        return Response(UserProfileSerializer(profile).data)


class SuperAdminCustomerRemoveView(APIView):
    permission_classes = [IsSuperAdminUser]

    def delete(self, request, user_id):
        profile = UserProfile.objects.filter(user_id=user_id).first()
        if not profile:
            return Response({'error': 'Customer not found.'}, status=status.HTTP_404_NOT_FOUND)
        profile.delete()
        User.objects.filter(id=user_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)