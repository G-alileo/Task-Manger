"""
Django app configuration for the core application.
"""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Configuration for the core app."""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
    verbose_name = 'Core'
    
    def ready(self):
        """
        Initialize app when Django starts.
        Can be used for signal registration or other startup tasks.
        """
        pass
