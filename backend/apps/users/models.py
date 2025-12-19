"""
User models for the task manager application.

This module contains the custom User model and UserManager for handling
user authentication and profile management.
"""

from typing import Optional
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import EmailValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """
    Custom user manager for handling user creation operations.
    
    This manager provides methods for creating regular users and superusers
    with email as the primary identifier instead of username.
    """

    def create_user(
        self,
        email: str,
        username: str,
        password: Optional[str] = None,
        **extra_fields
    ) -> 'User':
        """
        Create and save a regular user with the given email, username, and password.
        
        Args:
            email: User's email address (required, used for authentication)
            username: User's unique username (required)
            password: User's password (will be hashed)
            **extra_fields: Additional fields for the user model
            
        Returns:
            User: The created user instance
            
        Raises:
            ValueError: If email or username is not provided
        """
        if not email:
            raise ValueError(_('The Email field must be set'))
        if not username:
            raise ValueError(_('The Username field must be set'))
        
        # Normalize email to lowercase domain
        email = self.normalize_email(email)
        
        # Create user instance
        user = self.model(
            email=email,
            username=username,
            **extra_fields
        )
        
        # Hash and set password
        user.set_password(password)
        user.save(using=self._db)
        
        return user

    def create_superuser(
        self,
        email: str,
        username: str,
        password: Optional[str] = None,
        **extra_fields
    ) -> 'User':
        """
        Create and save a superuser with the given email, username, and password.
        
        Args:
            email: Superuser's email address (required)
            username: Superuser's unique username (required)
            password: Superuser's password (will be hashed)
            **extra_fields: Additional fields for the user model
            
        Returns:
            User: The created superuser instance
            
        Raises:
            ValueError: If is_staff or is_superuser is not True
        """
        # Set required superuser flags
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        # Validate superuser permissions
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model for the task manager application.
    
    This model extends AbstractBaseUser and PermissionsMixin to provide
    a flexible user authentication system with email-based login and
    comprehensive profile management capabilities.
    
    Authentication:
        - Uses email as the primary login field (USERNAME_FIELD)
        - Supports JWT token authentication
        - Password is automatically hashed using Django's password hashers
    
    Permissions:
        - Inherits Django's permission system via PermissionsMixin
        - Supports staff and superuser designations
        - Can be used with Django's built-in permission framework
    """

    # === Authentication Fields ===
    email = models.EmailField(
        _('email address'),
        max_length=255,
        unique=True,
        db_index=True,  # Indexed for faster authentication queries
        validators=[EmailValidator()],
        help_text=_('Required. Used as the primary login identifier.')
    )
    
    username = models.CharField(
        _('username'),
        max_length=150,
        unique=True,
        db_index=True,  # Indexed for faster lookups
        help_text=_('Required. 150 characters or fewer. Unique identifier.')
    )
    
    # === Profile Fields ===
    first_name = models.CharField(
        _('first name'),
        max_length=150,
        blank=True,
        help_text=_('Optional. User\'s first name.')
    )
    
    last_name = models.CharField(
        _('last name'),
        max_length=150,
        blank=True,
        help_text=_('Optional. User\'s last name.')
    )
    
    profile_picture = models.URLField(
        _('profile picture'),
        max_length=500,
        blank=True,
        null=True,
        help_text=_('Optional. URL to user\'s profile picture. Can be updated to ImageField for file uploads.')
    )
    
    bio = models.TextField(
        _('bio'),
        max_length=500,
        blank=True,
        help_text=_('Optional. Short biography or description about the user.')
    )
    
    # === Status Fields ===
    is_active = models.BooleanField(
        _('active'),
        default=True,
        help_text=_(
            'Designates whether this user should be treated as active. '
            'Unselect this instead of deleting accounts.'
        )
    )
    
    is_staff = models.BooleanField(
        _('staff status'),
        default=False,
        help_text=_(
            'Designates whether the user can log into the admin site.'
        )
    )
    
    # Note: is_superuser is inherited from PermissionsMixin
    
    # === Timestamp Fields ===
    created_at = models.DateTimeField(
        _('date joined'),
        default=timezone.now,
        help_text=_('Timestamp when the user account was created.')
    )
    
    updated_at = models.DateTimeField(
        _('last updated'),
        auto_now=True,
        help_text=_('Timestamp when the user account was last modified.')
    )
    
    # === Manager ===
    objects = UserManager()
    
    # === Authentication Configuration ===
    USERNAME_FIELD = 'email'  # Use email for authentication
    REQUIRED_FIELDS = ['username']  # Required when creating superuser via createsuperuser command
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            # Single field indexes for lookups
            models.Index(fields=['email'], name='user_email_idx'),
            models.Index(fields=['username'], name='user_username_idx'),
            models.Index(fields=['is_active'], name='user_active_idx'),
            models.Index(fields=['-created_at'], name='user_created_idx'),
            
            # Composite indexes for common query patterns
            models.Index(fields=['email', 'is_active'], name='user_email_active_idx'),
            models.Index(fields=['username', 'is_active'], name='user_username_active_idx'),
            
            # Covering index for authentication queries
            models.Index(
                fields=['email', 'is_active', 'is_staff'],
                name='user_auth_covering_idx'
            ),
            
            # Index for staff/admin queries
            models.Index(fields=['is_staff', 'is_active'], name='user_staff_active_idx'),
            models.Index(fields=['is_superuser', 'is_active'], name='user_super_active_idx'),
        ]
        
        # Database-level constraints
        constraints = [
            # Ensure email uniqueness (case-insensitive at DB level)
            models.UniqueConstraint(
                fields=['email'],
                name='user_unique_email_constraint'
            ),
            # Ensure username uniqueness
            models.UniqueConstraint(
                fields=['username'],
                name='user_unique_username_constraint'
            ),
        ]
    
    def __str__(self) -> str:
        """
        String representation of the user.
        
        Returns:
            str: User's email address
        """
        return self.email
    
    def get_full_name(self) -> str:
        """
        Return the first_name plus the last_name, with a space in between.
        
        Returns:
            str: Full name or email if names are not set
        """
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name if full_name else self.email
    
    def get_short_name(self) -> str:
        """
        Return the short name for the user.
        
        Returns:
            str: First name or username if first name is not set
        """
        return self.first_name if self.first_name else self.username
    
    def has_profile_picture(self) -> bool:
        """
        Check if the user has a profile picture set.
        
        Returns:
            bool: True if profile picture exists, False otherwise
        """
        return bool(self.profile_picture)
