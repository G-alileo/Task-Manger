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

from .models import Task
from .serializers import (
    TaskSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatsSerializer
)

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
        
        Query params:
        - status: Filter by status (todo, in_progress, completed, cancelled)
        - priority: Filter by priority (low, medium, high, urgent)
        - overdue: Filter overdue tasks (true/false)
        """
        queryset = Task.objects.filter(user=self.request.user)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by priority
        priority_param = self.request.query_params.get('priority')
        if priority_param:
            queryset = queryset.filter(priority=priority_param)
        
        # Filter overdue tasks
        overdue_param = self.request.query_params.get('overdue')
        if overdue_param and overdue_param.lower() == 'true':
            queryset = queryset.filter(
                due_date__lt=timezone.now(),
                status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS]
            )
        
        return queryset
    
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
        """Handle POST request for creating tasks"""
        logger.info(f"User {request.user.id} creating new task")
        return super().post(request, *args, **kwargs)


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
        """Return tasks owned by the authenticated user"""
        return Task.objects.filter(user=self.request.user)
    
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
        """Handle PATCH request for partial task update"""
        logger.info(f"User {request.user.id} partially updating task {kwargs.get('pk')}")
        return super().patch(request, *args, **kwargs)
    
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
        """Handle DELETE request for task deletion"""
        logger.info(f"User {request.user.id} deleting task {kwargs.get('pk')}")
        return super().delete(request, *args, **kwargs)


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
        description='Get statistics about user tasks including counts by status, priority, and overdue tasks.',
        responses={
            200: TaskStatsSerializer,
        }
    )
    def get(self, request: Any) -> Response:
        """
        Handle GET request for task statistics.
        
        Returns:
            Response: Task statistics data
        """
        user = request.user
        tasks = Task.objects.filter(user=user)
        
        # Calculate statistics
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
        
        logger.info(f"User {user.id} retrieved task statistics")
        
        serializer = TaskStatsSerializer(data=stats)
        serializer.is_valid()
        
        return Response({
            'status': 'success',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
