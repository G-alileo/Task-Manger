"""
Integration tests for the complete authentication flow.

Tests the entire user journey from registration through authentication
to profile management with real database and JWT operations.
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.users.models import User


@pytest.mark.django_db
class TestAuthenticationFlow:
    """Test complete authentication workflow"""
    
    def setup_method(self):
        """Set up test client and data"""
        self.client = APIClient()
        self.register_url = reverse('users:register')
        self.login_url = reverse('users:login')
        self.profile_url = reverse('users:profile')
        
        self.test_user_data = {
            'email': 'testflow@example.com',
            'username': 'testflowuser',
            'password': 'SecurePass123!@#',
            'password_confirm': 'SecurePass123!@#',
            'first_name': 'Test',
            'last_name': 'Flow'
        }
    
    def test_complete_user_journey(self):
        """Test complete user journey: register -> login -> profile update"""
        
        # Step 1: Register
        register_response = self.client.post(
            self.register_url,
            self.test_user_data,
            format='json'
        )
        assert register_response.status_code == status.HTTP_201_CREATED
        assert 'data' in register_response.data
        user_id = register_response.data['data']['id']
        
        # Step 2: Login
        login_response = self.client.post(
            self.login_url,
            {
                'email': self.test_user_data['email'],
                'password': self.test_user_data['password']
            },
            format='json'
        )
        assert login_response.status_code == status.HTTP_200_OK
        assert 'tokens' in login_response.data['data']
        access_token = login_response.data['data']['tokens']['access']
        
        # Step 3: Access protected endpoint with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        profile_response = self.client.get(self.profile_url)
        assert profile_response.status_code == status.HTTP_200_OK
        assert profile_response.data['data']['id'] == user_id
        
        # Step 4: Update profile
        update_response = self.client.patch(
            self.profile_url,
            {'bio': 'Integration test bio'},
            format='json'
        )
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data['data']['bio'] == 'Integration test bio'
        
        # Step 5: Verify database persistence
        user = User.objects.get(id=user_id)
        assert user.bio == 'Integration test bio'
    
    def test_jwt_token_refresh_flow(self):
        """Test JWT token refresh mechanism"""
        
        # Register and login
        self.client.post(self.register_url, self.test_user_data, format='json')
        login_response = self.client.post(
            self.login_url,
            {
                'email': self.test_user_data['email'],
                'password': self.test_user_data['password']
            },
            format='json'
        )
        
        refresh_token = login_response.data['data']['tokens']['refresh']
        
        # Refresh access token
        refresh_url = reverse('users:token-refresh')
        refresh_response = self.client.post(
            refresh_url,
            {'refresh': refresh_token},
            format='json'
        )
        
        assert refresh_response.status_code == status.HTTP_200_OK
        assert 'access' in refresh_response.data
        
        # Use new access token
        new_access_token = refresh_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
        profile_response = self.client.get(self.profile_url)
        assert profile_response.status_code == status.HTTP_200_OK
    
    def test_unauthorized_access_without_token(self):
        """Test that protected endpoints reject requests without token"""
        
        response = self.client.get(self.profile_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_invalid_token_rejected(self):
        """Test that invalid tokens are rejected"""
        
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token_here')
        response = self.client.get(self.profile_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestRateLimiting:
    """Test rate limiting enforcement"""
    
    def setup_method(self):
        """Set up test client"""
        self.client = APIClient()
        self.login_url = reverse('users:login')
        
        # Create test user
        User.objects.create_user(
            email='ratelimit@example.com',
            username='ratelimituser',
            password='TestPass123!@#'
        )
    
    @pytest.mark.slow
    def test_login_rate_limiting(self):
        """Test that excessive login attempts are rate limited"""
        
        # Note: This test depends on your rate limit settings
        # Adjust the number of attempts based on your configuration
        
        attempts = 0
        max_attempts = 10
        rate_limited = False
        
        for i in range(max_attempts):
            response = self.client.post(
                self.login_url,
                {
                    'email': 'ratelimit@example.com',
                    'password': 'WrongPassword'
                },
                format='json'
            )
            
            if response.status_code == 429:
                rate_limited = True
                break
            
            attempts += 1
        
        # Should hit rate limit before max attempts
        assert rate_limited or attempts < max_attempts


@pytest.mark.django_db
class TestSecurityFeatures:
    """Test security features"""
    
    def setup_method(self):
        """Set up test client"""
        self.client = APIClient()
        self.register_url = reverse('users:register')
    
    def test_weak_password_rejected(self):
        """Test that weak passwords are rejected"""
        
        weak_passwords = ['123', 'password', '12345678']
        
        for weak_pass in weak_passwords:
            response = self.client.post(
                self.register_url,
                {
                    'email': f'test_{weak_pass}@example.com',
                    'username': f'user_{weak_pass}',
                    'password': weak_pass,
                    'password_confirm': weak_pass
                },
                format='json'
            )
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_password_not_returned_in_response(self):
        """Test that password is never returned in API responses"""
        
        # Register user
        response = self.client.post(
            self.register_url,
            {
                'email': 'secureuser@example.com',
                'username': 'secureuser',
                'password': 'SecurePass123!@#',
                'password_confirm': 'SecurePass123!@#'
            },
            format='json'
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'password' not in response.data['data']
        assert 'password_confirm' not in response.data['data']
