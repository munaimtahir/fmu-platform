from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsAdminOrCoordinator

from .models import (
    AcademicPeriod,
    Batch,
    Department,
    Group,
    LearningBlock,
    Module,
    Period,
    Program,
    Track,
)
from .serializers import (
    AcademicPeriodSerializer,
    BatchSerializer,
    DepartmentSerializer,
    GroupSerializer,
    LearningBlockSerializer,
    ModuleSerializer,
    PeriodSerializer,
    ProgramSerializer,
    TrackSerializer,
)
from .services import (
    LearningBlockService,
    ProgramService,
)


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'structure_type', 'is_finalized']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'finalize', 'generate_periods']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'], url_path='finalize')
    def finalize(self, request, pk=None):
        """Finalize a program, locking structure fields"""
        program = self.get_object()
        try:
            program = ProgramService.finalize_program(program)
            serializer = self.get_serializer(program)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': str(e), 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='generate-periods')
    def generate_periods(self, request, pk=None):
        """Generate periods for a finalized program"""
        program = self.get_object()
        try:
            periods = ProgramService.generate_periods(program)
            serializer = PeriodSerializer(periods, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': str(e), 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )


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
    queryset = Department.objects.select_related('parent').all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['parent']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]


# New Academics Module ViewSets

class PeriodViewSet(viewsets.ModelViewSet):
    queryset = Period.objects.select_related('program').all()
    serializer_class = PeriodSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program']
    search_fields = ['name', 'program__name']
    ordering_fields = ['order', 'start_date', 'name']
    ordering = ['program', 'order']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]


class TrackViewSet(viewsets.ModelViewSet):
    queryset = Track.objects.select_related('program').all()
    serializer_class = TrackSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program']
    search_fields = ['name', 'program__name', 'description']
    ordering_fields = ['name']
    ordering = ['program', 'name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]


class LearningBlockViewSet(viewsets.ModelViewSet):
    queryset = LearningBlock.objects.select_related(
        'period', 'track', 'primary_department', 'sub_department'
    ).prefetch_related('modules').all()
    serializer_class = LearningBlockSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['period', 'track', 'block_type', 'primary_department']
    search_fields = ['name', 'period__name', 'track__name']
    ordering_fields = ['start_date', 'end_date', 'name']
    ordering = ['period', 'track', 'start_date']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Create block with service layer validation"""
        try:
            serializer.save()
        except ValidationError as e:
            from rest_framework.exceptions import ValidationError as DRFValidationError
            raise DRFValidationError(str(e))

    def perform_update(self, serializer):
        """Update block with service layer validation"""
        try:
            serializer.save()
        except ValidationError as e:
            from rest_framework.exceptions import ValidationError as DRFValidationError
            raise DRFValidationError(str(e))


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.select_related('block').all()
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['block']
    search_fields = ['name', 'block__name']
    ordering_fields = ['order', 'name']
    ordering = ['block', 'order']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Create module with validation that block is INTEGRATED_BLOCK"""
        block = serializer.validated_data['block']
        if block.block_type != LearningBlock.BLOCK_TYPE_INTEGRATED:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                "Modules can only be added to INTEGRATED_BLOCK blocks"
            )
        serializer.save()

    def perform_update(self, serializer):
        """Update module with validation that block is INTEGRATED_BLOCK"""
        block = serializer.validated_data.get('block', serializer.instance.block)
        if block.block_type != LearningBlock.BLOCK_TYPE_INTEGRATED:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                "Modules can only be added to INTEGRATED_BLOCK blocks"
            )
        serializer.save()
