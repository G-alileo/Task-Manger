"""
Custom exception handler for REST API.

Provides consistent error responses across the entire application
with proper logging and error tracking.
"""

import logging
from typing import Any, Dict, Optional

from django.core.exceptions import (
    ObjectDoesNotExist,
    PermissionDenied,
    ValidationError as DjangoValidationError
)
from django.db import DatabaseError, IntegrityError
from django.http import Http404

from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    ValidationError
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from .exceptions import TaskManagerBaseException


logger = logging.getLogger('django.request')


def custom_exception_handler(exc: Exception, context: Dict[str, Any]) -> Optional[Response]:
    """
    Custom exception handler that provides consistent error responses.
    
    Args:
        exc: The exception that was raised
        context: Context information about where the exception occurred
        
    Returns:
        Response: Formatted error response or None
    """
    # Call REST framework's default exception handler first
    response = drf_exception_handler(exc, context)
    
    # Get request information for logging
    request = context.get('view', None)
    request_user = getattr(request, 'request', None)
    user_id = getattr(request_user.user if request_user else None, 'id', 'Anonymous')
    request_path = getattr(request_user, 'path', 'Unknown') if request_user else 'Unknown'
    
    # Handle Django's database errors
    if isinstance(exc, DatabaseError):
        logger.error(
            f"Database error for user {user_id} on path {request_path}: {str(exc)}",
            exc_info=True,
            extra={'user_id': user_id, 'path': request_path}
        )
        return Response(
            {
                'status': 'error',
                'code': 'database_error',
                'message': 'A database error occurred. Please try again later.',
                'details': None if not response else response.data
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    # Handle integrity errors (unique constraints, foreign keys, etc.)
    if isinstance(exc, IntegrityError):
        logger.warning(
            f"Integrity error for user {user_id} on path {request_path}: {str(exc)}",
            extra={'user_id': user_id, 'path': request_path}
        )
        return Response(
            {
                'status': 'error',
                'code': 'integrity_error',
                'message': 'The operation violates data integrity constraints.',
                'details': 'A resource with these values already exists or a required relationship is missing.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle 404 errors
    if isinstance(exc, (Http404, ObjectDoesNotExist)):
        logger.info(
            f"Resource not found for user {user_id} on path {request_path}: {str(exc)}",
            extra={'user_id': user_id, 'path': request_path}
        )
        return Response(
            {
                'status': 'error',
                'code': 'not_found',
                'message': 'The requested resource was not found.',
                'details': None
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Handle permission denied
    if isinstance(exc, PermissionDenied):
        logger.warning(
            f"Permission denied for user {user_id} on path {request_path}: {str(exc)}",
            extra={'user_id': user_id, 'path': request_path}
        )
        return Response(
            {
                'status': 'error',
                'code': 'permission_denied',
                'message': 'You do not have permission to perform this action.',
                'details': str(exc) if str(exc) else None
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Handle authentication errors
    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        logger.info(
            f"Authentication failed for user {user_id} on path {request_path}: {str(exc)}",
            extra={'user_id': user_id, 'path': request_path}
        )
        return Response(
            {
                'status': 'error',
                'code': 'authentication_failed',
                'message': 'Authentication credentials were not provided or are invalid.',
                'details': str(exc) if str(exc) else None
            },
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Handle validation errors
    if isinstance(exc, (ValidationError, DjangoValidationError)):
        logger.info(
            f"Validation error for user {user_id} on path {request_path}: {str(exc)}",
            extra={'user_id': user_id, 'path': request_path}
        )
        error_details = response.data if response else str(exc)
        return Response(
            {
                'status': 'error',
                'code': 'validation_error',
                'message': 'Data validation failed.',
                'details': error_details
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle custom Task Manager exceptions
    if isinstance(exc, TaskManagerBaseException):
        logger.error(
            f"Custom exception for user {user_id} on path {request_path}: {exc.__class__.__name__} - {str(exc)}",
            exc_info=True,
            extra={'user_id': user_id, 'path': request_path}
        )
        return Response(
            {
                'status': 'error',
                'code': getattr(exc, 'default_code', 'error'),
                'message': str(exc),
                'details': None
            },
            status=exc.status_code
        )
    
    # Handle other DRF API exceptions
    if isinstance(exc, APIException):
        logger.error(
            f"API exception for user {user_id} on path {request_path}: {exc.__class__.__name__} - {str(exc)}",
            exc_info=True,
            extra={'user_id': user_id, 'path': request_path}
        )
        return Response(
            {
                'status': 'error',
                'code': getattr(exc, 'default_code', 'api_error'),
                'message': str(exc),
                'details': response.data if response else None
            },
            status=response.status_code if response else status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Handle all other unexpected exceptions
    if response is None:
        logger.critical(
            f"Unhandled exception for user {user_id} on path {request_path}: {exc.__class__.__name__} - {str(exc)}",
            exc_info=True,
            extra={'user_id': user_id, 'path': request_path, 'exception_type': type(exc).__name__}
        )
        return Response(
            {
                'status': 'error',
                'code': 'internal_server_error',
                'message': 'An unexpected error occurred. Please try again later.',
                'details': None  # Don't expose internal error details in production
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Format the response for consistency
    if response is not None:
        response.data = {
            'status': 'error',
            'code': getattr(exc, 'default_code', 'error'),
            'message': response.data.get('detail', str(exc)),
            'details': {k: v for k, v in response.data.items() if k != 'detail'} if len(response.data) > 1 else None
        }
    
    return response
