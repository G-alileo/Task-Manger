import logging
from typing import Any
from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from apps.core.exceptions import ResourceNotFoundException, ValidationException
from .models import Task
from .serializers import (
    TaskSerializer,
    TaskListSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatsSerializer,
    BulkStatusUpdateSerializer,
    BulkTaskActionSerializer,
    TaskDuplicateSerializer
)
from .services import TaskService

# Setup logger
logger = logging.getLogger('apps.tasks')


class TaskListCreateView(generics.ListCreateAPIView):
    
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method == 'POST':
            return TaskCreateSerializer
        # Use lightweight serializer for list view
        if self.request.method == 'GET':
            return TaskListSerializer
        return TaskSerializer
    
    def get_queryset(self):
        status_param = self.request.query_params.get('status')
        priority_param = self.request.query_params.get('priority')
        overdue_param = self.request.query_params.get('overdue', '').lower() == 'true'
        
        # Use service layer with query optimization
        queryset = TaskService.get_user_tasks(
            user=self.request.user,
            status=status_param,
            priority=priority_param,
            overdue=overdue_param if overdue_param else None,
            optimize_for_list=True  # Use lightweight query
        )
        
        return queryset
    
    @extend_schema(
        tags=['Tasks'],
        summary='List user tasks',
        description='Get all tasks for the authenticated user with optional filtering and search.',
        parameters=[
            OpenApiParameter('status', str, description='Filter by status'),
            OpenApiParameter('priority', str, description='Filter by priority'),
            OpenApiParameter('overdue', bool, description='Filter overdue tasks'),
            OpenApiParameter('search', str, description='Search in title and description'),
            OpenApiParameter('ordering', str, description='Order by field'),
        ],
        responses={200: TaskListSerializer(many=True)}
    )
    def get(self, request, *args, **kwargs):
        """Handle GET request for listing tasks."""
        logger.info(
            f"User {request.user.id} listing tasks",
            extra={'user_id': request.user.id}
        )
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
        """Handle POST request for creating tasks using service layer."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Use service layer for creation with transaction safety
        task = TaskService.create_task(
            user=request.user,
            validated_data=serializer.validated_data
        )
        
        # Serialize response with full serializer
        response_serializer = TaskSerializer(task)
        
        logger.info(
            f"User {request.user.id} created task {task.id}",
            extra={'user_id': request.user.id, 'task_id': task.id}
        )
        
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method in ['PUT', 'PATCH']:
            return TaskUpdateSerializer
        return TaskSerializer
    
    def get_queryset(self):
        """Return optimized tasks owned by the authenticated user."""
        return Task.objects.filter(user=self.request.user).with_user_data()
    
    def get_object(self):
        """Get object with proper error handling."""
        try:
            return super().get_object()
        except Task.DoesNotExist:
            logger.warning(
                f"Task not found for user {self.request.user.id}",
                extra={'user_id': self.request.user.id}
            )
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
        """Handle GET request for task detail."""
        logger.info(
            f"User {request.user.id} retrieving task {kwargs.get('pk')}",
            extra={'user_id': request.user.id}
        )
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        tags=['Tasks'],
        summary='Update task',
        description='Update an existing task (full update).',
        request=TaskUpdateSerializer,
        responses={
            200: TaskSerializer,
            400: OpenApiResponse(description='Validation error'),
            404: OpenApiResponse(description='Task not found'),
        }
    )
    def put(self, request, *args, **kwargs):
        """Handle PUT request for full task update."""
        return self.partial_update(request, *args, **kwargs)
    
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
        """Handle PATCH request using service layer."""
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
        
        logger.info(
            f"User {request.user.id} updated task {task.id}",
            extra={'user_id': request.user.id, 'task_id': task.id}
        )
        
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
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
        """Handle DELETE request using service layer."""
        task = self.get_object()
        task_id = task.id
        
        # Use service layer for deletion with transaction safety
        TaskService.delete_task(task, soft=False)
        
        logger.info(
            f"User {request.user.id} deleted task {task_id}",
            extra={'user_id': request.user.id, 'task_id': task_id}
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Tasks'],
        summary='Get task statistics',
        description='Get cached statistics about user tasks (5-minute cache TTL).',
        responses={200: TaskStatsSerializer}
    )
    def get(self, request: Any) -> Response:
        # Use service layer with caching (5-minute TTL)
        stats = TaskService.get_task_statistics(request.user, use_cache=True)
        
        serializer = TaskStatsSerializer(data=stats)
        serializer.is_valid()
        
        logger.info(
            f"User {request.user.id} retrieved task statistics",
            extra={'user_id': request.user.id}
        )
        
        return Response({
            'status': 'success',
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class BulkTaskUpdateView(APIView):
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Tasks'],
        summary='Bulk update task status',
        description='Update status for multiple tasks in a single operation.',
        request=BulkStatusUpdateSerializer,
        responses={
            200: OpenApiResponse(description='Tasks updated successfully'),
            400: OpenApiResponse(description='Validation error'),
        }
    )
    def post(self, request: Any) -> Response:
        """Handle bulk status update."""
        serializer = BulkStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task_ids = serializer.validated_data['task_ids']
        new_status = serializer.validated_data['status']
        
        # Use service layer for bulk update
        updated_count = TaskService.bulk_update_status(
            user=request.user,
            task_ids=task_ids,
            new_status=new_status
        )
        
        logger.info(
            f"User {request.user.id} bulk updated {updated_count} tasks",
            extra={'user_id': request.user.id, 'count': updated_count}
        )
        
        return Response({
            'status': 'success',
            'message': f'Updated {updated_count} tasks',
            'count': updated_count
        }, status=status.HTTP_200_OK)


class BulkTaskDeleteView(APIView):
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Tasks'],
        summary='Bulk delete tasks',
        description='Delete multiple tasks in a single operation.',
        request=BulkTaskActionSerializer,
        responses={
            200: OpenApiResponse(description='Tasks deleted successfully'),
            400: OpenApiResponse(description='Validation error'),
        }
    )
    def post(self, request: Any) -> Response:
        """Handle bulk delete."""
        serializer = BulkTaskActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task_ids = serializer.validated_data['task_ids']
        
        # Use service layer for bulk delete
        deleted_count = TaskService.bulk_delete_tasks(
            user=request.user,
            task_ids=task_ids,
            soft=False
        )
        
        logger.info(
            f"User {request.user.id} bulk deleted {deleted_count} tasks",
            extra={'user_id': request.user.id, 'count': deleted_count}
        )
        
        return Response({
            'status': 'success',
            'message': f'Deleted {deleted_count} tasks',
            'count': deleted_count
        }, status=status.HTTP_200_OK)


class TaskDuplicateView(APIView):
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Tasks'],
        summary='Duplicate a task',
        description='Create a copy of an existing task.',
        request=TaskDuplicateSerializer,
        responses={
            201: TaskSerializer,
            404: OpenApiResponse(description='Task not found'),
        }
    )
    def post(self, request: Any, pk: int) -> Response:
        """Handle task duplication."""
        # Get original task
        try:
            task = Task.objects.get(pk=pk, user=request.user)
        except Task.DoesNotExist:
            raise ResourceNotFoundException("Task not found")
        
        serializer = TaskDuplicateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        custom_title = serializer.validated_data.get('title')
        
        # Use service layer for duplication
        duplicate = TaskService.duplicate_task(task, custom_title=custom_title)
        
        # Serialize response
        response_serializer = TaskSerializer(duplicate)
        
        logger.info(
            f"User {request.user.id} duplicated task {task.id} to {duplicate.id}",
            extra={'user_id': request.user.id, 'task_id': duplicate.id}
        )
        
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )