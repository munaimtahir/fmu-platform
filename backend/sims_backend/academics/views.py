from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired

from .models import (
    AcademicPeriod,
    Batch,
    Course,
    Department,
    Group,
    LearningBlock,
    Module,
    Period,
    Program,
    Section,
    Track,
)
from .serializers import (
    AcademicPeriodSerializer,
    BatchSerializer,
    CourseSerializer,
    DepartmentSerializer,
    GroupSerializer,
    LearningBlockSerializer,
    ModuleSerializer,
    PeriodSerializer,
    ProgramSerializer,
    SectionSerializer,
    TrackSerializer,
)
from .services import (
    LearningBlockService,
    ProgramService,
)


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'structure_type', 'is_finalized']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    required_tasks = ['academics.programs.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['academics.programs.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.programs.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.programs.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.programs.delete']
        elif self.action in ['finalize', 'generate_periods']:
            self.required_tasks = ['academics.programs.manage']
        return super().get_permissions()

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
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program', 'is_active']
    search_fields = ['name', 'program__name']
    ordering_fields = ['name', 'start_year']
    ordering = ['program', 'start_year']
    required_tasks = ['academics.batches.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['academics.batches.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.batches.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.batches.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.batches.delete']
        return super().get_permissions()


class AcademicPeriodViewSet(viewsets.ModelViewSet):
    queryset = AcademicPeriod.objects.select_related('parent_period').all()
    serializer_class = AcademicPeriodSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['period_type', 'parent_period', 'status', 'is_enrollment_open']
    search_fields = ['name']
    ordering_fields = ['period_type', 'name', 'start_date']
    ordering = ['period_type', 'name']
    required_tasks = ['academics.terms.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['academics.terms.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.terms.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.terms.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.terms.delete']
        elif self.action in ['open_period', 'close_period']:
            self.required_tasks = ['academics.terms.manage']
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='open')
    def open_period(self, request, pk=None):
        """Open an academic period for enrollment and academic writes."""
        period = self.get_object()
        if period.status == AcademicPeriod.STATUS_OPEN:
            return Response(
                {'error': {'code': 'ALREADY_OPEN', 'message': 'Period is already open'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        period.status = AcademicPeriod.STATUS_OPEN
        period.is_enrollment_open = True
        period.save()
        serializer = self.get_serializer(period)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='close')
    def close_period(self, request, pk=None):
        """Close an academic period, blocking enrollment and academic writes."""
        period = self.get_object()
        if period.status == AcademicPeriod.STATUS_CLOSED:
            return Response(
                {'error': {'code': 'ALREADY_CLOSED', 'message': 'Period is already closed'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        period.status = AcademicPeriod.STATUS_CLOSED
        period.is_enrollment_open = False
        period.save()
        serializer = self.get_serializer(period)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.select_related('batch', 'batch__program').all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['batch']
    search_fields = ['name', 'batch__name']
    ordering_fields = ['name']
    ordering = ['batch', 'name']
    required_tasks = ['academics.groups.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['academics.groups.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.groups.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.groups.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.groups.delete']
        return super().get_permissions()


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related('parent').all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['parent']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']
    ordering = ['name']
    required_tasks = ['academics.departments.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['academics.departments.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.departments.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.departments.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.departments.delete']
        return super().get_permissions()


# New Academics Module ViewSets

class PeriodViewSet(viewsets.ModelViewSet):
    queryset = Period.objects.select_related('program').all()
    serializer_class = PeriodSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program']
    search_fields = ['name', 'program__name']
    ordering_fields = ['order', 'start_date', 'name']
    ordering = ['program', 'order']
    required_tasks = ['academics.periods.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'students']:
            self.required_tasks = ['academics.periods.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.periods.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.periods.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.periods.delete']
        return super().get_permissions()

    @action(detail=True, methods=['get'], url_path='students')
    def students(self, request, pk=None):
        """Get students for this period (batches that correspond to this period)"""
        from django.utils import timezone
        from sims_backend.students.models import Student
        from sims_backend.students.serializers import StudentSerializer
        
        period = self.get_object()
        
        # Get all batches for this program
        batches = Batch.objects.filter(program=period.program)
        
        # Determine which batches correspond to this period
        matching_batch_ids = []
        matching_batch_names = []
        current_year = timezone.now().year
        current_month = timezone.now().month
        
        for batch in batches:
            years_since_start = current_year - batch.start_year
            
            if period.program.structure_type == 'YEARLY':
                batch_current_period_order = years_since_start + 1
            elif period.program.structure_type == 'SEMESTER':
                semester_in_current_year = 1 if current_month <= 6 else 2
                batch_current_period_order = (years_since_start * 2) + semester_in_current_year
            else:  # CUSTOM
                batch_current_period_order = years_since_start + 1
            
            if batch_current_period_order == period.order:
                matching_batch_ids.append(batch.id)
                matching_batch_names.append(batch.name)
        
        # Get active students in matching batches, grouped by batch and group
        students = Student.objects.filter(
            batch_id__in=matching_batch_ids,
            status='active'
        ).select_related('batch', 'group', 'program').order_by('batch__name', 'group__name', 'name')
        
        serializer = StudentSerializer(students, many=True)
        return Response({
            'period_id': period.id,
            'period_name': period.name,
            'students': serializer.data,
            'count': students.count(),
            'batches': matching_batch_names
        }, status=status.HTTP_200_OK)


class TrackViewSet(viewsets.ModelViewSet):
    queryset = Track.objects.select_related('program').all()
    serializer_class = TrackSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program']
    search_fields = ['name', 'program__name', 'description']
    ordering_fields = ['name']
    ordering = ['program', 'name']
    required_tasks = ['academics.tracks.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['academics.tracks.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.tracks.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.tracks.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.tracks.delete']
        return super().get_permissions()


class LearningBlockViewSet(viewsets.ModelViewSet):
    queryset = LearningBlock.objects.select_related(
        'period', 'track', 'primary_department', 'sub_department'
    ).prefetch_related('modules').all()
    serializer_class = LearningBlockSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['period', 'track', 'block_type', 'primary_department']
    search_fields = ['name', 'period__name', 'track__name']
    ordering_fields = ['start_date', 'end_date', 'name']
    ordering = ['period', 'track', 'start_date']
    required_tasks = ['academics.blocks.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['academics.blocks.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.blocks.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.blocks.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.blocks.delete']
        return super().get_permissions()

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
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['block']
    search_fields = ['name', 'block__name']
    ordering_fields = ['order', 'name']
    ordering = ['block', 'order']
    required_tasks = ['academics.modules.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['academics.modules.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.modules.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.modules.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.modules.delete']
        return super().get_permissions()

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


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related('department', 'academic_period').all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'academic_period', 'program']
    search_fields = ['code', 'name']
    ordering_fields = ['code', 'name']
    ordering = ['code']
    required_tasks = ['academics.courses.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['academics.courses.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.courses.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.courses.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.courses.delete']
        return super().get_permissions()


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.select_related(
        'course', 'academic_period', 'faculty', 'group'
    ).all()
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['course', 'academic_period', 'faculty', 'group']
    search_fields = ['name', 'course__code', 'course__name']
    ordering_fields = ['name', 'capacity']
    ordering = ['course', 'name']
    required_tasks = ['academics.sections.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['academics.sections.view']
        elif self.action == 'create':
            self.required_tasks = ['academics.sections.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['academics.sections.update']
        elif self.action == 'destroy':
            self.required_tasks = ['academics.sections.delete']
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Faculty can view their own sections."""
        from core.permissions import has_permission_task
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, 'academics.sections.view'):
            return qs

        # Otherwise, return only sections where user is faculty
        return qs.filter(faculty=user)
