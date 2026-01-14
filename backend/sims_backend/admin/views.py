"""Admin control plane views."""
from datetime import timedelta
import secrets
import string

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db.models import Count, Q
from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.academics.models import Program, Course
from sims_backend.attendance.models import Attendance
from sims_backend.audit.models import AuditLog
from sims_backend.common_permissions import IsAdmin, in_group
from sims_backend.students.models import Student
from sims_backend.admin.serializers import (
    AdminUserSerializer,
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
)

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_dashboard(request):
    """
    Admin dashboard overview endpoint.
    
    Returns:
    - counts: students, faculty, programs, courses
    - attendance_stats: last 7 days aggregate
    - recent_activity: last 20 audit log entries
    - system: app version, server time, env label
    """
    # Counts
    total_students = Student.objects.filter(status=Student.STATUS_ACTIVE).count()
    
    # Count faculty (users in FACULTY group)
    total_faculty = User.objects.filter(groups__name="FACULTY").distinct().count()
    
    total_programs = Program.objects.filter(is_active=True).count()
    total_courses = Course.objects.count()
    
    # Attendance stats (last 7 days)
    seven_days_ago = timezone.now() - timedelta(days=7)
    
    # Get attendance records from last 7 days
    recent_attendance = Attendance.objects.filter(
        marked_at__gte=seven_days_ago
    )
    
    total_marked = recent_attendance.count()
    absent_count = recent_attendance.filter(status=Attendance.STATUS_ABSENT).count()
    late_count = recent_attendance.filter(status=Attendance.STATUS_LATE).count()
    present_count = recent_attendance.filter(status=Attendance.STATUS_PRESENT).count()
    
    absent_pct = round((absent_count / total_marked * 100) if total_marked > 0 else 0, 1)
    late_pct = round((late_count / total_marked * 100) if total_marked > 0 else 0, 1)
    
    # Missing entries: sessions created in last 7 days without attendance
    from sims_backend.timetable.models import Session
    recent_sessions = Session.objects.filter(
        created_at__gte=seven_days_ago
    )
    sessions_with_attendance = recent_attendance.values_list('session_id', flat=True).distinct()
    missing_entries = recent_sessions.exclude(id__in=sessions_with_attendance).count()
    
    # Recent activity (last 20 audit log entries)
    recent_activity = AuditLog.objects.select_related('actor').order_by('-timestamp')[:20]
    activity_list = [
        {
            "id": str(log.id),
            "actor": log.actor.username if log.actor else "System",
            "action": log.action,
            "entity": log.entity or log.model or "",
            "timestamp": log.timestamp.isoformat(),
            "summary": log.summary,
        }
        for log in recent_activity
    ]
    
    # System info
    from django.conf import settings
    import os
    
    system_info = {
        "app_version": getattr(settings, "APP_VERSION", "1.0.0"),
        "server_time": timezone.now().isoformat(),
        "env_label": "production" if not settings.DEBUG else "development",
        "django_version": "5.1.4",  # From settings comment
    }
    
    return Response({
        "counts": {
            "students": total_students,
            "faculty": total_faculty,
            "programs": total_programs,
            "courses": total_courses,
        },
        "attendance_stats": {
            "last_7_days": {
                "total_marked": total_marked,
                "absent_percent": absent_pct,
                "late_percent": late_pct,
                "missing_entries": missing_entries,
            }
        },
        "recent_activity": activity_list,
        "system": system_info,
    })


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admin user management.
    Admin-only access.
    """
    
    queryset = User.objects.all().prefetch_related("groups")
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["is_active"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["username", "email", "date_joined", "last_login"]
    ordering = ["username"]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return AdminUserCreateSerializer
        elif self.action in ["update", "partial_update"]:
            return AdminUserUpdateSerializer
        return AdminUserSerializer
    
    def get_queryset(self):
        """Filter by role if provided."""
        queryset = super().get_queryset()
        
        role = self.request.query_params.get("role")
        if role:
            queryset = queryset.filter(groups__name=role.upper())
        
        q = self.request.query_params.get("q")
        if q:
            queryset = queryset.filter(
                Q(username__icontains=q) |
                Q(email__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q)
            )
        
        return queryset.distinct()
    
    def create(self, request, *args, **kwargs):
        """Create a new user."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log audit
        AuditLog.objects.create(
            actor=request.user,
            method="POST",
            path=request.path,
            status_code=201,
            action=AuditLog.ACTION_CREATE,
            entity="User",
            entity_id=str(user.id),
            summary=f"Created user: {user.username}",
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            AdminUserSerializer(user).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )
    
    def update(self, request, *args, **kwargs):
        """Update a user."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        
        # Guardrail: Cannot deactivate last admin
        if not request.data.get("is_active", True) and instance.is_superuser:
            admin_count = User.objects.filter(is_superuser=True, is_active=True).count()
            if admin_count <= 1:
                return Response(
                    {"error": "Cannot deactivate the last admin user"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log audit
        AuditLog.objects.create(
            actor=request.user,
            method=request.method,
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_UPDATE,
            entity="User",
            entity_id=str(user.id),
            summary=f"Updated user: {user.username}",
        )
        
        return Response(AdminUserSerializer(user).data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a user (soft delete by deactivating)."""
        instance = self.get_object()
        
        # Guardrail: Cannot delete last admin
        if instance.is_superuser:
            admin_count = User.objects.filter(is_superuser=True, is_active=True).count()
            if admin_count <= 1:
                return Response(
                    {"error": "Cannot delete the last admin user"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        
        # Soft delete by deactivating
        instance.is_active = False
        instance.save()
        
        # Log audit
        AuditLog.objects.create(
            actor=request.user,
            method="DELETE",
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_DELETE,
            entity="User",
            entity_id=str(instance.id),
            summary=f"Deactivated user: {instance.username}",
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        """Reset user password and return temporary password."""
        user = self.get_object()
        
        # Generate temporary password
        alphabet = string.ascii_letters + string.digits
        temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))
        
        user.set_password(temp_password)
        user.save()
        
        # Log audit
        AuditLog.objects.create(
            actor=request.user,
            method="POST",
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_SPECIAL,
            entity="User",
            entity_id=str(user.id),
            summary=f"Reset password for user: {user.username}",
        )
        
        return Response({
            "success": True,
            "temporary_password": temp_password,
            "message": "Password reset successfully. Share this temporary password with the user.",
        })
    
    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        """Activate a user."""
        user = self.get_object()
        user.is_active = True
        user.save()
        
        # Log audit
        AuditLog.objects.create(
            actor=request.user,
            method="POST",
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_UPDATE,
            entity="User",
            entity_id=str(user.id),
            summary=f"Activated user: {user.username}",
        )
        
        return Response(AdminUserSerializer(user).data)
    
    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        """Deactivate a user."""
        user = self.get_object()
        
        # Guardrail: Cannot deactivate last admin
        if user.is_superuser:
            admin_count = User.objects.filter(is_superuser=True, is_active=True).count()
            if admin_count <= 1:
                return Response(
                    {"error": "Cannot deactivate the last admin user"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        
        user.is_active = False
        user.save()
        
        # Log audit
        AuditLog.objects.create(
            actor=request.user,
            method="POST",
            path=request.path,
            status_code=200,
            action=AuditLog.ACTION_UPDATE,
            entity="User",
            entity_id=str(user.id),
            summary=f"Deactivated user: {user.username}",
        )
        
        return Response(AdminUserSerializer(user).data)
    
    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        """
        Search users for impersonation.
        
        GET /api/admin/users/search?query=<search_term>
        Returns: List of users matching query (excluding admins and inactive users)
        """
        query = request.query_params.get("query", "").strip()
        
        if not query:
            return Response(
                {"error": "query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Search users by username, email, first_name, last_name
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(email__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        ).filter(
            is_active=True
        ).exclude(
            is_superuser=True
        ).exclude(
            groups__name__in=["ADMIN", "Admin"]
        ).distinct()[:20]  # Limit to 20 results
        
        serializer = AdminUserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)