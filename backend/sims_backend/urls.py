import os
import subprocess
import time

import django_rq
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.core.management import call_command
from django.db import connection
from django.http import JsonResponse
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from core.views import (
    ChangePasswordView,
    EmailTokenObtainPairView,
    LogoutView,
    MeView,
    TokenRefreshView,
    UnifiedLoginView,
    dashboard_stats,
)


def _get_version():
    """Get application version from git or environment variable."""
    # Try to get from environment variable first
    version = os.getenv("APP_VERSION", os.getenv("VERSION", "unknown"))
    
    if version == "unknown":
        # Try to get git SHA
        try:
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                capture_output=True,
                text=True,
                timeout=2,
                check=False,
            )
            if result.returncode == 0:
                version = result.stdout.strip()[:8]  # Short SHA
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
            pass
    
    return version


def _check_migrations():
    """Check if there are any pending migrations."""
    try:
        # Use Django's migration loader to check for unapplied migrations
        from django.db.migrations.loader import MigrationLoader
        from django.db import connection
        
        loader = MigrationLoader(connection)
        unapplied = loader.graph.leaf_nodes() - loader.applied_migrations
        
        if unapplied:
            return {"status": "fail", "pending_count": len(unapplied)}
        return {"status": "ok"}
    except Exception as e:
        # If migration check fails, we still consider it a failure
        return {"status": "fail", "error": str(e)}


def health_check(request):
    """
    Canonical health/readiness endpoint.
    
    Returns:
        - 200 OK if all checks pass (status: "ok")
        - 200 OK with status: "degraded" if optional checks fail (Redis)
        - Response JSON schema:
          {
            "status": "ok" | "degraded",
            "checks": {
              "db": {"status": "ok"|"fail", "latency_ms": number},
              "migrations": {"status": "ok"|"fail"},
              "redis": {"status": "ok"|"fail"|"skipped"}
            },
            "version": "<git sha or app version>"
          }
    """
    response_data = {
        "status": "ok",
        "checks": {},
        "version": _get_version(),
    }
    
    # Check database connectivity and measure latency
    db_status = "ok"
    db_latency_ms = 0
    try:
        start_time = time.time()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_latency_ms = round((time.time() - start_time) * 1000, 2)
    except Exception as e:
        db_status = "fail"
        response_data["status"] = "degraded"
        response_data["checks"]["db"] = {
            "status": db_status,
            "latency_ms": 0,
            "error": str(e),
        }
    else:
        response_data["checks"]["db"] = {
            "status": db_status,
            "latency_ms": db_latency_ms,
        }
    
    # Check migrations (only if DB is accessible)
    if db_status == "ok":
        migrations_check = _check_migrations()
        response_data["checks"]["migrations"] = migrations_check
        if migrations_check["status"] == "fail":
            response_data["status"] = "degraded"
    else:
        response_data["checks"]["migrations"] = {"status": "fail", "error": "Database unreachable"}
        response_data["status"] = "degraded"
    
    # Check Redis (optional - does not fail readiness, but marks as degraded)
    redis_status = "skipped"
    try:
        queue = django_rq.get_queue("default")
        queue.connection.ping()
        redis_status = "ok"
    except Exception as e:
        # Redis is optional, so we don't fail readiness if it's down
        # But mark overall status as degraded to indicate optional service is unavailable
        redis_status = "fail"
        if response_data["status"] == "ok":
            response_data["status"] = "degraded"
    
    response_data["checks"]["redis"] = {"status": redis_status}
    
    # Return 200 even if degraded (following Kubernetes readiness pattern)
    # The status field indicates the actual health state
    return JsonResponse(response_data, status=200)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health"),
    path("healthz/", health_check, name="healthz"),  # Alias for health check
    path("api/health/", health_check, name="api_health"),  # Requirement alias
    # New unified auth endpoints (canonical)
    path("api/auth/login/", UnifiedLoginView.as_view(), name="auth_login"),
    path("api/auth/logout/", LogoutView.as_view(), name="auth_logout"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="auth_refresh"),
    path("api/auth/me/", MeView.as_view(), name="auth_me"),
    path("api/auth/change-password/", ChangePasswordView.as_view(), name="auth_change_password"),
    # Legacy auth endpoints (deprecated, kept for backward compatibility)
    path(
        "api/auth/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"
    ),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh_legacy",
    ),
    path("api/dashboard/stats/", dashboard_stats, name="dashboard_stats"),
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="api-schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="api-schema"),
        name="redoc",
    ),
    # Core RBAC
    path("", include("core.urls")),
    # People (identity)
    path("", include("sims_backend.people.urls")),
    # MVP apps
    path("", include("sims_backend.academics.urls")),
    path("", include("sims_backend.students.urls")),
    path("api/compliance/", include("sims_backend.compliance.urls")),
    path("", include("sims_backend.faculty.imports.urls")),
    path("", include("sims_backend.timetable.urls")),
    path("", include("sims_backend.attendance.urls")),
    path("", include("sims_backend.notifications.urls")),
    path("", include("sims_backend.exams.urls")),
    path("", include("sims_backend.results.urls")),
    path("", include("sims_backend.finance.urls")),
    path("", include("sims_backend.audit.urls")),
    path("", include("sims_backend.transcripts.urls")),
    # Admin control plane
    path("", include("sims_backend.admin.urls")),
    path("", include("sims_backend.syllabus.urls")),
    path("", include("sims_backend.settings_app.urls")),
    # Legacy apps removed - see docs/legacy/LEGACY_DEFINITION.md
]

# Static files in DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
