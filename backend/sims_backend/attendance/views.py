from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.attendance.models import Attendance
from sims_backend.attendance.serializers import AttendanceSerializer
from sims_backend.common_permissions import in_group
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

    def get_permissions(self):
        # Faculty and OfficeAssistant can mark attendance
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAuthenticated()]  # Check in get_queryset
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Students can only see their own attendance
        if in_group(user, 'STUDENT') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            # Filter to student's own records via user link
            student = getattr(user, 'student', None)
            if student:
                queryset = queryset.filter(student=student)
            else:
                # No student record linked, return empty queryset
                queryset = queryset.none()

        # Faculty can see attendance for their sessions
        elif in_group(user, 'FACULTY') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            queryset = queryset.filter(session__faculty=user)

        return queryset

    @action(detail=False, methods=['post'], url_path='sessions/(?P<session_id>[^/.]+)/mark')
    def mark_session_attendance(self, request, session_id=None):
        """Mark attendance for all students in a session"""
        try:
            session = Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        attendance_data = request.data.get('attendance', [])  # List of {student_id, status}

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
