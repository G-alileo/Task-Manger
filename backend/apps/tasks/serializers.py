"""
This module contains serializers with performance optimizations including
minimal field selection and efficient validation.
"""

from typing import Dict, Any
from rest_framework import serializers
from django.utils import timezone

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    """
    Full serializer for task data representation.
    
    Provides read-only fields for user information and computed properties.
    """
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    tag_list = serializers.ListField(read_only=True)
    
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
            'is_active',
            'tags',
            'tag_list',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'user', 'completed_at', 'created_at', 'updated_at'
        ]


class TaskListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for task list views.
    
    Returns minimal task data for list endpoints to improve performance.
    Excludes heavy fields like description and user details.
    """
    
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'status',
            'priority',
            'due_date',
            'is_overdue',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


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
            'tags',
        ]
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True, 'trim_whitespace': True},
            'status': {'required': False},
            'priority': {'required': False},
            'due_date': {'required': False, 'allow_null': True},
            'tags': {'required': False, 'allow_blank': True, 'trim_whitespace': True},
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
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError(
                'Title must be at least 3 characters long.'
            )
        return value
    
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
            raise serializers.ValidationError(
                'Due date cannot be in the past.'
            )
        return value
    
    def validate_tags(self, value: str) -> str:
        """
        Validate and clean tags.
        
        Args:
            value: Comma-separated tags
            
        Returns:
            str: Cleaned tags
        """
        if value:
            # Clean and deduplicate tags
            tags = [tag.strip() for tag in value.split(',') if tag.strip()]
            # Remove duplicates while preserving order
            seen = set()
            unique_tags = []
            for tag in tags:
                tag_lower = tag.lower()
                if tag_lower not in seen:
                    seen.add(tag_lower)
                    unique_tags.append(tag)
            return ', '.join(unique_tags)
        return value
    
    def create(self, validated_data: Dict[str, Any]) -> Task:
        """
        Create a new task for the authenticated user.
        
        Args:
            validated_data: Validated task data
            
        Returns:
            Task: Created task instance
        """
        # User is set in the view, not here
        return super().create(validated_data)


class TaskUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing tasks.
    
    Allows partial updates of task fields with proper validation.
    """
    
    class Meta:
        model = Task
        fields = [
            'title',
            'description',
            'status',
            'priority',
            'due_date',
            'tags',
        ]
        extra_kwargs = {
            'title': {'required': False, 'trim_whitespace': True},
            'description': {'required': False, 'allow_blank': True, 'trim_whitespace': True},
            'status': {'required': False},
            'priority': {'required': False},
            'due_date': {'required': False, 'allow_null': True},
            'tags': {'required': False, 'allow_blank': True, 'trim_whitespace': True},
        }
    
    def validate_title(self, value: str) -> str:
        """Validate task title if provided."""
        if value:
            value = value.strip()
            if len(value) < 3:
                raise serializers.ValidationError(
                    'Title must be at least 3 characters long.'
                )
            return value
        return value
    
    def validate_due_date(self, value):
        """Validate due date if provided."""
        # Allow past dates for existing tasks being updated
        return value
    
    def validate_tags(self, value: str) -> str:
        """Validate and clean tags if provided."""
        if value:
            # Clean and deduplicate tags
            tags = [tag.strip() for tag in value.split(',') if tag.strip()]
            # Remove duplicates while preserving order
            seen = set()
            unique_tags = []
            for tag in tags:
                tag_lower = tag.lower()
                if tag_lower not in seen:
                    seen.add(tag_lower)
                    unique_tags.append(tag)
            return ', '.join(unique_tags)
        return value
    
    def update(self, instance: Task, validated_data: Dict[str, Any]) -> Task:
        """
        Update task with validated data.
        
        Args:
            instance: Task instance to update
            validated_data: Dictionary of validated field data
            
        Returns:
            Task: Updated task instance
        """
        # Build list of fields that actually changed
        update_fields = []
        for attr, value in validated_data.items():
            if getattr(instance, attr) != value:
                setattr(instance, attr, value)
                update_fields.append(attr)
        
        # Only save if there are changes
        if update_fields:
            update_fields.append('updated_at')
            instance.save(update_fields=update_fields)
        
        return instance


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
    urgent = serializers.IntegerField()
    high = serializers.IntegerField()
    medium = serializers.IntegerField()
    low = serializers.IntegerField()


class BulkTaskActionSerializer(serializers.Serializer):
    """
    Serializer for bulk task operations.
    """
    
    task_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text='List of task IDs to perform action on'
    )
    
    def validate_task_ids(self, value):
        """Ensure task IDs are unique."""
        if len(value) != len(set(value)):
            raise serializers.ValidationError(
                'Duplicate task IDs are not allowed.'
            )
        return value


class BulkStatusUpdateSerializer(BulkTaskActionSerializer):
    """
    Serializer for bulk status updates.
    """
    
    status = serializers.ChoiceField(
        choices=Task.Status.choices,
        help_text='New status to apply to all tasks'
    )


class TaskDuplicateSerializer(serializers.Serializer):
    """
    Serializer for task duplication.
    """
    
    title = serializers.CharField(
        required=False,
        max_length=255,
        help_text='Optional custom title for duplicate (defaults to "Original Title (Copy)")'
    )