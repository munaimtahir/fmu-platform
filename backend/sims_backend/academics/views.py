from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from sims_backend.common_permissions import IsAdminOrCoordinator

from .models import AcademicPeriod, Batch, Department, Group, Program
from .serializers import (
    AcademicPeriodSerializer,
    BatchSerializer,
    DepartmentSerializer,
    GroupSerializer,
    ProgramSerializer,
)


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.select_related('program').all()
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program']
    search_fields = ['name', 'program__name']
    ordering_fields = ['name', 'start_year']
    ordering = ['program', 'start_year']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]


class AcademicPeriodViewSet(viewsets.ModelViewSet):
    queryset = AcademicPeriod.objects.select_related('parent_period').all()
    serializer_class = AcademicPeriodSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['period_type', 'parent_period']
    search_fields = ['name']
    ordering_fields = ['period_type', 'name', 'start_date']
    ordering = ['period_type', 'name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.select_related('batch', 'batch__program').all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['batch']
    search_fields = ['name', 'batch__name']
    ordering_fields = ['name']
    ordering = ['batch', 'name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = []
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]
