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

    def test_profile_get_requires_authentication(self):
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_get_returns_user_profile(self):
        self.authenticate()

        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.user.username)
        self.assertEqual(response.data["email"], self.user.email)
        self.assertEqual(response.data["first_name"], self.user.first_name)
        self.assertEqual(response.data["last_name"], self.user.last_name)

    def test_profile_update_saves_changes_to_user_and_profile(self):
        self.authenticate()

        payload = {
            "username": self.user.username,
            "email": "updated@example.com",
            "first_name": "Updated",
            "last_name": "Name",
        }
        response = self.client.put("/api/auth/profile/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], payload["email"])
        self.assertEqual(response.data["first_name"], payload["first_name"])
        self.assertEqual(response.data["last_name"], payload["last_name"])

        self.user.refresh_from_db()
        updated_profile = UserProfile.objects.filter(user_id=self.user.id).first()

        self.assertEqual(self.user.email, payload["email"])
        self.assertEqual(self.user.first_name, payload["first_name"])
        self.assertEqual(self.user.last_name, payload["last_name"])
        self.assertIsNotNone(updated_profile)
        self.assertEqual(updated_profile.email, payload["email"])
        self.assertEqual(updated_profile.first_name, payload["first_name"])
        self.assertEqual(updated_profile.last_name, payload["last_name"])

    def test_profile_partial_update_supports_patch(self):
        self.authenticate()

        payload = {
            "email": "patched@example.com",
            "first_name": "Patched",
        }
        response = self.client.patch("/api/auth/profile/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], payload["email"])
        self.assertEqual(response.data["first_name"], payload["first_name"])
        self.assertEqual(response.data["last_name"], self.user.last_name)

        self.user.refresh_from_db()
        updated_profile = UserProfile.objects.filter(user_id=self.user.id).first()

        self.assertEqual(self.user.email, payload["email"])
        self.assertEqual(self.user.first_name, payload["first_name"])
        self.assertEqual(updated_profile.email, payload["email"])
        self.assertEqual(updated_profile.first_name, payload["first_name"])

    def test_change_password_requires_authentication(self):
        response = self.client.post("/api/auth/change-password/", {
            "old_password": "StrongPass123",
            "new_password": "NewPass123",
            "confirm_password": "NewPass123",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_updates_user_password(self):
        self.authenticate()

        response = self.client.post("/api/auth/change-password/", {
            "old_password": "StrongPass123",
            "new_password": "NewPass123",
            "confirm_password": "NewPass123",
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPass123"))

    def test_change_password_rejects_invalid_old_password(self):
        self.authenticate()

        response = self.client.post("/api/auth/change-password/", {
            "old_password": "WrongPass123",
            "new_password": "NewPass123",
            "confirm_password": "NewPass123",
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_creates_user_and_user_profile(self):
        UserProfile.objects.all().delete()
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "NewPass123",
                "password2": "NewPass123",
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
        self.assertEqual(profile.first_name, "New")
        self.assertEqual(profile.last_name, "User")
