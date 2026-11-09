from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from .models import UserProfile


class UserProfileAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        UserProfile.objects.all().delete()

        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="StrongPass123",
            first_name="Test",
            last_name="User",
        )

        self.profile = UserProfile.objects.create(
            user_id=self.user.id,
            username=self.user.username,
            email=self.user.email,
            first_name=self.user.first_name,
            last_name=self.user.last_name,
        )

    def authenticate(self):
        response = self.client.post(
            "/api/auth/token/",
            {"username": self.user.username, "password": "StrongPass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data.get("access")
        self.assertIsNotNone(token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_health_check_endpoint(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')

    def test_profile_get_requires_authentication(self):
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_get_returns_user_profile(self):
        self.authenticate()
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.user.username)
        self.assertEqual(response.data["email"], self.user.email)

    def test_profile_update_saves_changes_to_user_and_profile(self):
        self.authenticate()
        payload = {
            "first_name": "Updated",
            "last_name": "Name",
        }
        response = self.client.put("/api/auth/profile/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Updated")
        self.assertEqual(response.data["last_name"], "Name")

    def test_register_creates_user_and_user_profile(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "NewPass123!",
                "password2": "NewPass123!",
                "first_name": "New",
                "last_name": "User",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertTrue(User.objects.filter(username="newuser").exists())

        created_user = User.objects.get(username="newuser")
        profile = UserProfile.objects.filter(user_id=created_user.id).first()
        self.assertIsNotNone(profile)
        self.assertEqual(profile.email, "newuser@example.com")
