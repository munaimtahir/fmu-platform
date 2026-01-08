from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired, has_permission_task

from sims_backend.students.models import LeavePeriod, Student
from sims_backend.students.serializers import (
    LeavePeriodSerializer,
    StudentPlacementSerializer,
    StudentSerializer,
)


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related(
        'program', 'batch', 'group', 'person', 'user'
    ).prefetch_related('leave_periods').all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program', 'batch', 'group', 'status', 'reg_no']
    search_fields = ['reg_no', 'name', 'email', 'phone']
    ordering_fields = ['reg_no', 'name', 'created_at', 'enrollment_year']
    ordering = ['reg_no']
    required_tasks = ['students.students.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'me']:
            self.required_tasks = ['students.students.view']
        elif self.action == 'create':
            self.required_tasks = ['students.students.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['students.students.update']
        elif self.action == 'destroy':
            self.required_tasks = ['students.students.delete']
        elif self.action == 'placement':
            self.required_tasks = ['students.students.manage_placement']
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Students can view their own record."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, 'students.students.view'):
            return qs

        # Otherwise, return only own student record
        if hasattr(user, 'student'):
            return qs.filter(id=user.student.id)
        return qs.none()

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Get current student's profile."""
        try:
            student = request.user.student
            serializer = self.get_serializer(student)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except AttributeError:
            return Response(
                {'error': 'No student record linked to your account'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['patch'], url_path='placement')
    def placement(self, request, pk=None):
        """Update student placement (Program/Batch/Group) - Requires manage_placement permission"""
        student = self.get_object()
        serializer = StudentPlacementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student.program = serializer.validated_data['program']
        student.batch = serializer.validated_data['batch']
        student.group = serializer.validated_data['group']
        student.save()

        return Response(StudentSerializer(student).data, status=status.HTTP_200_OK)


class LeavePeriodViewSet(viewsets.ModelViewSet):
    queryset = LeavePeriod.objects.select_related('student', 'approved_by').all()
    serializer_class = LeavePeriodSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'type', 'status', 'start_date', 'end_date']
    search_fields = ['reason']
    ordering_fields = ['start_date', 'end_date']
    ordering = ['-start_date']
    required_tasks = ['students.leave_periods.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['students.leave_periods.view']
        elif self.action == 'create':
            self.required_tasks = ['students.leave_periods.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['students.leave_periods.update']
        elif self.action == 'destroy':
            self.required_tasks = ['students.leave_periods.delete']
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Students can view their own leave periods."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, 'students.leave_periods.view'):
            return qs

        # Otherwise, return only own leave periods
        if hasattr(user, 'student'):
            return qs.filter(student=user.student)
        return qs.none()

