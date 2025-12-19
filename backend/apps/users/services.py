"""
Service layer for user business logic.

This module encapsulates all business logic related to users,
including authentication, profile management, and user operations.
"""

import logging
from typing import Dict, Any, Optional
from django.db import transaction
from django.contrib.auth import authenticate
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.exceptions import (
    AuthenticationFailedException,
    ValidationException,
    ResourceNotFoundException
)
from .models import User


logger = logging.getLogger('apps.users')


class UserService:
    """
    Service class for user-related business logic.
    
    Centralizes all user operations including authentication,
    registration, and profile management.
    """
    
    CACHE_TIMEOUT = 600  # 10 minutes
    
    @staticmethod
    def register_user(validated_data: Dict[str, Any]) -> User:
        """
        Register a new user with validated data.
        
        Args:
            validated_data: Validated user registration data
            
        Returns:
            User: Newly created user instance
            
        Raises:
            ValidationException: If user creation fails
        """
        try:
            with transaction.atomic():
                # Remove password_confirm
                validated_data.pop('password_confirm', None)
                
                # Extract password for proper hashing
                password = validated_data.pop('password')
                
                # Create user
                user = User.objects.create_user(password=password, **validated_data)
                
                logger.info(
                    f"New user registered: {user.email} (ID: {user.id})",
                    extra={'user_id': user.id, 'email': user.email}
                )
                
                return user
                
        except Exception as e:
            logger.error(f"Failed to register user: {str(e)}", exc_info=True)
            raise ValidationException(f"User registration failed: {str(e)}")
    
    @staticmethod
    def authenticate_user(email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate a user and generate JWT tokens.
        
        Args:
            email: User's email address
            password: User's password
            
        Returns:
            Dict: User instance and authentication tokens
            
        Raises:
            AuthenticationFailedException: If authentication fails
        """
        try:
            email = email.lower()
            
            # Get user
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                logger.warning(f"Authentication failed: User not found for email {email}")
                raise AuthenticationFailedException("Invalid credentials.")
            
            # Check password
            if not user.check_password(password):
                logger.warning(
                    f"Authentication failed: Invalid password for user {user.id}",
                    extra={'user_id': user.id, 'email': email}
                )
                raise AuthenticationFailedException("Invalid credentials.")
            
            # Check if user is active
            if not user.is_active:
                logger.warning(
                    f"Authentication failed: Inactive user account {user.id}",
                    extra={'user_id': user.id, 'email': email}
                )
                raise AuthenticationFailedException("User account is disabled.")
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            tokens = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
            
            logger.info(
                f"User authenticated successfully: {user.email} (ID: {user.id})",
                extra={'user_id': user.id, 'email': user.email}
            )
            
            return {
                'user': user,
                'tokens': tokens
            }
            
        except AuthenticationFailedException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}", exc_info=True)
            raise AuthenticationFailedException("Authentication failed due to an error.")
    
    @staticmethod
    def update_profile(user: User, validated_data: Dict[str, Any]) -> User:
        """
        Update user profile information.
        
        Args:
            user: User instance to update
            validated_data: Validated profile data
            
        Returns:
            User: Updated user instance
            
        Raises:
            ValidationException: If update fails
        """
        try:
            with transaction.atomic():
                for field, value in validated_data.items():
                    setattr(user, field, value)
                
                user.save()
                
                # Invalidate user cache
                UserService._invalidate_user_cache(user.id)
                
                logger.info(
                    f"Profile updated for user: {user.email} (ID: {user.id})",
                    extra={'user_id': user.id}
                )
                
                return user
                
        except Exception as e:
            logger.error(
                f"Failed to update profile for user {user.id}: {str(e)}",
                exc_info=True,
                extra={'user_id': user.id}
            )
            raise ValidationException(f"Profile update failed: {str(e)}")
    
    @staticmethod
    def get_user_by_id(user_id: int, use_cache: bool = True) -> User:
        """
        Get user by ID with optional caching.
        
        Args:
            user_id: User's ID
            use_cache: Whether to use cache
            
        Returns:
            User: User instance
            
        Raises:
            ResourceNotFoundException: If user not found
        """
        cache_key = f'user_{user_id}'
        
        if use_cache:
            cached_user = cache.get(cache_key)
            if cached_user:
                return cached_user
        
        try:
            user = User.objects.get(id=user_id)
            
            if use_cache:
                cache.set(cache_key, user, UserService.CACHE_TIMEOUT)
            
            return user
            
        except User.DoesNotExist:
            logger.warning(f"User not found: ID={user_id}")
            raise ResourceNotFoundException(f"User with ID {user_id} not found.")
    
    @staticmethod
    def deactivate_user(user: User) -> None:
        """
        Deactivate a user account.
        
        Args:
            user: User instance to deactivate
        """
        try:
            with transaction.atomic():
                user.is_active = False
                user.save()
                
                # Invalidate cache
                UserService._invalidate_user_cache(user.id)
                
                logger.warning(
                    f"User account deactivated: {user.email} (ID: {user.id})",
                    extra={'user_id': user.id}
                )
                
        except Exception as e:
            logger.error(
                f"Failed to deactivate user {user.id}: {str(e)}",
                exc_info=True,
                extra={'user_id': user.id}
            )
            raise ValidationException(f"Failed to deactivate user: {str(e)}")
    
    @staticmethod
    def _invalidate_user_cache(user_id: int) -> None:
        """Invalidate all cache entries for a user"""
        cache.delete(f'user_{user_id}')
