from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sims_backend.common_permissions import IsAdminOrCoordinator, IsStudent, in_group
from sims_backend.results.models import ResultHeader, ResultComponentEntry
from sims_backend.results.serializers import ResultHeaderSerializer, ResultComponentEntrySerializer
from sims_backend.exams.services import compute_result_passing_status
from sims_backend.common.workflow import validate_workflow_transition


class ResultHeaderViewSet(viewsets.ModelViewSet):
    queryset = ResultHeader.objects.select_related(
        'exam', 'student'
    ).prefetch_related('component_entries__exam_component').all()
    serializer_class = ResultHeaderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['exam', 'student', 'status', 'final_outcome']
    search_fields = ['student__reg_no', 'student__name', 'exam__title']
    ordering_fields = ['exam', 'student', 'total_obtained']
    ordering = ['exam', 'student']

    def get_permissions(self):
        if self.action in ['verify', 'publish']:
            return [IsAuthenticated(), IsAdminOrCoordinator()]  # Only Admin/Coordinator
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Students can only see published results
        if in_group(user, 'STUDENT') and not (in_group(user, 'ADMIN') or in_group(user, 'COORDINATOR')):
            queryset = queryset.filter(status='PUBLISHED')
            # TODO: Filter to own student record
        
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        # Compute passing status after creation
        compute_result_passing_status(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        # Compute passing status after update
        compute_result_passing_status(instance)

    @action(detail=False, methods=['get'], url_path='exams/(?P<exam_id>[^/.]+)')
    def list_by_exam(self, request, exam_id=None):
        """List results for a specific exam"""
        results = self.get_queryset().filter(exam_id=exam_id)
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='verify')
    def verify(self, request, pk=None):
        """Verify result - Admin/Coordinator only"""
        result = self.get_object()
        validate_workflow_transition(request.user, result, result.status, 'VERIFIED')
        result.status = 'VERIFIED'
        result.save()
        return Response(ResultHeaderSerializer(result).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """Publish result - Admin/Coordinator only"""
        result = self.get_object()
        validate_workflow_transition(request.user, result, result.status, 'PUBLISHED')
        result.status = 'PUBLISHED'
        result.save()
        return Response(ResultHeaderSerializer(result).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Student's own results (published only)"""
        # TODO: Filter to student's own records
        queryset = self.get_queryset().filter(status='PUBLISHED')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ResultComponentEntryViewSet(viewsets.ModelViewSet):
    queryset = ResultComponentEntry.objects.select_related('result_header', 'exam_component').all()
    serializer_class = ResultComponentEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['result_header', 'exam_component']
    ordering_fields = ['exam_component__sequence']
    ordering = ['result_header', 'exam_component__sequence']

    def perform_update(self, serializer):
        instance = serializer.save()
        # Recompute passing status for the result header
        compute_result_passing_status(instance.result_header)
