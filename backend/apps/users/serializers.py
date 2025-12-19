"""
Serializers for the User API endpoints.

This module contains serializers for user registration, authentication,
profile management, and user data representation.
"""

from typing import Dict, Any
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
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
        value = value.lower()
        if User.objects.filter(email=value).exists():
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
        if User.objects.filter(username=value).exists():
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
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        
        # Validate password strength using Django's validators
        try:
            validate_password(attrs['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        
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
    
    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Authenticate user and generate JWT tokens.
        
        Args:
            attrs: Dictionary containing email and password
            
        Returns:
            Dict: User data with JWT tokens
            
        Raises:
            serializers.ValidationError: If credentials are invalid
        """
        email = attrs.get('email', '').lower()
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')
        
        # Authenticate user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials.')
        
        # Check password
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid credentials.')
        
        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return {
            'user': user,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }


class UserSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for user data representation.
    
    Used for displaying user information in API responses.
    Excludes sensitive fields like password and includes computed fields.
    """
    
    full_name = serializers.SerializerMethodField(
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
        read_only_fields = ['id', 'email', 'is_active', 'is_staff', 'created_at', 'updated_at']
    
    def get_full_name(self, obj: User) -> str:
        """
        Get user's full name.
        
        Args:
            obj: User instance
            
        Returns:
            str: Full name or email if names not set
        """
        return obj.get_full_name()


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
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'profile_picture': {'required': False, 'allow_null': True, 'allow_blank': True},
            'bio': {'required': False, 'allow_blank': True},
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
        if value and len(value) > 500:
            raise serializers.ValidationError('Profile picture URL is too long (max 500 characters).')
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
        if value and len(value) > 500:
            raise serializers.ValidationError('Bio is too long (max 500 characters).')
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
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
