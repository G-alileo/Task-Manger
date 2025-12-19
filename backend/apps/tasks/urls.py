"""
URL configuration for task API endpoints.

This module defines URL patterns for task CRUD operations,
filtering, searching, and statistics endpoints.
"""

from django.urls import path

from .views import (
    TaskListCreateView,
    TaskDetailView,
    TaskStatsView
)

app_name = 'tasks'

urlpatterns = [
    # Task CRUD endpoints
    path('', TaskListCreateView.as_view(), name='task-list-create'),
    path('<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    
    # Statistics endpoint
    path('stats/', TaskStatsView.as_view(), name='task-stats'),
]
