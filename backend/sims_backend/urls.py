import django_rq
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from core.views import (
    EmailTokenObtainPairView,
    LogoutView,
    MeView,
    TokenRefreshView,
    UnifiedLoginView,
    dashboard_stats,
)


def health_check(request):
    """Health check endpoint with service status"""
    status = {"status": "ok", "service": "SIMS Backend", "components": {}}

    # Check database
    try:
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        status["components"]["database"] = "ok"
    except Exception as e:
        status["components"]["database"] = f"error: {str(e)}"
        status["status"] = "degraded"

    # Check Redis/RQ
    try:
        queue = django_rq.get_queue("default")
        queue.connection.ping()
        status["components"]["redis"] = "ok"
        status["components"]["rq_queue"] = "ok"
    except Exception as e:
        status["components"]["redis"] = f"error: {str(e)}"
        status["status"] = "degraded"

    return JsonResponse(status)


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
    path("", include("sims_backend.timetable.urls")),
    path("", include("sims_backend.attendance.urls")),
    path("", include("sims_backend.exams.urls")),
    path("", include("sims_backend.results.urls")),
    path("", include("sims_backend.finance.urls")),
    path("", include("sims_backend.audit.urls")),
    path("", include("sims_backend.transcripts.urls")),
    # Legacy apps removed - see docs/legacy/LEGACY_DEFINITION.md
]

# Static files in DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
