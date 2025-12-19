"""
Task models for the task manager application.

This module contains the Task model for managing user tasks with
priority levels, status tracking, and due dates.
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Task(models.Model):
    """
    Task model for managing user tasks.
    
    Each task belongs to a user and has a title, description, priority,
    status, and optional due date.
    """
    
    class Priority(models.TextChoices):
        """Priority levels for tasks"""
        LOW = 'low', _('Low')
        MEDIUM = 'medium', _('Medium')
        HIGH = 'high', _('High')
        URGENT = 'urgent', _('Urgent')
    
    class Status(models.TextChoices):
        """Status options for tasks"""
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
        help_text='Detailed task description (optional)'
    )
    
    # Status and priority
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
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
        help_text='Timestamp when task was created'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='Timestamp of last update'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            # Single field indexes
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['due_date']),
            models.Index(fields=['-created_at']),
            
            # Composite indexes for common query patterns
            models.Index(fields=['user', 'status'], name='task_user_status_idx'),
            models.Index(fields=['user', 'priority'], name='task_user_priority_idx'),
            models.Index(fields=['user', '-created_at'], name='task_user_created_idx'),
            models.Index(fields=['user', 'due_date'], name='task_user_due_idx'),
            
            # Composite index for overdue task queries
            models.Index(fields=['status', 'due_date'], name='task_status_due_idx'),
            
            # Covering index for list queries (includes commonly selected fields)
            models.Index(
                fields=['user', 'status', 'priority', '-created_at'],
                name='task_list_covering_idx'
            ),
            
            # Index for completed tasks with timestamp
            models.Index(
                fields=['user', 'status', 'completed_at'],
                name='task_completed_idx'
            ),
        ]
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        
        # Database-level constraints
        constraints = [
            # Ensure completed_at is set only when status is completed
            models.CheckConstraint(
                condition=(
                    models.Q(status='completed', completed_at__isnull=False) |
                    models.Q(~models.Q(status='completed'), completed_at__isnull=True)
                ),
                name='task_completed_at_status_constraint'
            ),
        ]
    
    def __str__(self) -> str:
        """String representation of the task"""
        return f"{self.title} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        """Override save to set completed_at timestamp"""
        if self.status == self.Status.COMPLETED and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != self.Status.COMPLETED:
            self.completed_at = None
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self) -> bool:
        """Check if task is overdue"""
        if self.due_date and self.status != self.Status.COMPLETED:
            return timezone.now() > self.due_date
        return False
    
    @property
    def is_completed(self) -> bool:
        """Check if task is completed"""
        return self.status == self.Status.COMPLETED
