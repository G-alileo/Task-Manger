from rest_framework.exceptions import APIException
from rest_framework import status


class TaskManagerBaseException(APIException):
    """Base exception for all Task Manager custom exceptions"""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'An unexpected error occurred.'
    default_code = 'error'


class ResourceNotFoundException(TaskManagerBaseException):
    """Exception raised when a requested resource is not found"""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'The requested resource was not found.'
    default_code = 'resource_not_found'


class InvalidOperationException(TaskManagerBaseException):
    """Exception raised when an invalid operation is attempted"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'The requested operation is invalid.'
    default_code = 'invalid_operation'


class PermissionDeniedException(TaskManagerBaseException):
    """Exception raised when user lacks permission for an operation"""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_denied'


class AuthenticationFailedException(TaskManagerBaseException):
    """Exception raised when authentication fails"""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication failed. Please check your credentials.'
    default_code = 'authentication_failed'


class ValidationException(TaskManagerBaseException):
    """Exception raised when data validation fails"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Data validation failed.'
    default_code = 'validation_error'


class DatabaseException(TaskManagerBaseException):
    """Exception raised when database operations fail"""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'A database error occurred. Please try again later.'
    default_code = 'database_error'


class ExternalServiceException(TaskManagerBaseException):
    """Exception raised when external service calls fail"""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'An external service is temporarily unavailable.'
    default_code = 'external_service_error'


class RateLimitExceededException(TaskManagerBaseException):
    """Exception raised when rate limit is exceeded"""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'Rate limit exceeded. Please try again later.'
    default_code = 'rate_limit_exceeded'
