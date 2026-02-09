"""
This module encapsulates all business logic related to tasks with
performance optimizations including caching, query optimization, and bulk operations.
"""

import logging
from typing import List, Dict, Any, Optional
from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone
from django.core.cache import cache

from apps.core.exceptions import ResourceNotFoundException, ValidationException
from .models import Task


logger = logging.getLogger('apps.tasks')


class TaskService:
    """
    Service class for task-related business logic.
    
    Centralizes all task operations including CRUD, filtering,
    statistics, and business rule enforcement with caching and optimization.
    """
    
    CACHE_TIMEOUT = 300  # 5 minutes
    CACHE_PREFIX = 'task'
    
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
                validated_data['user'] = user
                task = Task.objects.create(**validated_data)
                
                # Invalidate user's task cache
                TaskService._invalidate_user_cache(user.id)
                
                logger.info(
                    f"Task created: ID={task.id}, User={user.id}, Title='{task.title}'",
                    extra={'user_id': user.id, 'task_id': task.id}
                )
                return task
                
        except Exception as e:
            logger.error(
                f"Failed to create task for user {user.id}: {str(e)}",
                exc_info=True,
                extra={'user_id': user.id}
            )
            raise ValidationException(f"Failed to create task: {str(e)}")
    
    @staticmethod
    def update_task(task: Task, validated_data: Dict[str, Any]) -> Task:
        """
        Update an existing task with optimized field updates.
        
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
                # Build list of fields that actually changed
                update_fields = []
                
                for field, value in validated_data.items():
                    if getattr(task, field) != value:
                        setattr(task, field, value)
                        update_fields.append(field)
                
                # Only save if there are changes
                if update_fields:
                    update_fields.append('updated_at')
                    task.save(update_fields=update_fields)
                    
                    # Invalidate caches
                    TaskService._invalidate_user_cache(task.user.id)
                    TaskService._invalidate_task_cache(task.id)
                    
                    logger.info(
                        f"Task updated: ID={task.id}, User={task.user.id}, "
                        f"Fields: {', '.join(update_fields)}",
                        extra={'user_id': task.user.id, 'task_id': task.id}
                    )
                
                return task
                
        except Exception as e:
            logger.error(
                f"Failed to update task {task.id}: {str(e)}",
                exc_info=True,
                extra={'task_id': task.id}
            )
            raise ValidationException(f"Failed to update task: {str(e)}")
    
    @staticmethod
    def delete_task(task: Task, soft: bool = False) -> None:
        """
        Delete a task (hard or soft delete).
        
        Args:
            task: Task instance to delete
            soft: If True, perform soft delete; if False, hard delete
        """
        try:
            user_id = task.user.id
            task_id = task.id
            
            with transaction.atomic():
                if soft:
                    task.soft_delete(save=True)
                    logger.info(f"Task soft deleted: ID={task_id}, User={user_id}")
                else:
                    task.delete()
                    logger.info(f"Task hard deleted: ID={task_id}, User={user_id}")
                
                # Invalidate caches
                TaskService._invalidate_user_cache(user_id)
                TaskService._invalidate_task_cache(task_id)
                
        except Exception as e:
            logger.error(
                f"Failed to delete task {task.id}: {str(e)}",
                exc_info=True,
                extra={'task_id': task.id}
            )
            raise ValidationException(f"Failed to delete task: {str(e)}")
    
    @staticmethod
    def get_user_tasks(
        user,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        overdue: Optional[bool] = None,
        optimize_for_list: bool = False
    ) -> QuerySet:
        """
        Get filtered tasks for a user with query optimization.
        
        Args:
            user: User whose tasks to retrieve
            status: Optional status filter
            priority: Optional priority filter
            overdue: Optional overdue filter
            optimize_for_list: If True, use optimized_list() for minimal data
            
        Returns:
            QuerySet: Filtered task queryset
        """
        # Start with optimized base query
        if optimize_for_list:
            queryset = Task.objects.filter(user=user).optimized_list()
        else:
            queryset = Task.objects.filter(user=user).with_user_data()
        
        # Apply filters
        if status:
            queryset = queryset.filter(status=status)
        
        if priority:
            queryset = queryset.filter(priority=priority)
        
        if overdue is True:
            now = timezone.now()
            queryset = queryset.filter(
                due_date__lt=now
            ).exclude(status__in=[Task.Status.COMPLETED, Task.Status.CANCELLED])
        
        return queryset
    
    @staticmethod
    def get_task_statistics(user, use_cache: bool = True) -> Dict[str, int]:
        """
        Calculate task statistics for a user with caching.
        
        Args:
            user: User whose statistics to calculate
            use_cache: Whether to use cache (default: True)
            
        Returns:
            Dict: Dictionary containing task statistics
        """
        cache_key = f'{TaskService.CACHE_PREFIX}_stats_{user.id}'
        
        if use_cache:
            cached_stats = cache.get(cache_key)
            if cached_stats:
                logger.debug(f"Cache hit for task stats user {user.id}")
                return cached_stats
        
        try:
            # Use the optimized statistics() method from QuerySet
            stats = Task.objects.for_user(user).statistics()
            
            if use_cache:
                cache.set(cache_key, stats, TaskService.CACHE_TIMEOUT)
                logger.debug(f"Cached task stats for user {user.id}")
            
            logger.info(
                f"Calculated task stats for user {user.id}",
                extra={'user_id': user.id}
            )
            return stats
            
        except Exception as e:
            logger.error(
                f"Failed to calculate stats for user {user.id}: {str(e)}",
                exc_info=True,
                extra={'user_id': user.id}
            )
            raise ValidationException(f"Failed to calculate statistics: {str(e)}")
    
    @staticmethod
    def bulk_update_status(
        user,
        task_ids: List[int],
        new_status: str
    ) -> int:
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
                # Use the manager's bulk_update_status method
                updated_count = Task.objects.filter(
                    user=user,
                    id__in=task_ids
                ).count()
                
                if updated_count == 0:
                    return 0
                
                Task.objects.bulk_update_status(task_ids, new_status)
                
                # Invalidate cache
                TaskService._invalidate_user_cache(user.id)
                
                logger.info(
                    f"Bulk updated {updated_count} tasks for user {user.id} "
                    f"to status '{new_status}'",
                    extra={'user_id': user.id, 'count': updated_count}
                )
                return updated_count
                
        except Exception as e:
            logger.error(
                f"Failed to bulk update tasks for user {user.id}: {str(e)}",
                exc_info=True,
                extra={'user_id': user.id}
            )
            raise ValidationException(f"Failed to bulk update tasks: {str(e)}")
    
    @staticmethod
    def bulk_delete_tasks(user, task_ids: List[int], soft: bool = False) -> int:
        """
        Bulk delete tasks for a user.
        
        Args:
            user: User who owns the tasks
            task_ids: List of task IDs to delete
            soft: If True, perform soft delete; if False, hard delete
            
        Returns:
            int: Number of tasks deleted
        """
        try:
            with transaction.atomic():
                tasks = Task.objects.filter(user=user, id__in=task_ids)
                count = tasks.count()
                
                if count == 0:
                    return 0
                
                if soft:
                    Task.objects.bulk_soft_delete(task_ids)
                    logger.info(f"Bulk soft deleted {count} tasks for user {user.id}")
                else:
                    tasks.delete()
                    logger.info(f"Bulk hard deleted {count} tasks for user {user.id}")
                
                # Invalidate cache
                TaskService._invalidate_user_cache(user.id)
                
                return count
                
        except Exception as e:
            logger.error(
                f"Failed to bulk delete tasks for user {user.id}: {str(e)}",
                exc_info=True,
                extra={'user_id': user.id}
            )
            raise ValidationException(f"Failed to bulk delete tasks: {str(e)}")
    
    @staticmethod
    def duplicate_task(task: Task, custom_title: Optional[str] = None) -> Task:
        """
        Duplicate a task.
        
        Args:
            task: Task to duplicate
            custom_title: Optional custom title for the duplicate
            
        Returns:
            Task: New duplicated task instance
        """
        try:
            with transaction.atomic():
                duplicate = task.duplicate()
                
                if custom_title:
                    duplicate.title = custom_title
                
                duplicate.save()
                
                # Invalidate cache
                TaskService._invalidate_user_cache(task.user.id)
                
                logger.info(
                    f"Task duplicated: Original={task.id}, Duplicate={duplicate.id}",
                    extra={'user_id': task.user.id, 'task_id': duplicate.id}
                )
                return duplicate
                
        except Exception as e:
            logger.error(
                f"Failed to duplicate task {task.id}: {str(e)}",
                exc_info=True,
                extra={'task_id': task.id}
            )
            raise ValidationException(f"Failed to duplicate task: {str(e)}")
    
    @staticmethod
    def get_overdue_tasks(user) -> QuerySet:
        """
        Get all overdue tasks for a user.
        
        Args:
            user: User whose overdue tasks to retrieve
            
        Returns:
            QuerySet: Overdue tasks
        """
        return Task.objects.for_user(user).overdue()
    
    @staticmethod
    def get_due_soon_tasks(user, hours: int = 24) -> QuerySet:
        """
        Get tasks due soon for a user.
        
        Args:
            user: User whose tasks to retrieve
            hours: Number of hours to look ahead (default: 24)
            
        Returns:
            QuerySet: Tasks due soon
        """
        return Task.objects.for_user(user).due_soon(hours=hours)
    
    @staticmethod
    def _invalidate_user_cache(user_id: int) -> None:
        """
        Invalidate all cache entries for a user.
        
        Args:
            user_id: User ID to invalidate cache for
        """
        cache_keys = [
            f'{TaskService.CACHE_PREFIX}_stats_{user_id}',
        ]
        cache.delete_many(cache_keys)
        logger.debug(f"Invalidated task cache for user {user_id}")
    
    @staticmethod
    def _invalidate_task_cache(task_id: int) -> None:
        """
        Invalidate cache entries for a specific task.
        
        Args:
            task_id: Task ID to invalidate cache for
        """
        cache_key = f'{TaskService.CACHE_PREFIX}_{task_id}'
        cache.delete(cache_key)
        logger.debug(f"Invalidated cache for task {task_id}")