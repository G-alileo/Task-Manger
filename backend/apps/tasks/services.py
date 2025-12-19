"""
Service layer for task business logic.

This module encapsulates all business logic related to tasks,
separating it from the view layer for better testability and maintainability.
"""

import logging
from typing import List, Dict, Any, Optional
from django.db import transaction
from django.db.models import Q, Count, QuerySet
from django.utils import timezone
from django.core.cache import cache

from apps.core.exceptions import ResourceNotFoundException, ValidationException
from .models import Task


logger = logging.getLogger('apps.tasks')


class TaskService:
    """
    Service class for task-related business logic.
    
    Centralizes all task operations including CRUD, filtering,
    statistics, and business rule enforcement.
    """
    
    CACHE_TIMEOUT = 300  # 5 minutes
    
    @staticmethod
    def create_task(user, validated_data: Dict[str, Any]) -> Task:
        """
        Create a new task for a user.
        
        Args:
            user: User who owns the task
            validated_data: Validated task data
            
        Returns:
            Task: Created task instance
            
        Raises:
            ValidationException: If business rules are violated
        """
        try:
            with transaction.atomic():
                task = Task.objects.create(user=user, **validated_data)
                
                # Invalidate user's task cache
                TaskService._invalidate_user_cache(user.id)
                
                logger.info(f"Task created: ID={task.id}, User={user.id}, Title='{task.title}'")
                return task
                
        except Exception as e:
            logger.error(f"Failed to create task for user {user.id}: {str(e)}", exc_info=True)
            raise ValidationException(f"Failed to create task: {str(e)}")
    
    @staticmethod
    def update_task(task: Task, validated_data: Dict[str, Any]) -> Task:
        """
        Update an existing task.
        
        Args:
            task: Task instance to update
            validated_data: Validated update data
            
        Returns:
            Task: Updated task instance
            
        Raises:
            ValidationException: If business rules are violated
        """
        try:
            with transaction.atomic():
                # Handle status change to completed
                if validated_data.get('status') == Task.Status.COMPLETED and task.status != Task.Status.COMPLETED:
                    validated_data['completed_at'] = timezone.now()
                elif validated_data.get('status') != Task.Status.COMPLETED:
                    validated_data['completed_at'] = None
                
                # Update fields
                for field, value in validated_data.items():
                    setattr(task, field, value)
                
                task.save()
                
                # Invalidate cache
                TaskService._invalidate_user_cache(task.user.id)
                TaskService._invalidate_task_cache(task.id)
                
                logger.info(f"Task updated: ID={task.id}, User={task.user.id}")
                return task
                
        except Exception as e:
            logger.error(f"Failed to update task {task.id}: {str(e)}", exc_info=True)
            raise ValidationException(f"Failed to update task: {str(e)}")
    
    @staticmethod
    def delete_task(task: Task) -> None:
        """
        Delete a task.
        
        Args:
            task: Task instance to delete
        """
        try:
            user_id = task.user.id
            task_id = task.id
            
            with transaction.atomic():
                task.delete()
                
                # Invalidate cache
                TaskService._invalidate_user_cache(user_id)
                TaskService._invalidate_task_cache(task_id)
                
                logger.info(f"Task deleted: ID={task_id}, User={user_id}")
                
        except Exception as e:
            logger.error(f"Failed to delete task {task.id}: {str(e)}", exc_info=True)
            raise ValidationException(f"Failed to delete task: {str(e)}")
    
    @staticmethod
    def get_user_tasks(
        user,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        overdue: Optional[bool] = None
    ) -> QuerySet:
        """
        Get filtered tasks for a user.
        
        Args:
            user: User whose tasks to retrieve
            status: Optional status filter
            priority: Optional priority filter
            overdue: Optional overdue filter
            
        Returns:
            QuerySet: Filtered task queryset
        """
        queryset = Task.objects.filter(user=user).select_related('user')
        
        if status:
            queryset = queryset.filter(status=status)
        
        if priority:
            queryset = queryset.filter(priority=priority)
        
        if overdue:
            queryset = queryset.filter(
                due_date__lt=timezone.now(),
                status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS]
            )
        
        return queryset
    
    @staticmethod
    def get_task_statistics(user) -> Dict[str, int]:
        """
        Calculate task statistics for a user with caching.
        
        Args:
            user: User whose statistics to calculate
            
        Returns:
            Dict: Dictionary containing task statistics
        """
        cache_key = f'task_stats_{user.id}'
        cached_stats = cache.get(cache_key)
        
        if cached_stats:
            logger.debug(f"Returning cached stats for user {user.id}")
            return cached_stats
        
        try:
            tasks = Task.objects.filter(user=user)
            
            stats = {
                'total': tasks.count(),
                'todo': tasks.filter(status=Task.Status.TODO).count(),
                'in_progress': tasks.filter(status=Task.Status.IN_PROGRESS).count(),
                'completed': tasks.filter(status=Task.Status.COMPLETED).count(),
                'cancelled': tasks.filter(status=Task.Status.CANCELLED).count(),
                'overdue': tasks.filter(
                    due_date__lt=timezone.now(),
                    status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS]
                ).count(),
                'high_priority': tasks.filter(priority=Task.Priority.HIGH).count(),
                'urgent': tasks.filter(priority=Task.Priority.URGENT).count(),
            }
            
            # Cache the results
            cache.set(cache_key, stats, TaskService.CACHE_TIMEOUT)
            
            logger.info(f"Calculated and cached stats for user {user.id}")
            return stats
            
        except Exception as e:
            logger.error(f"Failed to calculate stats for user {user.id}: {str(e)}", exc_info=True)
            raise ValidationException(f"Failed to calculate statistics: {str(e)}")
    
    @staticmethod
    def bulk_update_status(user, task_ids: List[int], new_status: str) -> int:
        """
        Bulk update task status for multiple tasks.
        
        Args:
            user: User who owns the tasks
            task_ids: List of task IDs to update
            new_status: New status to set
            
        Returns:
            int: Number of tasks updated
            
        Raises:
            ValidationException: If operation fails
        """
        try:
            with transaction.atomic():
                tasks = Task.objects.filter(user=user, id__in=task_ids)
                
                update_data = {'status': new_status}
                if new_status == Task.Status.COMPLETED:
                    update_data['completed_at'] = timezone.now()
                
                updated_count = tasks.update(**update_data)
                
                # Invalidate cache
                TaskService._invalidate_user_cache(user.id)
                
                logger.info(f"Bulk updated {updated_count} tasks for user {user.id} to status '{new_status}'")
                return updated_count
                
        except Exception as e:
            logger.error(f"Failed to bulk update tasks for user {user.id}: {str(e)}", exc_info=True)
            raise ValidationException(f"Failed to bulk update tasks: {str(e)}")
    
    @staticmethod
    def _invalidate_user_cache(user_id: int) -> None:
        """Invalidate all cache entries for a user"""
        cache.delete(f'task_stats_{user_id}')
    
    @staticmethod
    def _invalidate_task_cache(task_id: int) -> None:
        """Invalidate cache entries for a specific task"""
        cache.delete(f'task_{task_id}')
