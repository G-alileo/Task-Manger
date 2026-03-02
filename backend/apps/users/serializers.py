from typing import Dict, Any
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    
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

        value = value.lower().strip()
        
        if User.objects.filter(email=value).only('id').exists():
            raise serializers.ValidationError('A user with this email already exists.')
        
        return value
    
    def validate_username(self, value: str) -> str:

        value = value.strip()
        
        # Use only() to fetch just the id field for existence check
        if User.objects.filter(username=value).only('id').exists():
            raise serializers.ValidationError('A user with this username already exists.')
        
        return value
    
    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
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
        validated_data.pop('password_confirm')
        
        # Extract password for proper hashing
        password = validated_data.pop('password')
        
        # Create user instance with hashed password
        user = User.objects.create_user(password=password, **validated_data)
        
        return user


class LoginSerializer(serializers.Serializer):
    
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
        if value:
            value = value.strip()
            if len(value) > 500:
                raise serializers.ValidationError(
                    'Profile picture URL is too long (max 500 characters).'
                )
        return value
    
    def validate_bio(self, value: str) -> str:
        if value:
            value = value.strip()
            if len(value) > 500:
                raise serializers.ValidationError(
                    'Bio is too long (max 500 characters).'
                )
        return value
    
    def update(self, instance: User, validated_data: Dict[str, Any]) -> User:
        # Only update fields that were provided
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save(update_fields=list(validated_data.keys()) + ['updated_at'])
        
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    
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