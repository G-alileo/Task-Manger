"""
Comprehensive test suite for Task API endpoints and services.

This module contains unit and integration tests for task management,
including CRUD operations, filtering, statistics, and edge cases.
"""

import pytest
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient, APITestCase
from rest_framework import status

from apps.users.models import User
from .models import Task
from .services import TaskService


class TaskModelTestCase(TestCase):
    """Test cases for Task model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!@#'
        )
    
    def test_task_creation(self):
        """Test creating a task"""
        task = Task.objects.create(
            user=self.user,
            title='Test Task',
            description='Test Description',
            priority=Task.Priority.HIGH,
            status=Task.Status.TODO
        )
        
        self.assertEqual(task.title, 'Test Task')
        self.assertEqual(task.user, self.user)
        self.assertEqual(task.priority, Task.Priority.HIGH)
        self.assertIsNone(task.completed_at)
    
    def test_task_auto_complete_timestamp(self):
        """Test that completed_at is set automatically"""
        task = Task.objects.create(
            user=self.user,
            title='Test Task',
            status=Task.Status.TODO
        )
        
        # Mark as completed
        task.status = Task.Status.COMPLETED
        task.save()
        
        self.assertIsNotNone(task.completed_at)
    
    def test_task_is_overdue_property(self):
        """Test is_overdue property"""
        # Create overdue task
        past_date = timezone.now() - timedelta(days=1)
        overdue_task = Task.objects.create(
            user=self.user,
            title='Overdue Task',
            due_date=past_date,
            status=Task.Status.TODO
        )
        
        self.assertTrue(overdue_task.is_overdue)
        
        # Create future task
        future_date = timezone.now() + timedelta(days=1)
        future_task = Task.objects.create(
            user=self.user,
            title='Future Task',
            due_date=future_date,
            status=Task.Status.TODO
        )
        
        self.assertFalse(future_task.is_overdue)
    
    def test_task_string_representation(self):
        """Test __str__ method"""
        task = Task.objects.create(
            user=self.user,
            title='Test Task',
            status=Task.Status.TODO
        )
        
        expected = f"Test Task (To Do)"
        self.assertEqual(str(task), expected)


class TaskAPITestCase(APITestCase):
    """Test cases for Task API endpoints"""
    
    def setUp(self):
        """Set up test client and test data"""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!@#'
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
        
        # URLs
        self.list_url = reverse('tasks:task-list-create')
        self.stats_url = reverse('tasks:task-stats')
    
    def test_create_task_success(self):
        """Test creating a task successfully"""
        payload = {
            'title': 'New Task',
            'description': 'Task description',
            'priority': 'high',
            'status': 'todo',
            'due_date': (timezone.now() + timedelta(days=1)).isoformat()
        }
        
        response = self.client.post(self.list_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(Task.objects.first().title, 'New Task')
    
    def test_create_task_invalid_title(self):
        """Test creating a task with invalid title"""
        payload = {
            'title': 'AB',  # Too short
            'description': 'Task description'
        }
        
        response = self.client.post(self.list_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_task_past_due_date(self):
        """Test creating a task with past due date fails"""
        payload = {
            'title': 'New Task',
            'due_date': (timezone.now() - timedelta(days=1)).isoformat()
        }
        
        response = self.client.post(self.list_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_list_tasks_authenticated(self):
        """Test listing tasks for authenticated user"""
        # Create test tasks
        Task.objects.create(user=self.user, title='Task 1')
        Task.objects.create(user=self.user, title='Task 2')
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_list_tasks_unauthenticated(self):
        """Test listing tasks without authentication fails"""
        self.client.force_authenticate(user=None)
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_filter_tasks_by_status(self):
        """Test filtering tasks by status"""
        Task.objects.create(user=self.user, title='Todo Task', status=Task.Status.TODO)
        Task.objects.create(user=self.user, title='Completed Task', status=Task.Status.COMPLETED)
        
        response = self.client.get(f'{self.list_url}?status=todo')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Todo Task')
    
    def test_filter_tasks_by_priority(self):
        """Test filtering tasks by priority"""
        Task.objects.create(user=self.user, title='High Priority', priority=Task.Priority.HIGH)
        Task.objects.create(user=self.user, title='Low Priority', priority=Task.Priority.LOW)
        
        response = self.client.get(f'{self.list_url}?priority=high')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['priority'], 'high')
    
    def test_filter_overdue_tasks(self):
        """Test filtering overdue tasks"""
        # Create overdue task
        Task.objects.create(
            user=self.user,
            title='Overdue',
            due_date=timezone.now() - timedelta(days=1),
            status=Task.Status.TODO
        )
        # Create future task
        Task.objects.create(
            user=self.user,
            title='Future',
            due_date=timezone.now() + timedelta(days=1),
            status=Task.Status.TODO
        )
        
        response = self.client.get(f'{self.list_url}?overdue=true')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Overdue')
    
    def test_retrieve_task_success(self):
        """Test retrieving a specific task"""
        task = Task.objects.create(user=self.user, title='Test Task')
        detail_url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        
        response = self.client.get(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Task')
    
    def test_retrieve_other_user_task_fails(self):
        """Test retrieving another user's task fails"""
        other_user = User.objects.create_user(
            email='other@example.com',
            username='otheruser',
            password='TestPass123!@#'
        )
        task = Task.objects.create(user=other_user, title='Other User Task')
        detail_url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        
        response = self.client.get(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_task_success(self):
        """Test updating a task"""
        task = Task.objects.create(user=self.user, title='Original Title')
        detail_url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        
        payload = {'title': 'Updated Title', 'priority': 'urgent'}
        response = self.client.patch(detail_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.title, 'Updated Title')
        self.assertEqual(task.priority, Task.Priority.URGENT)
    
    def test_delete_task_success(self):
        """Test deleting a task"""
        task = Task.objects.create(user=self.user, title='To Delete')
        detail_url = reverse('tasks:task-detail', kwargs={'pk': task.id})
        
        response = self.client.delete(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task.id).exists())
    
    def test_task_statistics(self):
        """Test task statistics endpoint"""
        # Create various tasks
        Task.objects.create(user=self.user, title='Todo 1', status=Task.Status.TODO)
        Task.objects.create(user=self.user, title='Todo 2', status=Task.Status.TODO, priority=Task.Priority.URGENT)
        Task.objects.create(user=self.user, title='Completed', status=Task.Status.COMPLETED)
        Task.objects.create(
            user=self.user,
            title='Overdue',
            status=Task.Status.IN_PROGRESS,
            due_date=timezone.now() - timedelta(days=1)
        )
        
        response = self.client.get(self.stats_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['total'], 4)
        self.assertEqual(response.data['data']['todo'], 2)
        self.assertEqual(response.data['data']['completed'], 1)
        self.assertEqual(response.data['data']['overdue'], 1)
        self.assertEqual(response.data['data']['urgent'], 1)


class TaskServiceTestCase(TestCase):
    """Test cases for TaskService"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!@#'
        )
    
    def test_create_task_service(self):
        """Test creating a task via service"""
        data = {
            'title': 'Service Task',
            'description': 'Created via service',
            'priority': Task.Priority.HIGH
        }
        
        task = TaskService.create_task(self.user, data)
        
        self.assertIsNotNone(task.id)
        self.assertEqual(task.title, 'Service Task')
        self.assertEqual(task.user, self.user)
    
    def test_update_task_service(self):
        """Test updating a task via service"""
        task = Task.objects.create(user=self.user, title='Original')
        
        updated_data = {'title': 'Updated', 'status': Task.Status.COMPLETED}
        updated_task = TaskService.update_task(task, updated_data)
        
        self.assertEqual(updated_task.title, 'Updated')
        self.assertEqual(updated_task.status, Task.Status.COMPLETED)
        self.assertIsNotNone(updated_task.completed_at)
    
    def test_get_task_statistics_service(self):
        """Test getting statistics via service"""
        Task.objects.create(user=self.user, title='Task 1', status=Task.Status.TODO)
        Task.objects.create(user=self.user, title='Task 2', status=Task.Status.COMPLETED)
        
        stats = TaskService.get_task_statistics(self.user)
        
        self.assertEqual(stats['total'], 2)
        self.assertEqual(stats['todo'], 1)
        self.assertEqual(stats['completed'], 1)
    
    def test_bulk_update_status(self):
        """Test bulk status update"""
        task1 = Task.objects.create(user=self.user, title='Task 1')
        task2 = Task.objects.create(user=self.user, title='Task 2')
        
        updated_count = TaskService.bulk_update_status(
            self.user,
            [task1.id, task2.id],
            Task.Status.COMPLETED
        )
        
        self.assertEqual(updated_count, 2)
        task1.refresh_from_db()
        task2.refresh_from_db()
        self.assertEqual(task1.status, Task.Status.COMPLETED)
        self.assertEqual(task2.status, Task.Status.COMPLETED)
