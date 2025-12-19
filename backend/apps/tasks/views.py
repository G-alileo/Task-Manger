"""
API views for task management.

This module contains views for task CRUD operations, filtering,
searching, and statistics with proper authentication and permissions.
"""

import logging
from typing import Any
from django.utils import timezone
from django.db.models import Q, Count
from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse, OpenApiExample

from apps.core.exceptions import ResourceNotFoundException, ValidationException
from .models import Task
from .serializers import (
    TaskSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatsSerializer
)
from .services import TaskService

# Setup logger
logger = logging.getLogger('apps.tasks')


class TaskListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating tasks.
    
    GET: List all tasks for the authenticated user with filtering and search.
    POST: Create a new task for the authenticated user.
    
    Permissions: Authenticated users only
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method"""
        if self.request.method == 'POST':
            return TaskCreateSerializer
        return TaskSerializer
    
    def get_queryset(self):
        """
        Return tasks for the authenticated user with optional filtering.
        Optimized with select_related to prevent N+1 queries.
        
        Query params:
        - status: Filter by status (todo, in_progress, completed, cancelled)
        - priority: Filter by priority (low, medium, high, urgent)
        - overdue: Filter overdue tasks (true/false)
        """
        try:
            status_param = self.request.query_params.get('status')
            priority_param = self.request.query_params.get('priority')
            overdue_param = self.request.query_params.get('overdue', '').lower() == 'true'
            
            # Use service layer for filtering with query optimization
            queryset = TaskService.get_user_tasks(
                user=self.request.user,
                status=status_param,
                priority=priority_param,
                overdue=overdue_param if overdue_param else None
            )
            
            return queryset
            
        except Exception as e:
            logger.error(f"Error fetching tasks for user {self.request.user.id}: {str(e)}", exc_info=True)
            raise ValidationException("Failed to retrieve tasks")
    
    @extend_schema(
        tags=['Tasks'],
        summary='List user tasks',
        description='Get all tasks for the authenticated user with optional filtering and search.',
        parameters=[
            OpenApiParameter('status', str, description='Filter by status (todo, in_progress, completed, cancelled)'),
            OpenApiParameter('priority', str, description='Filter by priority (low, medium, high, urgent)'),
            OpenApiParameter('overdue', bool, description='Filter overdue tasks'),
            OpenApiParameter('search', str, description='Search in title and description'),
            OpenApiParameter('ordering', str, description='Order by field (created_at, due_date, priority, etc.)'),
        ],
        responses={
            200: TaskSerializer(many=True),
        }
    )
    def get(self, request, *args, **kwargs):
        """Handle GET request for listing tasks"""
        logger.info(f"User {request.user.id} listing tasks")
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        tags=['Tasks'],
        summary='Create a new task',
        description='Create a new task for the authenticated user.',
        request=TaskCreateSerializer,
        responses={
            201: TaskSerializer,
            400: OpenApiResponse(description='Validation error'),
        }
    )
    def post(self, request, *args, **kwargs):
        """Handle POST request for creating tasks using service layer"""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Use service layer for creation with transaction safety
            task = TaskService.create_task(
                user=request.user,
                validated_data=serializer.validated_data
            )
            
            # Serialize response
            response_serializer = TaskSerializer(task)
            
            logger.info(f"User {request.user.id} created task {task.id}")
            
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except ValidationException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating task: {str(e)}", exc_info=True)
            raise ValidationException("Failed to create task")


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a specific task.
    
    GET: Retrieve task details
    PUT/PATCH: Update task
    DELETE: Delete task
    
    Permissions: Authenticated users (can only access their own tasks)
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method"""
        if self.request.method in ['PUT', 'PATCH']:
            return TaskUpdateSerializer
        return TaskSerializer
    
    def get_queryset(self):
        """Return tasks owned by the authenticated user with optimizations"""
        return Task.objects.filter(user=self.request.user).select_related('user')
    
    def get_object(self):
        """Get object with proper error handling"""
        try:
            return super().get_object()
        except Task.DoesNotExist:
            logger.warning(f"Task not found for user {self.request.user.id}")
            raise ResourceNotFoundException("Task not found")
    
    @extend_schema(
        tags=['Tasks'],
        summary='Get task details',
        description='Retrieve detailed information about a specific task.',
        responses={
            200: TaskSerializer,
            404: OpenApiResponse(description='Task not found'),
        }
    )
    def get(self, request, *args, **kwargs):
        """Handle GET request for task detail"""
        logger.info(f"User {request.user.id} retrieving task {kwargs.get('pk')}")
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        tags=['Tasks'],
        summary='Update task',
        description='Update an existing task (full or partial update).',
        request=TaskUpdateSerializer,
        responses={
            200: TaskSerializer,
            400: OpenApiResponse(description='Validation error'),
            404: OpenApiResponse(description='Task not found'),
        }
    )
    def put(self, request, *args, **kwargs):
        """Handle PUT request for full task update"""
        logger.info(f"User {request.user.id} updating task {kwargs.get('pk')}")
        return super().put(request, *args, **kwargs)
    
    @extend_schema(
        tags=['Tasks'],
        summary='Partially update task',
        description='Partially update an existing task.',
        request=TaskUpdateSerializer,
        responses={
            200: TaskSerializer,
            400: OpenApiResponse(description='Validation error'),
            404: OpenApiResponse(description='Task not found'),
        }
    )
    def patch(self, request, *args, **kwargs):
        """Handle PATCH request using service layer"""
        try:
            task = self.get_object()
            serializer = self.get_serializer(task, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # Use service layer for update with transaction safety
            updated_task = TaskService.update_task(
                task=task,
                validated_data=serializer.validated_data
            )
            
            # Serialize response
            response_serializer = TaskSerializer(updated_task)
            
            logger.info(f"User {request.user.id} updated task {task.id}")
            
            return Response(response_serializer.data, status=status.HTTP_200_OK)
            
        except ValidationException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error updating task: {str(e)}", exc_info=True)
            raise ValidationException("Failed to update task")
    
    @extend_schema(
        tags=['Tasks'],
        summary='Delete task',
        description='Delete an existing task.',
        responses={
            204: OpenApiResponse(description='Task deleted successfully'),
            404: OpenApiResponse(description='Task not found'),
        }
    )
    def delete(self, request, *args, **kwargs):
        """Handle DELETE request using service layer"""
        try:
            task = self.get_object()
            task_id = task.id
            
            # Use service layer for deletion with transaction safety
            TaskService.delete_task(task)
            
            logger.info(f"User {request.user.id} deleted task {task_id}")
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            logger.error(f"Error deleting task: {str(e)}", exc_info=True)
            raise ValidationException("Failed to delete task")


class TaskStatsView(APIView):
    """
    API endpoint for task statistics.
    
    GET: Get task statistics for the authenticated user including counts by status,
         priority, and overdue tasks.
    
    Permissions: Authenticated users only
    """
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Tasks'],
        summary='Get task statistics',
        description='Get cached statistics about user tasks including counts by status, priority, and overdue tasks.',
        responses={
            200: TaskStatsSerializer,
        }
    )
    def get(self, request: Any) -> Response:
        """
        Handle GET request for task statistics using cached service layer.
        
        Returns:
            Response: Task statistics data (cached for 5 minutes)
        """
        try:
            # Use service layer with caching (5-minute TTL)
            stats = TaskService.get_task_statistics(request.user)
            
            serializer = TaskStatsSerializer(data=stats)
            serializer.is_valid()
            
            logger.info(f"User {request.user.id} retrieved task statistics")
            
            return Response({
                'status': 'success',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error retrieving stats for user {request.user.id}: {str(e)}", exc_info=True)
            raise ValidationException("Failed to retrieve statistics")
