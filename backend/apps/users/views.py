"""
Optimized API views for user authentication and profile management.

This module contains views for user registration, login, profile operations,
and user listing with proper authentication, permission controls, and performance optimizations.
"""

import logging
from typing import Any
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django_ratelimit.decorators import ratelimit
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

from apps.core.exceptions import AuthenticationFailedException, ValidationException
from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UserListSerializer,
    ProfileSerializer,
    PasswordChangeSerializer
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
                description='User successfully registered'
            ),
            400: OpenApiResponse(description='Validation error')
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
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Use service layer for registration with transaction safety
        user = UserService.register_user(serializer.validated_data)
        
        # Serialize response
        user_data = UserSerializer(user).data
        
        logger.info(
            f"User registered: {user.email} (ID: {user.id})",
            extra={
                'user_id': user.id,
                'ip': request.META.get('REMOTE_ADDR')
            }
        )
        
        return Response(
            {
                'status': 'success',
                'message': 'User registered successfully',
                'data': user_data
            },
            status=status.HTTP_201_CREATED
        )


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
            200: OpenApiResponse(description='Login successful'),
            400: OpenApiResponse(description='Invalid credentials')
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
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Use service layer for authentication
        result = UserService.authenticate_user(email, password)
        
        user = result['user']
        tokens = result['tokens']
        
        # Serialize user data
        user_data = UserSerializer(user).data
        
        logger.info(
            f"User logged in: {user.email} (ID: {user.id})",
            extra={
                'user_id': user.id,
                'ip': request.META.get('REMOTE_ADDR')
            }
        )
        
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
                description='Profile retrieved successfully'
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
        serializer = UserSerializer(request.user)
        
        return Response(
            {
                'status': 'success',
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )
    
    @extend_schema(
        tags=['Users'],
        summary='Update user profile',
        description='Update the authenticated user\'s profile information.',
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
    def put(self, request: Any) -> Response:
        """
        Update the current user's profile (full update) using service layer.
        
        Args:
            request: HTTP request with profile update data
            
        Returns:
            Response: JSON response with updated user profile
        """
        serializer = ProfileSerializer(
            request.user,
            data=request.data,
            partial=False
        )
        serializer.is_valid(raise_exception=True)
        
        # Use service layer for update with transaction safety
        updated_user = UserService.update_profile(
            request.user,
            serializer.validated_data
        )
        
        # Serialize response
        user_data = UserSerializer(updated_user).data
        
        logger.info(
            f"Profile updated for user {updated_user.id}",
            extra={'user_id': updated_user.id}
        )
        
        return Response(
            {
                'status': 'success',
                'message': 'Profile updated successfully',
                'data': user_data
            },
            status=status.HTTP_200_OK
        )
    
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
        serializer = ProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        
        # Use service layer for update with transaction safety
        updated_user = UserService.update_profile(
            request.user,
            serializer.validated_data
        )
        
        # Serialize response
        user_data = UserSerializer(updated_user).data
        
        logger.info(
            f"Profile partially updated for user {updated_user.id}",
            extra={'user_id': updated_user.id}
        )
        
        return Response(
            {
                'status': 'success',
                'message': 'Profile updated successfully',
                'data': user_data
            },
            status=status.HTTP_200_OK
        )


class PasswordChangeView(APIView):
    """
    API endpoint for changing user password.
    
    Allows authenticated users to change their password.
    
    Permissions: Authenticated users only
    """
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Users'],
        summary='Change password',
        description='Change the authenticated user\'s password.',
        request=PasswordChangeSerializer,
        responses={
            200: OpenApiResponse(description='Password changed successfully'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication credentials not provided')
        }
    )
    def post(self, request: Any) -> Response:
        """
        Handle password change request.
        
        Args:
            request: HTTP request with password change data
            
        Returns:
            Response: JSON response with success or error message
        """
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        
        # Verify old password
        if not user.check_password(old_password):
            return Response(
                {
                    'status': 'error',
                    'message': 'Current password is incorrect'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Change password using service layer
        UserService.change_password(user, new_password)
        
        logger.info(
            f"Password changed for user {user.id}",
            extra={'user_id': user.id}
        )
        
        return Response(
            {
                'status': 'success',
                'message': 'Password changed successfully'
            },
            status=status.HTTP_200_OK
        )


class UserListView(generics.ListAPIView):
    """
    API endpoint for listing all users.
    
    Returns a paginated list of all users in the system.
    Only accessible by admin users (staff members).
    
    Permissions: Admin users only
    """
    
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        Return optimized user queryset with only needed fields.
        
        Uses select_related for any foreign keys and only() to fetch
        minimal fields, reducing database load and response time.
        """
        return User.objects.select_related().only(
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'is_active',
            'is_staff',
            'created_at'
        ).order_by('-created_at')
    
    @extend_schema(
        tags=['Users'],
        summary='List all users',
        description='Retrieve a paginated list of all users. Only accessible by admin users.',
        responses={
            200: OpenApiResponse(
                response=UserListSerializer(many=True),
                description='List of users retrieved successfully'
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


class UserDetailView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving a specific user's details.
    
    Only accessible by admin users.
    
    Permissions: Admin users only
    """
    
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return optimized queryset."""
        return User.objects.select_related().only(
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'profile_picture',
            'bio',
            'is_active',
            'is_staff',
            'created_at',
            'updated_at'
        )
    
    @extend_schema(
        tags=['Users'],
        summary='Get user details',
        description='Retrieve detailed information about a specific user. Only accessible by admin users.',
        responses={
            200: OpenApiResponse(
                response=UserSerializer,
                description='User details retrieved successfully'
            ),
            401: OpenApiResponse(description='Authentication credentials not provided'),
            403: OpenApiResponse(description='Permission denied - admin access required'),
            404: OpenApiResponse(description='User not found')
        }
    )
    def get(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        """Handle GET request for user details."""
        return super().get(request, *args, **kwargs)