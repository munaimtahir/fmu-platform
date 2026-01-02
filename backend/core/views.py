"""Custom views for authentication and dashboard."""

import logging

from django.db.models import Sum
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from sims_backend.academics.models import Batch, Group, Program
from sims_backend.attendance.models import Attendance
from sims_backend.common_permissions import in_group
from sims_backend.exams.models import Exam
from sims_backend.finance.models import LedgerEntry, Payment, Voucher
from sims_backend.results.models import ResultHeader
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session

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

    # MVP stats based on new models
    if user.is_superuser or in_group(user, "ADMIN") or in_group(user, "COORDINATOR"):
        # Admin/Coordinator sees all statistics
        debit_total = (
            LedgerEntry.objects.filter(entry_type=LedgerEntry.ENTRY_DEBIT, voided_at__isnull=True).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )
        credit_total = (
            LedgerEntry.objects.filter(entry_type=LedgerEntry.ENTRY_CREDIT, voided_at__isnull=True).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )
        stats = {
            "total_students": Student.objects.filter(status="active").count(),
            "total_programs": Program.objects.filter(is_active=True).count(),
            "total_batches": Batch.objects.count(),
            "total_groups": Group.objects.count(),
            "total_sessions": Session.objects.count(),
            "total_exams": Exam.objects.count(),
            "published_results": ResultHeader.objects.filter(status="PUBLISHED").count(),
            "draft_results": ResultHeader.objects.filter(status="DRAFT").count(),
            "total_vouchers": Voucher.objects.count(),
            "verified_payments": Payment.objects.filter(status="verified").count(),
            "finance_outstanding": float(debit_total - credit_total),
        }
    elif in_group(user, "FACULTY"):
        # Faculty sees only their own sessions and students
        faculty_sessions = Session.objects.filter(faculty=user)
        session_ids = faculty_sessions.values_list('id', flat=True)

        # Count unique students from faculty's sessions via attendance
        student_ids = Attendance.objects.filter(session_id__in=session_ids).values_list('student_id', flat=True).distinct()

        stats = {
            "my_sessions": faculty_sessions.count(),
            "my_students": student_ids.count() if student_ids else 0,
            "draft_results": ResultHeader.objects.filter(
                exam__academic_period__sessions__faculty=user,
                status="DRAFT"
            ).distinct().count(),
        }
    elif in_group(user, "FINANCE"):
        # Finance sees finance-related statistics
        debit_total = (
            LedgerEntry.objects.filter(entry_type=LedgerEntry.ENTRY_DEBIT, voided_at__isnull=True).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )
        credit_total = (
            LedgerEntry.objects.filter(entry_type=LedgerEntry.ENTRY_CREDIT, voided_at__isnull=True).aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )
        stats = {
            "total_vouchers": Voucher.objects.count(),
            "payments_recorded": Payment.objects.count(),
            "finance_outstanding": float(debit_total - credit_total),
            "paid_vouchers": Voucher.objects.filter(status="paid").count(),
            "overdue_vouchers": Voucher.objects.filter(status="overdue").count(),
        }
    elif in_group(user, "STUDENT"):
        # Student sees their own stats
        # TODO: Link User to Student (for MVP, return basic stats)
        stats = {
            "message": "Student dashboard - link User to Student for detailed stats",
            "note": "User-Student linking not yet implemented in MVP",
        }
    elif in_group(user, "OFFICE_ASSISTANT"):
        # Office Assistant sees data-entry relevant stats
        stats = {
            "total_sessions": Session.objects.count(),
            "draft_results": ResultHeader.objects.filter(status="DRAFT").count(),
            "total_exams": Exam.objects.filter(published=False).count(),
        }
    else:
        stats = {"message": "No statistics available for your role"}

    return Response(stats, status=status.HTTP_200_OK)


# Note: Eligibility computation explicitly excluded from MVP scope
# Helper functions removed - can be re-implemented later if needed
