"""
This module contains the Task model with performance optimizations including
efficient querying, caching, and proper indexing strategies.
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from typing import Optional, List


class TaskQuerySet(models.QuerySet):
    """
    Provides chainable methods for common query patterns, enabling
    efficient database access with proper indexing.
    """
    
    def for_user(self, user):
        """
        Get tasks for a specific user.
        
        Args:
            user: User instance or user ID
            
        Returns:
            QuerySet filtered by user
        """
        return self.filter(user=user)
    
    def active(self):
        """
        Get active tasks (not completed, cancelled, or deleted).
        
        Returns:
            QuerySet excluding completed, cancelled, and deleted tasks
        """
        return self.filter(is_deleted=False).exclude(
            status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED]
        )
    
    def not_deleted(self):
        """Get tasks that are not soft-deleted."""
        return self.filter(is_deleted=False)
    
    def completed(self):
        """Get only completed tasks."""
        return self.filter(status=Task.Status.COMPLETED, is_deleted=False)
    
    def overdue(self):
        """
        Get overdue tasks.
        
        Uses the task_status_due index for optimal performance.
        
        Returns:
            QuerySet of non-completed tasks past their due date
        """
        now = timezone.now()
        return self.filter(
            due_date__lt=now,
            is_deleted=False
        ).exclude(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED])
    
    def due_soon(self, hours=24):
        """
        Get tasks due within the specified hours.
        
        Args:
            hours: Number of hours to look ahead (default: 24)
            
        Returns:
            QuerySet of tasks due within the time window
        """
        from datetime import timedelta
        now = timezone.now()
        cutoff = now + timedelta(hours=hours)
        return self.filter(
            due_date__lte=cutoff,
            due_date__gte=now,
            is_deleted=False
        ).exclude(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED])
    
    def by_priority(self):
        """
        Order tasks by priority (urgent → high → medium → low).
        
        Uses Case/When for proper priority ordering instead of
        relying on alphabetical sorting.
        
        Returns:
            QuerySet ordered by priority level
        """
        priority_order = models.Case(
            models.When(priority=Task.Priority.URGENT, then=0),
            models.When(priority=Task.Priority.HIGH, then=1),
            models.When(priority=Task.Priority.MEDIUM, then=2),
            models.When(priority=Task.Priority.LOW, then=3),
            output_field=models.IntegerField(),
        )
        return self.annotate(priority_rank=priority_order).order_by('priority_rank')
    
    def with_user_data(self):
        """
        Optimize user foreign key access with select_related to avoid N+1 queries.
        
        Returns:
            QuerySet with user data pre-fetched
        """
        return self.select_related('user')
    
    def optimized_list(self):
        """
        Optimized queryset for list views.
        
        Returns:
            QuerySet with select_related and only() for minimal data
        """
        return self.select_related('user').only(
            'id', 'user_id', 'title', 'status', 'priority',
            'due_date', 'created_at', 'updated_at'
        )
    
    def statistics(self):
        """
        Get task statistics in a single query.
        
        Returns:
            Dict with counts by status and priority
        """
        from django.db.models import Count, Q
        
        now = timezone.now()
        
        return self.aggregate(
            total=Count('id'),
            todo=Count('id', filter=Q(status=Task.Status.TODO)),
            in_progress=Count('id', filter=Q(status=Task.Status.IN_PROGRESS)),
            completed=Count('id', filter=Q(status=Task.Status.COMPLETED)),
            cancelled=Count('id', filter=Q(status=Task.Status.CANCELLED)),
            urgent=Count('id', filter=Q(priority=Task.Priority.URGENT)),
            high=Count('id', filter=Q(priority=Task.Priority.HIGH)),
            medium=Count('id', filter=Q(priority=Task.Priority.MEDIUM)),
            low=Count('id', filter=Q(priority=Task.Priority.LOW)),
            overdue=Count('id', filter=Q(
                due_date__lt=now,
                status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS]
            ))
        )


class TaskManager(models.Manager):
    """
    Custom manager for Task model.
    
    Exposes QuerySet methods at the manager level for convenient access.
    """
    
    def get_queryset(self):
        """Return custom QuerySet with not_deleted filter by default."""
        return TaskQuerySet(self.model, using=self._db).not_deleted()
    
    def for_user(self, user):
        """Get tasks for specific user."""
        return self.get_queryset().for_user(user)
    
    def active(self):
        """Get active tasks."""
        return self.get_queryset().active()
    
    def completed(self):
        """Get completed tasks."""
        return self.get_queryset().completed()
    
    def overdue(self):
        """Get overdue tasks."""
        return self.get_queryset().overdue()
    
    def due_soon(self, hours=24):
        """Get tasks due soon."""
        return self.get_queryset().due_soon(hours=hours)
    
    def by_priority(self):
        """Order by priority."""
        return self.get_queryset().by_priority()
    
    def bulk_update_status(self, task_ids: List[int], new_status: str) -> int:
        """
        Efficiently update status for multiple tasks.
        
        Args:
            task_ids: List of task IDs to update
            new_status: New status value
            
        Returns:
            Number of tasks updated
        """
        now = timezone.now()
        update_data = {
            'status': new_status,
            'updated_at': now
        }
        
        # Set completed_at if marking as completed
        if new_status == Task.Status.COMPLETED:
            update_data['completed_at'] = now
        elif new_status != Task.Status.COMPLETED:
            update_data['completed_at'] = None
        
        return self.filter(id__in=task_ids).update(**update_data)
    
    def bulk_complete(self, task_ids: List[int]) -> int:
        """Mark multiple tasks as completed."""
        return self.bulk_update_status(task_ids, Task.Status.COMPLETED)
    
    def bulk_soft_delete(self, task_ids: List[int]) -> int:
        """
        Bulk soft delete tasks.
        
        Args:
            task_ids: List of task IDs to soft delete
            
        Returns:
            Number of tasks deleted
        """
        return self.filter(id__in=task_ids).update(
            is_deleted=True,
            deleted_at=timezone.now()
        )
    
    def user_statistics(self, user):
        """
        Get statistics for a specific user's tasks.
        
        Args:
            user: User instance or user ID
            
        Returns:
            Dict with task counts and metrics
        """
        return self.for_user(user).statistics()


class Task(models.Model):
    """
    Task model for managing user tasks.
    
    Each task belongs to a user and has a title, description, priority,
    status, and optional due date. Supports soft deletion and tagging.
    """
    
    class Priority(models.TextChoices):
        """Priority levels for tasks."""
        LOW = 'low', _('Low')
        MEDIUM = 'medium', _('Medium')
        HIGH = 'high', _('High')
        URGENT = 'urgent', _('Urgent')
    
    class Status(models.TextChoices):
        """Status options for tasks."""
        TODO = 'todo', _('To Do')
        IN_PROGRESS = 'in_progress', _('In Progress')
        COMPLETED = 'completed', _('Completed')
        CANCELLED = 'cancelled', _('Cancelled')
    
    # Core fields
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text='User who owns this task'
    )
    
    title = models.CharField(
        max_length=255,
        validators=[MinLengthValidator(3)],
        help_text='Task title (3-255 characters)'
    )
    
    description = models.TextField(
        blank=True,
        default='',
        help_text='Detailed task description (optional)'
    )
    
    # Status and priority
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
        db_index=True,
        help_text='Current task status'
    )
    
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        help_text='Task priority level'
    )
    
    # Dates
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text='Optional deadline for task completion'
    )
    
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp when task was marked as completed'
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='Timestamp when task was created'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='Timestamp of last update'
    )
    
    # Soft delete support
    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text='Soft delete flag'
    )
    
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp when task was soft deleted'
    )
    
    # Optional: Additional metadata
    tags = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='Comma-separated tags for categorization'
    )
    
    # Custom manager
    objects = TaskManager()
    all_objects = models.Manager()  # Manager that includes deleted tasks
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        
        indexes = [
            # Primary list query: user's active tasks by creation date
            models.Index(
                fields=['user', 'is_deleted', '-created_at'],
                name='task_user_deleted_created'
            ),
            
            # Status filtering per user
            models.Index(
                fields=['user', 'status', '-created_at'],
                name='task_user_status_created'
            ),
            
            # Priority filtering and sorting per user
            models.Index(
                fields=['user', 'priority', '-created_at'],
                name='task_user_priority_created'
            ),
            
            # Overdue task queries (status + due_date)
            models.Index(
                fields=['status', 'due_date', 'is_deleted'],
                name='task_status_due_deleted'
            ),
            
            # User's tasks by due date
            models.Index(
                fields=['user', 'due_date', 'is_deleted'],
                name='task_user_due_deleted'
            ),
        ]
        
        # Database-level constraints
        constraints = [
            # Ensure completed_at is set only when status is completed
            models.CheckConstraint(
                condition=(
                    models.Q(status='completed', completed_at__isnull=False) |
                    models.Q(~models.Q(status='completed'), completed_at__isnull=True)
                ),
                name='task_completed_at_status_constraint',
                violation_error_message='completed_at must be set if and only if status is completed'
            ),
            
            # Ensure deleted_at is set only when is_deleted is True
            models.CheckConstraint(
                condition=(
                    models.Q(is_deleted=True, deleted_at__isnull=False) |
                    models.Q(is_deleted=False, deleted_at__isnull=True)
                ),
                name='task_deleted_at_flag_constraint',
                violation_error_message='deleted_at must be set if and only if is_deleted is True'
            ),
        ]
    
    def __str__(self) -> str:
        """String representation of the task."""
        return f"{self.title} ({self.get_status_display()})"
    
    def __repr__(self) -> str:
        """Developer-friendly representation."""
        return f"<Task id={self.pk} user={self.user_id} status={self.status} priority={self.priority}>"
    
    def clean(self):
        """
        Validate model data.
        
        Raises:
            ValidationError: If data is invalid
        """
        super().clean()
        
        # Ensure due_date is in the future for new tasks
        if not self.pk and self.due_date:
            if self.due_date < timezone.now():
                raise ValidationError({
                    'due_date': 'Due date must be in the future for new tasks.'
                })
        
        # Ensure completed_at matches status
        if self.status == self.Status.COMPLETED and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != self.Status.COMPLETED and self.completed_at:
            self.completed_at = None
    
    def save(self, *args, **kwargs):
        """
        Override save to handle completed_at timestamp.
        
        OPTIMIZATION: Only processes completed_at when status field
        is being saved to avoid unnecessary operations.
        """
        update_fields = kwargs.get('update_fields')
        
        # Only update completed_at if status is being saved or it's a new object
        if update_fields is None or 'status' in update_fields:
            if self.status == self.Status.COMPLETED and not self.completed_at:
                self.completed_at = timezone.now()
                if update_fields:
                    update_fields = set(update_fields) | {'completed_at'}
                    kwargs['update_fields'] = list(update_fields)
            elif self.status != self.Status.COMPLETED and self.completed_at:
                self.completed_at = None
                if update_fields:
                    update_fields = set(update_fields) | {'completed_at'}
                    kwargs['update_fields'] = list(update_fields)
        
        super().save(*args, **kwargs)
    
    # Properties
    
    @property
    def is_overdue(self) -> bool:
        """
        Check if task is overdue.
        
        Returns:
            True if task is overdue, False otherwise
        """
        if self.due_date and self.status not in [self.Status.COMPLETED, self.Status.CANCELLED]:
            return timezone.now() > self.due_date
        return False
    
    @property
    def is_completed(self) -> bool:
        """
        Check if task is completed.
        
        Returns:
            True if status is COMPLETED
        """
        return self.status == self.Status.COMPLETED
    
    @property
    def is_active(self) -> bool:
        """
        Check if task is active (not completed or cancelled).
        
        Returns:
            True if task is active
        """
        return self.status not in [self.Status.COMPLETED, self.Status.CANCELLED]
    
    @property
    def days_until_due(self) -> Optional[int]:
        """
        Calculate days until due date.
        
        Returns:
            Number of days (negative if overdue), or None if no due date
        """
        if not self.due_date:
            return None
        
        delta = self.due_date - timezone.now()
        return delta.days
    
    @property
    def tag_list(self) -> List[str]:
        """
        Get tags as a list.
        
        Returns:
            List of tag strings
        """
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
    
    # Instance methods
    
    def mark_completed(self, save: bool = True):
        """
        Mark task as completed.
        
        Args:
            save: Whether to save to database (default: True)
            
        Returns:
            Self for method chaining
        """
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        if save:
            self.save(update_fields=['status', 'completed_at', 'updated_at'])
        return self
    
    def mark_in_progress(self, save: bool = True):
        """
        Mark task as in progress.
        
        Args:
            save: Whether to save to database (default: True)
            
        Returns:
            Self for method chaining
        """
        self.status = self.Status.IN_PROGRESS
        self.completed_at = None
        if save:
            self.save(update_fields=['status', 'completed_at', 'updated_at'])
        return self
    
    def mark_cancelled(self, save: bool = True):
        """
        Mark task as cancelled.
        
        Args:
            save: Whether to save to database (default: True)
            
        Returns:
            Self for method chaining
        """
        self.status = self.Status.CANCELLED
        self.completed_at = None
        if save:
            self.save(update_fields=['status', 'completed_at', 'updated_at'])
        return self
    
    def soft_delete(self, save: bool = True):
        """
        Soft delete the task.
        
        Args:
            save: Whether to save to database (default: True)
            
        Returns:
            Self for method chaining
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if save:
            self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])
        return self
    
    def restore(self, save: bool = True):
        """
        Restore a soft-deleted task.
        
        Args:
            save: Whether to save to database (default: True)
            
        Returns:
            Self for method chaining
        """
        self.is_deleted = False
        self.deleted_at = None
        if save:
            self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])
        return self
    
    def add_tag(self, tag: str, save: bool = True):
        """
        Add a tag to the task.
        
        Args:
            tag: Tag string to add
            save: Whether to save to database (default: True)
            
        Returns:
            Self for method chaining
        """
        current_tags = self.tag_list
        tag = tag.strip()
        if tag and tag not in current_tags:
            current_tags.append(tag)
            self.tags = ', '.join(current_tags)
            if save:
                self.save(update_fields=['tags', 'updated_at'])
        return self
    
    def remove_tag(self, tag: str, save: bool = True):
        """
        Remove a tag from the task.
        
        Args:
            tag: Tag string to remove
            save: Whether to save to database (default: True)
            
        Returns:
            Self for method chaining
        """
        current_tags = self.tag_list
        if tag in current_tags:
            current_tags.remove(tag)
            self.tags = ', '.join(current_tags)
            if save:
                self.save(update_fields=['tags', 'updated_at'])
        return self
    
    def duplicate(self, user=None):
        """
        Create a duplicate of this task.
        
        Args:
            user: User to assign duplicate to (default: same user)
            
        Returns:
            New Task instance (unsaved)
        """
        return Task(
            user=user or self.user,
            title=f"{self.title} (Copy)",
            description=self.description,
            status=self.Status.TODO,
            priority=self.priority,
            due_date=self.due_date,
            tags=self.tags
        )