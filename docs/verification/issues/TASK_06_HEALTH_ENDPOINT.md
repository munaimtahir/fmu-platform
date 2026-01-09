# Issue: Missing Dedicated Health Check Endpoint

**Task**: Task 6 (Health checks/readiness)  
**Severity**: Minor  
**Status**: Recommendation  
**Date**: 2026-01-09

## Description

The application lacks a dedicated `/api/health/` or `/api/readiness/` endpoint for monitoring and orchestration tools to check service health.

## Current State

**Health Checks**: Implicit only
- ✅ Database connection: Via Django ORM (works if queries succeed)
- ✅ Application running: If HTTP responses work
- ✅ Frontend serving: Nginx serves static files

**Missing**: Explicit health/readiness endpoints

## Expected Implementation

### Health Endpoint

```python
# backend/core/views.py
from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint for monitoring.
    Returns 200 if service is healthy.
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return Response({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': timezone.now().isoformat()
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
```

### Readiness Endpoint

```python
@api_view(['GET'])
def readiness_check(request):
    """
    Readiness check endpoint for orchestration.
    Returns 200 if service is ready to accept traffic.
    """
    # Check critical dependencies
    checks = {
        'database': check_database(),
        'migrations': check_migrations(),
        'redis': check_redis() if REDIS_ENABLED else True
    }
    
    all_ready = all(checks.values())
    
    return Response({
        'ready': all_ready,
        'checks': checks,
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_200_OK if all_ready else status.HTTP_503_SERVICE_UNAVAILABLE)
```

### URL Configuration

```python
# backend/sims_backend/urls.py
urlpatterns = [
    path('api/health/', health_check, name='health'),
    path('api/readiness/', readiness_check, name='readiness'),
    # ... other patterns
]
```

## Use Cases

### 1. Kubernetes Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /api/health/
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### 2. Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /api/readiness/
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 3. Load Balancer Health Check
```
Target: /api/health/
Interval: 30s
Timeout: 5s
Healthy threshold: 2
Unhealthy threshold: 3
```

### 4. Monitoring/Alerting
```bash
# Nagios, Prometheus, etc.
curl http://app.example.com/api/health/
# Alert if status != 200
```

## Impact

**Current**: 
- ✅ Service works without health endpoints
- ✅ Basic availability can be checked via any endpoint
- ⚠️ No explicit health check for monitoring tools
- ⚠️ No way to distinguish startup vs. healthy state

**With Fix**:
- ✅ Explicit health status
- ✅ Kubernetes/Docker orchestration support
- ✅ Better monitoring integration
- ✅ Readiness vs. liveness separation

## Workarounds

### Current Approach
```bash
# Check if any API endpoint responds
curl http://127.0.0.1:8010/api/ -f
# Exit code 0 = healthy, non-zero = unhealthy
```

### Docker Compose Health Check
```yaml
# docker-compose.yml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Remediation Steps

1. **Create health check view** (5 minutes)
2. **Add URL patterns** (2 minutes)
3. **Test endpoints** (3 minutes)
4. **Update docker-compose.yml** (5 minutes)
5. **Document in API docs** (5 minutes)

**Total Time**: ~20 minutes

## Testing After Fix

```bash
# Test health endpoint
curl http://127.0.0.1:8010/api/health/
# Expected: {"status": "healthy", "database": "connected", ...}

# Test readiness endpoint
curl http://127.0.0.1:8010/api/readiness/
# Expected: {"ready": true, "checks": {...}, ...}

# Test unhealthy state (stop database)
docker compose stop db
curl http://127.0.0.1:8010/api/health/
# Expected: 503 status
```

## Priority

**LOW** - Nice to have, not blocking any functionality

## Files to Modify

- `backend/core/views.py` - Add health check views
- `backend/sims_backend/urls.py` - Add URL patterns
- `docker-compose.yml` - Add healthcheck configuration
- `docs/API.md` - Document new endpoints

## Status

**Open** - Recommendation for production deployment
