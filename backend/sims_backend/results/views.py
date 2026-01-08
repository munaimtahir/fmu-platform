from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired, has_permission_task

from sims_backend.common.workflow import validate_workflow_transition
from sims_backend.exams.services import compute_result_passing_status
from sims_backend.finance.services import finance_gate_checks
from sims_backend.results.models import ResultComponentEntry, ResultHeader, ResultError
from sims_backend.results.serializers import ResultComponentEntrySerializer, ResultHeaderSerializer


class ResultHeaderViewSet(viewsets.ModelViewSet):
    queryset = ResultHeader.objects.select_related(
        'exam', 'student'
    ).prefetch_related('component_entries__exam_component').all()
    serializer_class = ResultHeaderSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['exam', 'student', 'status', 'final_outcome']
    search_fields = ['student__reg_no', 'student__name', 'exam__title']
    ordering_fields = ['exam', 'student', 'total_obtained']
    ordering = ['exam', 'student']
    required_tasks = ['results.result_headers.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['results.result_headers.view']
        elif self.action == 'create':
            self.required_tasks = ['results.result_headers.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['results.result_headers.update']
        elif self.action == 'destroy':
            self.required_tasks = ['results.result_headers.delete']
        elif self.action == 'verify':
            self.required_tasks = ['results.result_headers.verify']
        elif self.action == 'publish':
            self.required_tasks = ['results.result_headers.publish']
        elif self.action == 'freeze':
            self.required_tasks = ['results.result_headers.freeze']
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Students can view own published results."""
        queryset = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, 'results.result_headers.view'):
            return queryset

        # Students can only see published results for their own records
        queryset = queryset.filter(status=ResultHeader.STATUS_PUBLISHED)
        student = getattr(user, 'student', None)
        if student:
            # Check finance gate
            gate = finance_gate_checks(student, None)
            gating = gate.get("gating", {})
            if gating and not gating.get("can_view_results", True):
                raise PermissionDenied(
                    detail={
                        "code": "FINANCE_BLOCKED",
                        "message": "Results are blocked until outstanding dues are cleared.",
                        "reasons": gating.get("reasons", []),
                        "outstanding": gate.get("outstanding"),
                    }
                )
            queryset = queryset.filter(student=student)
        else:
            # No student record linked, return empty queryset
            queryset = queryset.none()

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        # Compute passing status after creation
        compute_result_passing_status(instance)

    def perform_update(self, serializer):
        """Enforce immutability: Only DRAFT results can be edited."""
        instance = serializer.instance
        if instance and not instance.is_editable:
            raise PermissionDenied(
                detail={
                    "code": "IMMUTABLE_RESULT",
                    "message": f"Cannot edit result with status {instance.status}. Use Requests workflow for corrections.",
                }
            )
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
        """Verify result (DRAFT → VERIFIED)"""
        result = self.get_object()
        if not result.is_publishable:
            return Response(
                {"error": {"code": "NOT_VERIFIABLE", "message": f"Cannot verify result with status {result.status}"}},
                status=status.HTTP_400_BAD_REQUEST
            )
        result.status = ResultHeader.STATUS_VERIFIED
        result.save()
        return Response(ResultHeaderSerializer(result).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """Publish result (DRAFT/VERIFIED → PUBLISHED)"""
        result = self.get_object()
        try:
            result.publish(request.user)
            return Response(ResultHeaderSerializer(result).data, status=status.HTTP_200_OK)
        except ResultError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message}},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='freeze')
    def freeze(self, request, pk=None):
        """Freeze result (PUBLISHED → FROZEN, makes immutable)"""
        result = self.get_object()
        try:
            result.freeze(request.user)
            return Response(ResultHeaderSerializer(result).data, status=status.HTTP_200_OK)
        except ResultError as e:
            return Response(
                {"error": {"code": e.code, "message": e.message}},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Student's own results (published only)"""
        # get_queryset() applies student-specific filtering
        queryset = self.get_queryset().filter(status=ResultHeader.STATUS_PUBLISHED)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ResultComponentEntryViewSet(viewsets.ModelViewSet):
    queryset = ResultComponentEntry.objects.select_related('result_header', 'exam_component').all()
    serializer_class = ResultComponentEntrySerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['result_header', 'exam_component']
    ordering_fields = ['exam_component__sequence']
    ordering = ['result_header', 'exam_component__sequence']
    required_tasks = ['results.result_components.view']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.required_tasks = ['results.result_components.view']
        elif self.action == 'create':
            self.required_tasks = ['results.result_components.create']
        elif self.action in ['update', 'partial_update']:
            self.required_tasks = ['results.result_components.update']
        elif self.action == 'destroy':
            self.required_tasks = ['results.result_components.delete']
        return super().get_permissions()

    def perform_update(self, serializer):
        """Enforce immutability: Only editable result headers can have component updates."""
        instance = serializer.instance
        if instance and instance.result_header and not instance.result_header.is_editable:
            raise PermissionDenied(
                detail={
                    "code": "IMMUTABLE_RESULT",
                    "message": f"Cannot edit component of result with status {instance.result_header.status}. Use Requests workflow for corrections.",
                }
            )
        instance = serializer.save()
        # Recompute passing status for the result header
        compute_result_passing_status(instance.result_header)
