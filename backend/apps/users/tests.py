"""
Test suite for User API endpoints.

This module contains unit tests for user registration, authentication,
profile management, and permission enforcement.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status

from .models import User


class UserRegistrationTestCase(APITestCase):
    """
    Test cases for user registration endpoint.
    """
    
    def setUp(self):
        """Set up test client and URL."""
        self.client = APIClient()
        self.register_url = reverse('users:register')
        self.valid_payload = {
            'email': 'testuser@example.com',
            'username': 'testuser',
            'password': 'TestPass123!@#',
            'password_confirm': 'TestPass123!@#',
            'first_name': 'Test',
            'last_name': 'User'
        }
    
    def test_register_user_success(self):
        """Test successful user registration."""
        response = self.client.post(self.register_url, self.valid_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('data', response.data)
        self.assertEqual(response.data['data']['email'], self.valid_payload['email'])
        self.assertEqual(response.data['data']['username'], self.valid_payload['username'])
        
        # Verify user exists in database
        self.assertTrue(User.objects.filter(email=self.valid_payload['email']).exists())
    
    def test_register_user_duplicate_email(self):
        """Test registration with duplicate email fails."""
        # Create first user
        self.client.post(self.register_url, self.valid_payload, format='json')
        
        # Attempt to create second user with same email
        duplicate_payload = self.valid_payload.copy()
        duplicate_payload['username'] = 'differentuser'
        response = self.client.post(self.register_url, duplicate_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('email', response.data['errors'])
    
    def test_register_user_duplicate_username(self):
        """Test registration with duplicate username fails."""
        # Create first user
        self.client.post(self.register_url, self.valid_payload, format='json')
        
        # Attempt to create second user with same username
        duplicate_payload = self.valid_payload.copy()
        duplicate_payload['email'] = 'different@example.com'
        response = self.client.post(self.register_url, duplicate_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('username', response.data['errors'])
    
    def test_register_user_password_mismatch(self):
        """Test registration fails when passwords don't match."""
        invalid_payload = self.valid_payload.copy()
        invalid_payload['password_confirm'] = 'DifferentPass123!@#'
        
        response = self.client.post(self.register_url, invalid_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('password_confirm', response.data['errors'])
    
    def test_register_user_weak_password(self):
        """Test registration fails with weak password."""
        invalid_payload = self.valid_payload.copy()
        invalid_payload['password'] = '123'
        invalid_payload['password_confirm'] = '123'
        
        response = self.client.post(self.register_url, invalid_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
    
    def test_register_user_missing_required_fields(self):
        """Test registration fails with missing required fields."""
        invalid_payload = {
            'email': 'test@example.com'
        }
        
        response = self.client.post(self.register_url, invalid_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data['errors'])
        self.assertIn('password', response.data['errors'])


class UserLoginTestCase(APITestCase):
    """
    Test cases for user login endpoint.
    """
    
    def setUp(self):
        """Set up test client, URL, and create test user."""
        self.client = APIClient()
        self.login_url = reverse('users:login')
        self.user = User.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='TestPass123!@#'
        )
    
    def test_login_success(self):
        """Test successful user login."""
        payload = {
            'email': 'testuser@example.com',
            'password': 'TestPass123!@#'
        }
        
        response = self.client.post(self.login_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('data', response.data)
        self.assertIn('user', response.data['data'])
        self.assertIn('tokens', response.data['data'])
        self.assertIn('access', response.data['data']['tokens'])
        self.assertIn('refresh', response.data['data']['tokens'])
    
    def test_login_invalid_credentials(self):
        """Test login fails with invalid credentials."""
        payload = {
            'email': 'testuser@example.com',
            'password': 'WrongPassword123'
        }
        
        response = self.client.post(self.login_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
    
    def test_login_nonexistent_user(self):
        """Test login fails for nonexistent user."""
        payload = {
            'email': 'nonexistent@example.com',
            'password': 'TestPass123!@#'
        }
        
        response = self.client.post(self.login_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
    
    def test_login_inactive_user(self):
        """Test login fails for inactive user."""
        self.user.is_active = False
        self.user.save()
        
        payload = {
            'email': 'testuser@example.com',
            'password': 'TestPass123!@#'
        }
        
        response = self.client.post(self.login_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
    
    def test_login_missing_credentials(self):
        """Test login fails with missing credentials."""
        payload = {
            'email': 'testuser@example.com'
        }
        
        response = self.client.post(self.login_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserProfileTestCase(APITestCase):
    """
    Test cases for user profile endpoint.
    """
    
    def setUp(self):
        """Set up test client, URL, and create authenticated user."""
        self.client = APIClient()
        self.profile_url = reverse('users:profile')
        self.user = User.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='TestPass123!@#',
            first_name='Test',
            last_name='User'
        )
    
    def test_get_profile_success(self):
        """Test authenticated user can retrieve their profile."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['data']['email'], self.user.email)
        self.assertEqual(response.data['data']['username'], self.user.username)
    
    def test_get_profile_unauthenticated(self):
        """Test unauthenticated user cannot access profile."""
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_profile_success(self):
        """Test authenticated user can update their profile."""
        self.client.force_authenticate(user=self.user)
        
        payload = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'bio': 'Updated bio text',
            'profile_picture': 'https://example.com/new-pic.jpg'
        }
        
        response = self.client.put(self.profile_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['data']['first_name'], 'Updated')
        self.assertEqual(response.data['data']['last_name'], 'Name')
        self.assertEqual(response.data['data']['bio'], 'Updated bio text')
        
        # Verify database is updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.bio, 'Updated bio text')
    
    def test_partial_update_profile_success(self):
        """Test authenticated user can partially update their profile."""
        self.client.force_authenticate(user=self.user)
        
        payload = {
            'bio': 'Only updating bio'
        }
        
        response = self.client.patch(self.profile_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['data']['bio'], 'Only updating bio')
        
        # Verify other fields remain unchanged
        self.assertEqual(response.data['data']['first_name'], 'Test')
        self.assertEqual(response.data['data']['last_name'], 'User')
    
    def test_update_profile_invalid_data(self):
        """Test profile update fails with invalid data."""
        self.client.force_authenticate(user=self.user)
        
        payload = {
            'bio': 'x' * 600  # Exceeds max length of 500
        }
        
        response = self.client.patch(self.profile_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status'], 'error')
    
    def test_update_profile_unauthenticated(self):
        """Test unauthenticated user cannot update profile."""
        payload = {
            'first_name': 'Hacker',
            'last_name': 'Attempt'
        }
        
        response = self.client.put(self.profile_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserListTestCase(APITestCase):
    """
    Test cases for user list endpoint (admin only).
    """
    
    def setUp(self):
        """Set up test client, URL, and create users."""
        self.client = APIClient()
        self.list_url = reverse('users:user-list')
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            username='regularuser',
            password='TestPass123!@#'
        )
        
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!@#'
        )
        
        # Create additional users for list testing
        for i in range(5):
            User.objects.create_user(
                email=f'user{i}@example.com',
                username=f'user{i}',
                password='TestPass123!@#'
            )
    
    def test_list_users_as_admin(self):
        """Test admin user can retrieve user list."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(len(response.data['results']), 5)
    
    def test_list_users_as_regular_user(self):
        """Test regular user cannot access user list."""
        self.client.force_authenticate(user=self.regular_user)
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_users_unauthenticated(self):
        """Test unauthenticated user cannot access user list."""
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class JWTTokenTestCase(APITestCase):
    """
    Test cases for JWT token operations.
    """
    
    def setUp(self):
        """Set up test client and create test user."""
        self.client = APIClient()
        self.login_url = reverse('users:login')
        self.refresh_url = reverse('users:token-refresh')
        self.profile_url = reverse('users:profile')
        
        self.user = User.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='TestPass123!@#'
        )
    
    def test_token_refresh_success(self):
        """Test JWT token refresh works correctly."""
        # Login to get tokens
        login_payload = {
            'email': 'testuser@example.com',
            'password': 'TestPass123!@#'
        }
        login_response = self.client.post(self.login_url, login_payload, format='json')
        refresh_token = login_response.data['data']['tokens']['refresh']
        
        # Refresh token
        refresh_payload = {
            'refresh': refresh_token
        }
        response = self.client.post(self.refresh_url, refresh_payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_access_protected_endpoint_with_token(self):
        """Test accessing protected endpoint with valid JWT token."""
        # Login to get tokens
        login_payload = {
            'email': 'testuser@example.com',
            'password': 'TestPass123!@#'
        }
        login_response = self.client.post(self.login_url, login_payload, format='json')
        access_token = login_response.data['data']['tokens']['access']
        
        # Access protected endpoint with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_access_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token fails."""
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
