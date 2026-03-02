import logging
from typing import Dict, Any
from django.core.cache import cache
from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('django')


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request) -> Response:

    health = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'service': 'task-manager-api',
        'checks': {}
    }
    
    # Database health check
    try:
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
        health['checks']['database'] = {
            'status': 'ok',
            'message': 'Database connection successful'
        }
    except Exception as e:
        health['checks']['database'] = {
            'status': 'failed',
            'message': f'Database connection failed: {str(e)}'
        }
        health['status'] = 'unhealthy'
        logger.error(f"Health check: Database connection failed - {str(e)}", exc_info=True)
    
    # Cache health check
    try:
        test_key = 'health_check_test'
        test_value = 'ok'
        cache.set(test_key, test_value, 10)
        retrieved_value = cache.get(test_key)
        
        if retrieved_value == test_value:
            health['checks']['cache'] = {
                'status': 'ok',
                'message': 'Cache is operational'
            }
            cache.delete(test_key)  # Cleanup
        else:
            health['checks']['cache'] = {
                'status': 'degraded',
                'message': 'Cache read/write mismatch'
            }
            
    except Exception as e:
        health['checks']['cache'] = {
            'status': 'failed',
            'message': f'Cache check failed: {str(e)}'
        }
        # Cache failure is not critical, don't mark as unhealthy
        logger.warning(f"Health check: Cache check failed - {str(e)}")
    
    # Determine HTTP status code
    status_code = status.HTTP_200_OK if health['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return Response(health, status=status_code)


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request) -> Response:
    ready = True
    checks = {}
    
    # Database readiness
    try:
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute('SELECT COUNT(*) FROM django_migrations')
            cursor.fetchone()
        checks['database'] = 'ready'
    except Exception as e:
        checks['database'] = f'not_ready: {str(e)}'
        ready = False
        logger.error(f"Readiness check: Database not ready - {str(e)}", exc_info=True)
    
    # Cache readiness
    try:
        cache.set('readiness_test', 'ok', 5)
        if cache.get('readiness_test') == 'ok':
            checks['cache'] = 'ready'
        else:
            checks['cache'] = 'not_ready: write/read mismatch'
            ready = False
    except Exception as e:
        checks['cache'] = f'not_ready: {str(e)}'
        # Cache is optional for readiness
        logger.warning(f"Readiness check: Cache not ready - {str(e)}")
    
    response_data = {
        'ready': ready,
        'timestamp': timezone.now().isoformat(),
        'checks': checks
    }
    
    status_code = status.HTTP_200_OK if ready else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(response_data, status=status_code)


@api_view(['GET'])
@permission_classes([AllowAny])
def liveness_check(request) -> Response:

    return Response(
        {
            'alive': True,
            'timestamp': timezone.now().isoformat(),
            'service': 'task-manager-api'
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
def metrics_summary(request) -> Response:
    metrics = {
        'timestamp': timezone.now().isoformat(),
        'database': {},
        'cache': {}
    }
    
    # Database metrics
    try:
        from django.db import connections
        db_conn = connections['default']
        metrics['database'] = {
            'vendor': db_conn.vendor,
            'connected': True
        }
    except Exception as e:
        metrics['database'] = {
            'connected': False,
            'error': str(e)
        }
        logger.error(f"Metrics: Database info failed - {str(e)}")
    
    # Cache metrics (Redis specific)
    try:
        from django.core.cache import caches
        cache_backend = caches['default']
        
        # Try to get Redis info if using Redis
        if hasattr(cache_backend, '_cache') and hasattr(cache_backend._cache, 'info'):
            redis_info = cache_backend._cache.info()
            metrics['cache'] = {
                'type': 'redis',
                'connected_clients': redis_info.get('connected_clients', 'N/A'),
                'used_memory_human': redis_info.get('used_memory_human', 'N/A'),
                'uptime_in_days': redis_info.get('uptime_in_days', 'N/A')
            }
        else:
            metrics['cache'] = {
                'type': 'local_memory',
                'status': 'operational'
            }
    except Exception as e:
        metrics['cache'] = {
            'status': 'unavailable',
            'error': str(e)
        }
        logger.warning(f"Metrics: Cache info failed - {str(e)}")
    
    return Response(metrics, status=status.HTTP_200_OK)
