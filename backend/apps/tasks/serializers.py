"""
Serializers for the Task API endpoints.

This module contains serializers for task creation, updates,
and data representation.
"""

from typing import Dict, Any
from rest_framework import serializers
from django.utils import timezone

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for task data representation.
    
    Provides read-only fields for user information and computed properties.
    """
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id',
            'user',
            'user_email',
            'user_username',
            'title',
            'description',
            'status',
            'priority',
            'due_date',
            'completed_at',
            'is_overdue',
            'is_completed',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'completed_at', 'created_at', 'updated_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new tasks.
    
    Handles task creation with validation for required fields.
    User is set automatically from the authenticated request.
    """
    
    class Meta:
        model = Task
        fields = [
            'title',
            'description',
            'status',
            'priority',
            'due_date',
        ]
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True},
            'status': {'required': False},
            'priority': {'required': False},
            'due_date': {'required': False, 'allow_null': True},
        }
    
    def validate_title(self, value: str) -> str:
        """
        Validate task title.
        
        Args:
            value: Task title
            
        Returns:
            str: Validated title
            
        Raises:
            serializers.ValidationError: If title is invalid
        """
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Title must be at least 3 characters long.')
        return value.strip()
    
    def validate_due_date(self, value):
        """
        Validate due date is not in the past.
        
        Args:
            value: Due date
            
        Returns:
            datetime: Validated due date
            
        Raises:
            serializers.ValidationError: If due date is in the past
        """
        if value and value < timezone.now():
            raise serializers.ValidationError('Due date cannot be in the past.')
        return value
    
    def create(self, validated_data: Dict[str, Any]) -> Task:
        """
        Create a new task for the authenticated user.
        
        Args:
            validated_data: Validated task data
            
        Returns:
            Task: Created task instance
        """
        # Get user from context (set in view)
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class TaskUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing tasks.
    
    Allows partial updates of task fields.
    """
    
    class Meta:
        model = Task
        fields = [
            'title',
            'description',
            'status',
            'priority',
            'due_date',
        ]
        extra_kwargs = {
            'title': {'required': False},
            'description': {'required': False, 'allow_blank': True},
            'status': {'required': False},
            'priority': {'required': False},
            'due_date': {'required': False, 'allow_null': True},
        }
    
    def validate_title(self, value: str) -> str:
        """Validate task title if provided"""
        if value and len(value.strip()) < 3:
            raise serializers.ValidationError('Title must be at least 3 characters long.')
        return value.strip() if value else value
    
    def validate_due_date(self, value):
        """Validate due date if provided"""
        if value and value < timezone.now():
            raise serializers.ValidationError('Due date cannot be in the past.')
        return value


class TaskStatsSerializer(serializers.Serializer):
    """
    Serializer for task statistics.
    
    Provides counts of tasks by status and priority.
    """
    
    total = serializers.IntegerField()
    todo = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    completed = serializers.IntegerField()
    cancelled = serializers.IntegerField()
    overdue = serializers.IntegerField()
    high_priority = serializers.IntegerField()
    urgent = serializers.IntegerField()
