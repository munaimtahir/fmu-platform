import csv

from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired, has_permission_task

from sims_backend.attendance.models import Attendance
from sims_backend.attendance.serializers import AttendanceSerializer
from sims_backend.attendance.utils import check_eligibility
from sims_backend.timetable.models import Session


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related(
        'session', 'student', 'marked_by', 'session__department'
    ).all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['session', 'student', 'status']
    search_fields = ['student__reg_no', 'student__name']
    ordering_fields = ['marked_at']
    ordering = ['-marked_at']

    def has_permission(self, request, view):
        """Custom permission logic for attendance views."""
        user = request.user

        if not user or not user.is_authenticated:
            return False

        # Allow all authenticated users - object-level permissions will filter appropriately
        return True

    def has_object_permission(self, request, view, obj):
        """Object-level permissions for attendance records."""
        user = request.user

        # Students can only see their own attendance
        if hasattr(user, 'student'):
            return obj.student == user.student

        # Faculty can see attendance for their sessions
        return obj.session.faculty == user

    def get_queryset(self):
        """Object-level permission: Students see own, Faculty see own sections."""
        queryset = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, 'attendance.attendances.view'):
            return queryset

        # Students can only see their own attendance
        if hasattr(user, 'student') and user.student:
            return queryset.filter(student=user.student)

        # Faculty can see attendance for their sessions
        return queryset.filter(session__faculty=user)

    @action(detail=False, methods=['post'], url_path='sessions/(?P<session_id>[^/.]+)/mark')
    def mark_session_attendance(self, request, session_id=None):
        """Mark attendance for all students in a session."""
        try:
            session = Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'Session not found'}},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate date (same-day edit rules enforced in service layer)
        from sims_backend.attendance.services.input_methods import (
            _validate_date, _require_session_access
        )
        from datetime import date

        try:
            _require_session_access(request.user, session)
            target_date = request.data.get('date')
            if target_date:
                _validate_date(session, date.fromisoformat(target_date), request.user)
        except (PermissionError, ValueError) as e:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': str(e)}},
                status=status.HTTP_400_BAD_REQUEST
            )

        attendance_data = request.data.get('attendance', [])

        created_count = 0
        updated_count = 0

        for item in attendance_data:
            student_id = item.get('student_id')
            status_value = item.get('status')

            if not student_id or not status_value:
                continue

            attendance, created = Attendance.objects.update_or_create(
                session=session,
                student_id=student_id,
                defaults={
                    'status': status_value,
                    'marked_by': request.user,
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response({
            'created': created_count,
            'updated': updated_count,
            'total': len(attendance_data)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """Get attendance summary for a student or session."""
        student_id = request.query_params.get('student')
        session_id = request.query_params.get('session')

        queryset = self.get_queryset()

        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if session_id:
            queryset = queryset.filter(session_id=session_id)

        total = queryset.count()
        present = queryset.filter(status=Attendance.STATUS_PRESENT).count()
        absent = queryset.filter(status=Attendance.STATUS_ABSENT).count()
        late = queryset.filter(status=Attendance.STATUS_LATE).count()
        leave = queryset.filter(status=Attendance.STATUS_LEAVE).count()

        percentage = (present / total * 100) if total > 0 else 0

        return Response({
            'total': total,
            'present': present,
            'absent': absent,
            'late': late,
            'leave': leave,
            'percentage': round(percentage, 2)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='eligibility')
    def eligibility(self, request):
        """Check eligibility for a student in a section."""
        student_id = request.query_params.get('student_id')
        section_id = request.query_params.get('section_id')
        threshold = float(request.query_params.get('threshold', 75.0))

        if not student_id or not section_id:
            return Response(
                {'error': {'code': 'MISSING_PARAMS', 'message': 'student_id and section_id are required'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = check_eligibility(
                student_id=int(student_id),
                section_id=int(section_id),
                threshold=threshold
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': {'code': 'ERROR', 'message': str(e)}},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        """Export attendance records as CSV."""
        # Apply filters
        queryset = self.filter_queryset(self.get_queryset())

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="attendance_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Student Reg No', 'Student Name', 'Session', 'Status',
            'Marked By', 'Marked At', 'Created At'
        ])

        for attendance in queryset[:10000]:  # Limit to 10k records
            writer.writerow([
                attendance.id,
                attendance.student.reg_no,
                attendance.student.name,
                str(attendance.session),
                attendance.status,
                attendance.marked_by.username if attendance.marked_by else '',
                attendance.marked_at.isoformat() if attendance.marked_at else '',
                attendance.created_at.isoformat(),
            ])

        return response
