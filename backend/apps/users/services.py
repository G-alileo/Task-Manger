"""
This module encapsulates all business logic related to users,
including authentication, profile management, and user operations
with performance optimizations.
"""

import logging
from typing import Dict, Any, Optional, List
from django.db import transaction
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
    registration, and profile management with caching and optimization.
    """
    
    CACHE_TIMEOUT = 600  # 10 minutes
    CACHE_PREFIX = 'user'
    
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
            email = email.lower().strip()
            
            # Optimize query - only fetch fields needed for authentication
            try:
                user = User.objects.only(
                    'id', 'email', 'password', 'is_active', 
                    'first_name', 'last_name', 'username'
                ).get(email=email)
            except User.DoesNotExist:
                logger.warning(f"Authentication failed: User not found for email {email}")
                raise AuthenticationFailedException("Invalid credentials.")
            
            # Check if user is active first (faster check)
            if not user.is_active:
                logger.warning(
                    f"Authentication failed: Inactive user account {user.id}",
                    extra={'user_id': user.id, 'email': email}
                )
                raise AuthenticationFailedException("User account is disabled.")
            
            # Check password
            if not user.check_password(password):
                logger.warning(
                    f"Authentication failed: Invalid password for user {user.id}",
                    extra={'user_id': user.id, 'email': email}
                )
                raise AuthenticationFailedException("Invalid credentials.")
            
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
                # Only update provided fields
                update_fields = []
                for field, value in validated_data.items():
                    if getattr(user, field) != value:
                        setattr(user, field, value)
                        update_fields.append(field)
                
                # Only save if there are changes
                if update_fields:
                    update_fields.append('updated_at')
                    user.save(update_fields=update_fields)
                    
                    # Invalidate user cache
                    UserService._invalidate_user_cache(user.id)
                    
                    logger.info(
                        f"Profile updated for user: {user.email} (ID: {user.id}), "
                        f"fields: {', '.join(update_fields)}",
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
    def change_password(user: User, new_password: str) -> None:
        """
        Change user password.
        
        Args:
            user: User instance
            new_password: New password (plaintext, will be hashed)
            
        Raises:
            ValidationException: If password change fails
        """
        try:
            with transaction.atomic():
                user.set_password(new_password)
                user.save(update_fields=['password', 'updated_at'])
                
                # Invalidate user cache
                UserService._invalidate_user_cache(user.id)
                
                logger.info(
                    f"Password changed for user: {user.email} (ID: {user.id})",
                    extra={'user_id': user.id}
                )
                
        except Exception as e:
            logger.error(
                f"Failed to change password for user {user.id}: {str(e)}",
                exc_info=True,
                extra={'user_id': user.id}
            )
            raise ValidationException(f"Password change failed: {str(e)}")
    
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
        cache_key = f'{UserService.CACHE_PREFIX}_{user_id}'
        
        if use_cache:
            cached_user = cache.get(cache_key)
            if cached_user:
                logger.debug(f"Cache hit for user {user_id}")
                return cached_user
        
        try:
            user = User.objects.get(id=user_id)
            
            if use_cache:
                cache.set(cache_key, user, UserService.CACHE_TIMEOUT)
                logger.debug(f"Cached user {user_id}")
            
            return user
            
        except User.DoesNotExist:
            logger.warning(f"User not found: ID={user_id}")
            raise ResourceNotFoundException(f"User with ID {user_id} not found.")
    
    @staticmethod
    def get_user_by_email(email: str, use_cache: bool = True) -> User:
        """
        Get user by email with optional caching.
        
        Args:
            email: User's email address
            use_cache: Whether to use cache
            
        Returns:
            User: User instance
            
        Raises:
            ResourceNotFoundException: If user not found
        """
        email = email.lower().strip()
        cache_key = f'{UserService.CACHE_PREFIX}_email_{email}'
        
        if use_cache:
            cached_user = cache.get(cache_key)
            if cached_user:
                logger.debug(f"Cache hit for user email {email}")
                return cached_user
        
        try:
            user = User.objects.get(email=email)
            
            if use_cache:
                cache.set(cache_key, user, UserService.CACHE_TIMEOUT)
                logger.debug(f"Cached user by email {email}")
            
            return user
            
        except User.DoesNotExist:
            logger.warning(f"User not found: email={email}")
            raise ResourceNotFoundException(f"User with email {email} not found.")
    
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
                user.save(update_fields=['is_active', 'updated_at'])
                
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
    def activate_user(user: User) -> None:
        """
        Activate a user account.
        
        Args:
            user: User instance to activate
        """
        try:
            with transaction.atomic():
                user.is_active = True
                user.save(update_fields=['is_active', 'updated_at'])
                
                # Invalidate cache
                UserService._invalidate_user_cache(user.id)
                
                logger.info(
                    f"User account activated: {user.email} (ID: {user.id})",
                    extra={'user_id': user.id}
                )
                
        except Exception as e:
            logger.error(
                f"Failed to activate user {user.id}: {str(e)}",
                exc_info=True,
                extra={'user_id': user.id}
            )
            raise ValidationException(f"Failed to activate user: {str(e)}")
    
    @staticmethod
    def get_active_users_count() -> int:
        """
        Get count of active users with caching.
        
        Returns:
            int: Number of active users
        """
        cache_key = f'{UserService.CACHE_PREFIX}_active_count'
        
        cached_count = cache.get(cache_key)
        if cached_count is not None:
            return cached_count
        
        count = User.objects.filter(is_active=True).count()
        cache.set(cache_key, count, 300)  # Cache for 5 minutes
        
        return count
    
    @staticmethod
    def bulk_deactivate_users(user_ids: List[int]) -> int:
        """
        Bulk deactivate multiple users.
        
        Args:
            user_ids: List of user IDs to deactivate
            
        Returns:
            int: Number of users deactivated
        """
        try:
            with transaction.atomic():
                updated_count = User.objects.filter(
                    id__in=user_ids,
                    is_active=True
                ).update(is_active=False)
                
                # Invalidate cache for all affected users
                for user_id in user_ids:
                    UserService._invalidate_user_cache(user_id)
                
                logger.warning(
                    f"Bulk deactivated {updated_count} users",
                    extra={'user_ids': user_ids}
                )
                
                return updated_count
                
        except Exception as e:
            logger.error(
                f"Failed to bulk deactivate users: {str(e)}",
                exc_info=True
            )
            raise ValidationException(f"Bulk deactivation failed: {str(e)}")
    
    @staticmethod
    def _invalidate_user_cache(user_id: int) -> None:
        """
        Invalidate all cache entries for a user.
        
        Args:
            user_id: User ID to invalidate cache for
        """
        cache_keys = [
            f'{UserService.CACHE_PREFIX}_{user_id}',
            f'{UserService.CACHE_PREFIX}_active_count'
        ]
        
        cache.delete_many(cache_keys)
        
        # Also try to invalidate email cache if we can get the user
        try:
            user = User.objects.only('email').get(id=user_id)
            email_key = f'{UserService.CACHE_PREFIX}_email_{user.email}'
            cache.delete(email_key)
        except User.DoesNotExist:
            pass
        
        logger.debug(f"Invalidated cache for user {user_id}")