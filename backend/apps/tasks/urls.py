from django.urls import path

from .views import (
    TaskListCreateView,
    TaskDetailView,
    TaskStatsView,
    BulkTaskUpdateView,
    BulkTaskDeleteView,
    TaskDuplicateView
)

app_name = 'tasks'

urlpatterns = [
    # Task CRUD endpoints
    path('', TaskListCreateView.as_view(), name='task-list-create'),
    path('<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    
    # Statistics endpoint
    path('stats/', TaskStatsView.as_view(), name='task-stats'),
    
    # Bulk operations
    path('bulk/update-status/', BulkTaskUpdateView.as_view(), name='task-bulk-update-status'),
    path('bulk/delete/', BulkTaskDeleteView.as_view(), name='task-bulk-delete'),
    
    # Task actions
    path('<int:pk>/duplicate/', TaskDuplicateView.as_view(), name='task-duplicate'),
]