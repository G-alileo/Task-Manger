"""
This module contains serializers for user registration, authentication,
profile management, and user data representation with performance optimizations.
"""

from typing import Dict, Any
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    
    Handles new user account creation with email, username, and password.
    Validates email uniqueness, strong password requirements, and password confirmation.
    """
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Password must be strong and meet validation requirements'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='Must match the password field'
    )
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'password_confirm', 'first_name', 'last_name']
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }
    
    def validate_email(self, value: str) -> str:
        """
        Validate email uniqueness and format.
        
        Args:
            value: Email address to validate
            
        Returns:
            str: Validated email address (lowercase)
            
        Raises:
            serializers.ValidationError: If email already exists or is invalid
        """
        value = value.lower().strip()
        
        # Use only() to fetch just the id field for existence check
        if User.objects.filter(email=value).only('id').exists():
            raise serializers.ValidationError('A user with this email already exists.')
        
        return value
    
    def validate_username(self, value: str) -> str:
        """
        Validate username uniqueness.
        
        Args:
            value: Username to validate
            
        Returns:
            str: Validated username
            
        Raises:
            serializers.ValidationError: If username already exists
        """
        value = value.strip()
        
        # Use only() to fetch just the id field for existence check
        if User.objects.filter(username=value).only('id').exists():
            raise serializers.ValidationError('A user with this username already exists.')
        
        return value
    
    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate password match and strength.
        
        Args:
            attrs: Dictionary of validated field data
            
        Returns:
            Dict: Validated attributes
            
        Raises:
            serializers.ValidationError: If passwords don't match or are weak
        """
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        # Check password match first (faster check)
        if password != password_confirm:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        
        # Validate password strength using Django's validators
        try:
            validate_password(password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                'password': list(e.messages)
            })
        
        return attrs
    
    def create(self, validated_data: Dict[str, Any]) -> User:
        """
        Create a new user with the validated data.
        
        Args:
            validated_data: Dictionary of validated field data
            
        Returns:
            User: Newly created user instance
        """
        # Remove password_confirm as it's not needed for user creation
        validated_data.pop('password_confirm')
        
        # Extract password for proper hashing
        password = validated_data.pop('password')
        
        # Create user instance with hashed password
        user = User.objects.create_user(password=password, **validated_data)
        
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user authentication.
    
    Validates user credentials (email/password) and issues JWT tokens upon success.
    Returns access and refresh tokens for authenticated sessions.
    
    NOTE: Actual authentication logic is handled in the service layer.
    This serializer only validates input format.
    """
    
    email = serializers.EmailField(
        required=True,
        help_text='User email address for authentication'
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='User password'
    )
    
    def validate_email(self, value: str) -> str:
        """Normalize email to lowercase."""
        return value.lower().strip()


class UserSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for user data representation.
    
    Used for displaying user information in API responses.
    Excludes sensitive fields like password and includes computed fields.
    """
    
    full_name = serializers.CharField(
        source='get_full_name',
        read_only=True,
        help_text='User\'s full name (first_name + last_name)'
    )
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'profile_picture',
            'bio',
            'is_active',
            'is_staff',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id', 'email', 'is_active', 'is_staff', 
            'created_at', 'updated_at'
        ]


class UserListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for user list views.
    
    Returns minimal user data for list endpoints to improve performance.
    """
    
    full_name = serializers.CharField(
        source='get_full_name',
        read_only=True
    )
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'full_name',
            'is_active',
            'is_staff',
            'created_at'
        ]
        read_only_fields = fields


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile information.
    
    Allows authenticated users to update their optional profile fields.
    Email and username cannot be changed through this serializer.
    """
    
    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'profile_picture',
            'bio'
        ]
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True, 'trim_whitespace': True},
            'last_name': {'required': False, 'allow_blank': True, 'trim_whitespace': True},
            'profile_picture': {'required': False, 'allow_blank': True, 'trim_whitespace': True},
            'bio': {'required': False, 'allow_blank': True, 'trim_whitespace': True},
        }
    
    def validate_profile_picture(self, value: str) -> str:
        """
        Validate profile picture URL format.
        
        Args:
            value: Profile picture URL
            
        Returns:
            str: Validated URL
            
        Raises:
            serializers.ValidationError: If URL is invalid
        """
        if value:
            value = value.strip()
            if len(value) > 500:
                raise serializers.ValidationError(
                    'Profile picture URL is too long (max 500 characters).'
                )
        return value
    
    def validate_bio(self, value: str) -> str:
        """
        Validate bio length.
        
        Args:
            value: Bio text
            
        Returns:
            str: Validated bio
            
        Raises:
            serializers.ValidationError: If bio is too long
        """
        if value:
            value = value.strip()
            if len(value) > 500:
                raise serializers.ValidationError(
                    'Bio is too long (max 500 characters).'
                )
        return value
    
    def update(self, instance: User, validated_data: Dict[str, Any]) -> User:
        """
        Update user profile with validated data.
        
        Args:
            instance: User instance to update
            validated_data: Dictionary of validated field data
            
        Returns:
            User: Updated user instance
        """
        # Only update fields that were provided
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save(update_fields=list(validated_data.keys()) + ['updated_at'])
        
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for changing user password.
    """
    
    old_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """Validate password change data."""
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')
        
        if new_password != new_password_confirm:
            raise serializers.ValidationError({
                'new_password_confirm': 'New passwords do not match.'
            })
        
        # Validate new password strength
        try:
            validate_password(new_password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                'new_password': list(e.messages)
            })
        
        return attrs