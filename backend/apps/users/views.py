"""
API views for user authentication and profile management.

This module contains views for user registration, login, profile operations,
and user listing with proper authentication and permission controls.
"""

import logging
from typing import Dict, Any
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

from apps.core.exceptions import AuthenticationFailedException, ValidationException
from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ProfileSerializer
)
from .services import UserService

# Setup logger
logger = logging.getLogger('apps.users')


@method_decorator(ratelimit(key='ip', rate='3/h', method='POST', block=True), name='post')
class RegisterView(APIView):
    """
    API endpoint for user registration.
    
    Allows new users to create an account with email, username, and password.
    Returns the created user data upon successful registration.
    Rate limited to 3 registrations per hour per IP.
    
    Permissions: Public (no authentication required)
    """
    
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Users'],
        summary='Register a new user',
        description='Create a new user account with email, username, and password.',
        request=RegisterSerializer,
        responses={
            201: OpenApiResponse(
                response=UserSerializer,
                description='User successfully registered',
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'status': 'success',
                            'message': 'User registered successfully',
                            'data': {
                                'id': 1,
                                'email': 'user@example.com',
                                'username': 'johndoe',
                                'first_name': 'John',
                                'last_name': 'Doe',
                                'full_name': 'John Doe',
                                'profile_picture': None,
                                'bio': '',
                                'is_active': True,
                                'is_staff': False,
                                'created_at': '2025-12-19T10:00:00Z',
                                'updated_at': '2025-12-19T10:00:00Z'
                            }
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                description='Validation error',
                examples=[
                    OpenApiExample(
                        'Validation Error',
                        value={
                            'status': 'error',
                            'message': 'Validation failed',
                            'errors': {
                                'email': ['A user with this email already exists.'],
                                'password': ['This password is too common.']
                            }
                        }
                    )
                ]
            )
        }
    )
    def post(self, request: Any) -> Response:
        """
        Handle POST request for user registration using service layer.
        
        Args:
            request: HTTP request containing registration data
            
        Returns:
            Response: JSON response with created user or validation errors
        """
        try:
            serializer = RegisterSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Use service layer for registration with transaction safety
            user = UserService.register_user(serializer.validated_data)
            
            # Serialize response
            user_data = UserSerializer(user).data
            
            logger.info(f"User registered: {user.email} (ID: {user.id}) from IP: {request.META.get('REMOTE_ADDR')}")
            
            return Response(
                {
                    'status': 'success',
                    'message': 'User registered successfully',
                    'data': user_data
                },
                status=status.HTTP_201_CREATED
            )
            
        except ValidationException:
            raise
        except Exception as e:
            logger.error(f"Unexpected registration error: {str(e)}", exc_info=True)
            raise ValidationException("Registration failed")


@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True), name='post')
class LoginView(APIView):
    """
    API endpoint for user authentication.
    
    Validates user credentials and issues JWT access and refresh tokens.
    Returns user data along with authentication tokens.
    Rate limited to 5 login attempts per minute per IP.
    
    Permissions: Public (no authentication required)
    """
    
    permission_classes = [AllowAny]
    
    @extend_schema(
        tags=['Users'],
        summary='User login',
        description='Authenticate user with email and password. Returns JWT tokens on success.',
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(
                description='Login successful',
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'status': 'success',
                            'message': 'Login successful',
                            'data': {
                                'user': {
                                    'id': 1,
                                    'email': 'user@example.com',
                                    'username': 'johndoe',
                                    'first_name': 'John',
                                    'last_name': 'Doe',
                                    'full_name': 'John Doe'
                                },
                                'tokens': {
                                    'access': 'eyJ0eXAiOiJKV1QiLCJhbGc...',
                                    'refresh': 'eyJ0eXAiOiJKV1QiLCJhbGc...'
                                }
                            }
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                description='Invalid credentials',
                examples=[
                    OpenApiExample(
                        'Invalid Credentials',
                        value={
                            'status': 'error',
                            'message': 'Invalid credentials'
                        }
                    )
                ]
            )
        }
    )
    def post(self, request: Any) -> Response:
        """
        Handle POST request for user login using service layer.
        
        Args:
            request: HTTP request containing login credentials
            
        Returns:
            Response: JSON response with user data and JWT tokens or error
        """
        try:
            email = request.data.get('email', '').lower()
            password = request.data.get('password', '')
            
            if not email or not password:
                raise ValidationException("Email and password are required")
            
            # Use service layer for authentication
            result = UserService.authenticate_user(email, password)
            
            user = result['user']
            tokens = result['tokens']
            
            # Serialize user data
            user_data = UserSerializer(user).data
            
            logger.info(f"User logged in: {user.email} (ID: {user.id}) from IP: {request.META.get('REMOTE_ADDR')}")
            
            return Response(
                {
                    'status': 'success',
                    'message': 'Login successful',
                    'data': {
                        'user': user_data,
                        'tokens': tokens
                    }
                },
                status=status.HTTP_200_OK
            )
            
        except AuthenticationFailedException as e:
            logger.warning(f"Failed login: {request.data.get('email')} from IP: {request.META.get('REMOTE_ADDR')}")
            return Response(
                {'status': 'error', 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected login error: {str(e)}", exc_info=True)
            raise ValidationException("Login failed")


class ProfileView(APIView):
    """
    API endpoint for user profile operations.
    
    Allows authenticated users to view and update their profile information.
    GET: Retrieve current user's profile
    PUT/PATCH: Update current user's profile fields
    
    Permissions: Authenticated users only
    """
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Users'],
        summary='Get user profile',
        description='Retrieve the authenticated user\'s profile information.',
        responses={
            200: OpenApiResponse(
                response=UserSerializer,
                description='Profile retrieved successfully',
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'status': 'success',
                            'data': {
                                'id': 1,
                                'email': 'user@example.com',
                                'username': 'johndoe',
                                'first_name': 'John',
                                'last_name': 'Doe',
                                'full_name': 'John Doe',
                                'profile_picture': 'https://example.com/profile.jpg',
                                'bio': 'Software developer and task management enthusiast',
                                'is_active': True,
                                'is_staff': False,
                                'created_at': '2025-12-19T10:00:00Z',
                                'updated_at': '2025-12-19T10:00:00Z'
                            }
                        }
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication credentials not provided')
        }
    )
    def get(self, request: Any) -> Response:
        """
        Retrieve the current user's profile.
        
        Args:
            request: HTTP request with authenticated user
            
        Returns:
            Response: JSON response with user profile data
        """
        try:
            user = request.user
            serializer = UserSerializer(user)
            
            return Response(
                {
                    'status': 'success',
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error retrieving profile: {str(e)}", exc_info=True)
            raise ValidationException("Failed to retrieve profile")
    
    @extend_schema(
        tags=['Users'],
        summary='Update user profile',
        description='Update the authenticated user\'s profile information (first_name, last_name, bio, profile_picture).',
        request=ProfileSerializer,
        responses={
            200: OpenApiResponse(
                response=UserSerializer,
                description='Profile updated successfully',
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'status': 'success',
                            'message': 'Profile updated successfully',
                            'data': {
                                'id': 1,
                                'email': 'user@example.com',
                                'username': 'johndoe',
                                'first_name': 'John',
                                'last_name': 'Doe',
                                'full_name': 'John Doe',
                                'profile_picture': 'https://example.com/new-profile.jpg',
                                'bio': 'Updated bio',
                                'is_active': True,
                                'is_staff': False
                            }
                        }
                    )
                ]
            ),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication credentials not provided')
        }
    )
    def put(self, request: Any) -> Response:
        """
        Update the current user's profile (full update) using service layer.
        
        Args:
            request: HTTP request with profile update data
            
        Returns:
            Response: JSON response with updated user profile
        """
        try:
            user = request.user
            serializer = ProfileSerializer(data=request.data, partial=False)
            serializer.is_valid(raise_exception=True)
            
            # Use service layer for update with transaction safety
            updated_user = UserService.update_profile(user, serializer.validated_data)
            
            # Serialize response
            user_data = UserSerializer(updated_user).data
            
            logger.info(f"Profile updated for user {user.id}")
            
            return Response(
                {
                    'status': 'success',
                    'message': 'Profile updated successfully',
                    'data': user_data
                },
                status=status.HTTP_200_OK
            )
            
        except ValidationException:
            raise
        except Exception as e:
            logger.error(f"Unexpected profile update error: {str(e)}", exc_info=True)
            raise ValidationException("Profile update failed")
    
    @extend_schema(
        tags=['Users'],
        summary='Partially update user profile',
        description='Partially update the authenticated user\'s profile information.',
        request=ProfileSerializer,
        responses={
            200: OpenApiResponse(
                response=UserSerializer,
                description='Profile updated successfully'
            ),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication credentials not provided')
        }
    )
    def patch(self, request: Any) -> Response:
        """
        Partially update the current user's profile using service layer.
        
        Args:
            request: HTTP request with partial profile update data
            
        Returns:
            Response: JSON response with updated user profile
        """
        try:
            user = request.user
            serializer = ProfileSerializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # Use service layer for update with transaction safety
            updated_user = UserService.update_profile(user, serializer.validated_data)
            
            # Serialize response
            user_data = UserSerializer(updated_user).data
            
            logger.info(f"Profile partially updated for user {user.id}")
            
            return Response(
                {
                    'status': 'success',
                    'message': 'Profile updated successfully',
                    'data': user_data
                },
                status=status.HTTP_200_OK
            )
            
        except ValidationException:
            raise
        except Exception as e:
            logger.error(f"Unexpected profile update error: {str(e)}", exc_info=True)
            raise ValidationException("Profile update failed")


class UserListView(generics.ListAPIView):
    """
    API endpoint for listing all users.
    
    Returns a paginated list of all users in the system.
    Only accessible by admin users (staff members).
    
    Permissions: Admin users only
    """
    
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Return optimized user queryset with only needed fields"""
        return User.objects.all().order_by('-created_at').only(
            'id', 'email', 'username', 'first_name', 'last_name',
            'is_active', 'is_staff', 'created_at', 'updated_at'
        )
    
    @extend_schema(
        tags=['Users'],
        summary='List all users',
        description='Retrieve a paginated list of all users. Only accessible by admin users.',
        responses={
            200: OpenApiResponse(
                response=UserSerializer(many=True),
                description='List of users retrieved successfully',
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'status': 'success',
                            'count': 25,
                            'next': 'http://localhost:8000/api/users/list/?page=2',
                            'previous': None,
                            'results': [
                                {
                                    'id': 1,
                                    'email': 'user@example.com',
                                    'username': 'johndoe',
                                    'first_name': 'John',
                                    'last_name': 'Doe',
                                    'full_name': 'John Doe',
                                    'is_active': True,
                                    'is_staff': False
                                }
                            ]
                        }
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication credentials not provided'),
            403: OpenApiResponse(description='Permission denied - admin access required')
        }
    )
    def get(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        """
        Handle GET request for user list.
        
        Args:
            request: HTTP request
            *args: Additional positional arguments
            **kwargs: Additional keyword arguments
            
        Returns:
            Response: JSON response with paginated user list
        """
        return super().get(request, *args, **kwargs)
