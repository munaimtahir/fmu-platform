from datetime import date

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsAdminOrRegistrarReadOnlyFacultyStudent

from .models import Attendance
from .serializers import AttendanceSerializer
from .utils import (
    calculate_attendance_percentage,
    check_eligibility,
    get_section_attendance_summary,
)


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsAdminOrRegistrarReadOnlyFacultyStudent]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["section__course__code", "student__reg_no", "date"]
    ordering_fields = ["id", "date"]
    ordering = ["id"]

    def update(self, request, *args, **kwargs):
        """Update attendance record with same-day edit restriction."""
        instance = self.get_object()
        today = date.today()

        # Restrict edits to records not from today (can only edit same-day records)
        if instance.date != today:
            return Response(
                {
                    "error": "Cannot edit attendance records from past dates. "
                    "Only same-day attendance can be modified."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Partial update attendance record with same-day edit restriction."""
        instance = self.get_object()
        today = date.today()

        # Restrict edits to records not from today (can only edit same-day records)
        if instance.date != today:
            return Response(
                {
                    "error": "Cannot edit attendance records from past dates. "
                    "Only same-day attendance can be modified."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=["get"], url_path="percentage")
    def attendance_percentage(self, request):
        """Get attendance percentage for a student in a section."""
        student_id = request.query_params.get("student_id")
        section_id = request.query_params.get("section_id")

        if not student_id or not section_id:
            return Response(
                {"error": "student_id and section_id are required"},
                status=400,
            )

        try:
            percentage = calculate_attendance_percentage(
                int(student_id), int(section_id)
            )
            return Response({"percentage": percentage})
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=False, methods=["get"], url_path="eligibility")
    def check_eligibility_endpoint(self, request):
        """Check if a student is eligible based on attendance."""
        student_id = request.query_params.get("student_id")
        section_id = request.query_params.get("section_id")
        threshold = request.query_params.get("threshold", "75.0")

        if not student_id or not section_id:
            return Response(
                {"error": "student_id and section_id are required"},
                status=400,
            )

        try:
            result = check_eligibility(
                int(student_id), int(section_id), float(threshold)
            )
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=False, methods=["get"], url_path="section-summary")
    def section_summary(self, request):
        """Get attendance summary for a section."""
        section_id = request.query_params.get("section_id")

        if not section_id:
            return Response(
                {"error": "section_id is required"},
                status=400,
            )

        try:
            summary = get_section_attendance_summary(int(section_id))
            return Response(summary)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
