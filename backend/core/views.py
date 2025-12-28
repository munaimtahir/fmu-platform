"""Custom views for authentication and dashboard."""

import logging

from django.db.models import Count, ExpressionWrapper, F, FloatField, Q
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from sims_backend.academics.models import Course, Section
from sims_backend.admissions.models import Student
from sims_backend.attendance.models import Attendance
from sims_backend.common_permissions import in_group
from sims_backend.enrollment.models import Enrollment
from sims_backend.requests.models import Request
from sims_backend.results.models import Result

from .serializers import (
    AUTH_ERROR_CODES,
    EmailTokenObtainPairSerializer,
    TokenRefreshSerializer,
    UnifiedLoginSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class UnifiedLoginView(APIView):
    """
    Unified login endpoint that accepts identifier (email OR username) and password.

    POST /api/auth/login
    Request: { "identifier": "user@example.com or username", "password": "..." }
    Response: {
        "user": { "id", "username", "email", "full_name", "role", "is_active" },
        "tokens": { "access": "...", "refresh": "..." }
    }
    """

    permission_classes = [AllowAny]
    authentication_classes: list[BaseAuthentication] = []

    def post(self, request):
        """Handle login request."""
        serializer = UnifiedLoginSerializer(data=request.data)

        if not serializer.is_valid():
            # Extract error from validation errors
            errors = serializer.errors
            # Handle the error wrapper from our custom validation errors
            if "error" in errors:
                error_data = errors["error"]
                # If it's a list (from ValidationError), take the first one
                if isinstance(error_data, list) and len(error_data) > 0:
                    return Response(
                        {"error": error_data[0]}, status=status.HTTP_401_UNAUTHORIZED
                    )
                return Response(
                    {"error": error_data}, status=status.HTTP_401_UNAUTHORIZED
                )
            # Handle field-level errors
            if "non_field_errors" in errors:
                error_detail = errors["non_field_errors"][0]
                if isinstance(error_detail, dict) and "error" in error_detail:
                    return Response(error_detail, status=status.HTTP_401_UNAUTHORIZED)
            # Default error response
            return Response(
                {
                    "error": {
                        "code": AUTH_ERROR_CODES["invalid_credentials"],
                        "message": "Invalid request data.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.validated_data["user"]
        tokens = serializer.validated_data["tokens"]

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    Logout endpoint that invalidates the refresh token.

    POST /api/auth/logout
    Request: { "refresh": "JWT_REFRESH_TOKEN" } (optional)
    Response: { "success": true }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Handle logout request."""
        refresh_token = request.data.get("refresh")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # Token might already be blacklisted or invalid
                pass

        return Response({"success": True}, status=status.HTTP_200_OK)


class TokenRefreshView(APIView):
    """
    Token refresh endpoint.

    POST /api/auth/refresh
    Request: { "refresh": "JWT_REFRESH_TOKEN" }
    Response: { "access": "NEW_ACCESS_TOKEN", "refresh": "NEW_REFRESH_TOKEN" (if rotation) }
    """

    permission_classes = [AllowAny]
    authentication_classes: list[BaseAuthentication] = []

    def post(self, request):
        """Handle token refresh request."""
        serializer = TokenRefreshSerializer(data=request.data)

        if not serializer.is_valid():
            errors = serializer.errors
            # Handle error wrapper from validation errors
            if "error" in errors:
                error_data = errors["error"]
                if isinstance(error_data, list) and len(error_data) > 0:
                    return Response(
                        {"error": error_data[0]}, status=status.HTTP_401_UNAUTHORIZED
                    )
                return Response(
                    {"error": error_data}, status=status.HTTP_401_UNAUTHORIZED
                )
            if "non_field_errors" in errors:
                error_detail = errors["non_field_errors"][0]
                if isinstance(error_detail, dict) and "error" in error_detail:
                    return Response(error_detail, status=status.HTTP_401_UNAUTHORIZED)
            return Response(
                {
                    "error": {
                        "code": AUTH_ERROR_CODES["token_invalid"],
                        "message": "Invalid refresh token.",
                    }
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    Get current user information.

    GET /api/auth/me
    Response: { "id", "username", "email", "full_name", "role", "is_active" }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return current user information."""
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


# Legacy view for backward compatibility (deprecated)
class EmailTokenObtainPairView(TokenObtainPairView):
    """
    DEPRECATED: Use UnifiedLoginView at /api/auth/login instead.

    A custom token obtain pair view that authenticates with email and password.
    Kept for backward compatibility during transition period.
    """

    serializer_class = EmailTokenObtainPairSerializer  # type: ignore[assignment]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Retrieve dashboard statistics tailored to the authenticated user's role.

    This view calculates and returns a set of statistics relevant to the user's
    primary role (e.g., Admin, Registrar, Faculty, Student). The type of
    statistics returned depends on the user's group membership.

    Args:
        request (Request): The DRF request object, containing the user.

    Returns:
        Response: A DRF response object containing a dictionary of
                  dashboard statistics.
    """
    user = request.user

    stats = {}

    # Common stats
    if user.is_superuser or in_group(user, "Admin") or in_group(user, "Registrar"):
        # Admin/Registrar sees all statistics
        stats = {
            "total_students": Student.objects.filter(status="active").count(),
            "total_courses": Course.objects.count(),
            "active_sections": Section.objects.count(),
            "pending_requests": Request.objects.filter(status="pending").count(),
            "published_results": Result.objects.filter(state="published").count(),
            "ineligible_students": _count_ineligible_students(),
        }
    elif in_group(user, "Faculty"):
        # Faculty sees only their own sections and students
        faculty_sections = Section.objects.filter(teacher=user)
        enrolled_students = (
            Enrollment.objects.filter(section__in=faculty_sections)
            .values_list("student", flat=True)
            .distinct()
        )

        stats = {
            "my_sections": faculty_sections.count(),
            "my_students": enrolled_students.count(),
            "pending_attendance": _count_pending_attendance(faculty_sections),
            "draft_results": Result.objects.filter(
                section__in=faculty_sections, state="draft"
            ).count(),
        }
    elif in_group(user, "Student"):
        # Student sees their own stats
        # Try to find student by name (temporary solution)
        # TODO: Add proper User to Student relationship via ForeignKey
        try:
            student = Student.objects.get(name=f"{user.first_name} {user.last_name}")
            my_enrollments = Enrollment.objects.filter(student=student)

            stats = {
                "enrolled_courses": my_enrollments.count(),
                "attendance_rate": _calculate_attendance_rate(student),
                "completed_results": Result.objects.filter(
                    student=student, state="published"
                ).count(),
                "pending_requests": Request.objects.filter(
                    student=student, status="pending"
                ).count(),
            }
        except Student.DoesNotExist:
            logger.warning(f"No student record found for user {user.username}")
            stats = {"error": "No student record found for this user"}
    else:
        stats = {"message": "No statistics available for your role"}

    return Response(stats, status=status.HTTP_200_OK)


def _count_ineligible_students():
    """
    Calculates the number of active students with an attendance rate below 75%.

    This function queries the database to find all active students, calculates
    their attendance rate (present sessions / total sessions), and returns the
    count of students whose attendance rate is less than 75%.

    Returns:
        int: The number of students considered ineligible based on attendance.
    """
    active_students = (
        Student.objects.filter(status="active")
        .annotate(
            total_attendance=Count("attendance"),
            present_attendance=Count(
                "attendance",
                filter=Q(attendance__present=True),
            ),
        )
        .filter(total_attendance__gt=0)
        .annotate(
            attendance_rate=ExpressionWrapper(
                (F("present_attendance") * 100.0) / F("total_attendance"),
                output_field=FloatField(),
            ),
        )
    )

    return active_students.filter(attendance_rate__lt=75).count()


def _count_pending_attendance(sections):
    """
    Counts the number of sections that have not had attendance marked recently.

    This function uses a simple heuristic: it counts the number of sections
    provided in the `sections` queryset that have not had any attendance
    records in the last 7 days.

    Args:
        sections (QuerySet): A queryset of `Section` objects to check for
                             pending attendance.

    Returns:
        int: The number of sections with no recent attendance records.
    """
    from datetime import date, timedelta

    # Count sections with no attendance in last 7 days
    last_week = date.today() - timedelta(days=7)
    if not hasattr(sections, "annotate"):
        section_ids = [section.pk for section in sections]
        sections = Section.objects.filter(pk__in=section_ids)
    return (
        sections.annotate(
            recent_attendance=Count(
                "attendance",
                filter=Q(attendance__date__gte=last_week),
            )
        )
        .filter(recent_attendance=0)
        .count()
    )


def _calculate_attendance_rate(student):
    """
    Calculates the attendance rate for a given student.

    The attendance rate is calculated as the percentage of 'present' attendance
    records out of the total number of attendance records for the student.

    Args:
        student (Student): The student object for whom to calculate the
                           attendance rate.

    Returns:
        float: The attendance rate as a percentage, rounded to two decimal
               places. Returns 0.0 if the student has no attendance records.
    """
    total = Attendance.objects.filter(student=student).count()
    if total == 0:
        return 0.0

    present = Attendance.objects.filter(student=student, present=True).count()
    return round((present / total) * 100, 2)
