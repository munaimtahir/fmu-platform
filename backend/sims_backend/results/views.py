from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired, has_permission_task
from sims_backend.common_permissions import in_group
from sims_backend.exams.services import compute_result_passing_status
from sims_backend.finance.services import finance_gate_checks
from sims_backend.results.models import ResultComponentEntry, ResultCorrectionRequest, ResultError, ResultHeader
from sims_backend.results.serializers import (
    ResultComponentEntrySerializer,
    ResultCorrectionRequestSerializer,
    ResultHeaderSerializer,
)


class ResultHeaderPermission(PermissionTaskRequired):
    """Allow students to read their own published results; task RBAC handles all other access."""

    def has_permission(self, request, view):
        if view.action in ["list", "retrieve", "me"] and in_group(request.user, "STUDENT"):
            return True
        return super().has_permission(request, view)


class ResultHeaderViewSet(viewsets.ModelViewSet):
    queryset = (
        ResultHeader.objects.select_related("exam", "student")
        .prefetch_related("component_entries__exam_component")
        .all()
    )
    serializer_class = ResultHeaderSerializer
    permission_classes = [IsAuthenticated, ResultHeaderPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["exam", "student", "status", "final_outcome"]
    search_fields = ["student__reg_no", "student__name", "exam__title"]
    ordering_fields = ["exam", "student", "total_obtained", "created_at"]
    ordering = ["exam", "student"]
    required_tasks = ["results.result_headers.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["results.result_headers.view"]
        elif self.action == "create":
            self.required_tasks = ["results.result_headers.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["results.result_headers.update"]
        elif self.action == "destroy":
            self.required_tasks = ["results.result_headers.delete"]
        elif self.action == "verify":
            self.required_tasks = ["results.result_headers.verify"]
        elif self.action == "publish":
            self.required_tasks = ["results.result_headers.publish"]
        elif self.action == "freeze":
            self.required_tasks = ["results.result_headers.freeze"]
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: Students can view own published results."""
        queryset = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, "results.result_headers.view"):
            return queryset

        # Students can only see their own finalized (published or frozen) results
        queryset = queryset.filter(status__in=[ResultHeader.STATUS_PUBLISHED, ResultHeader.STATUS_FROZEN])
        student = getattr(user, "student", None)
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

    def perform_destroy(self, instance):
        if not instance.is_editable:
            raise PermissionDenied(
                detail={"code": "IMMUTABLE_RESULT", "message": f"Cannot delete result with status {instance.status}. Submit a correction request instead."}
            )
        instance.delete()

    @action(detail=False, methods=["get"], url_path="exams/(?P<exam_id>[^/.]+)")
    def list_by_exam(self, request, exam_id=None):
        """List results for a specific exam"""
        results = self.get_queryset().filter(exam_id=exam_id)
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="verify")
    def verify(self, request, pk=None):
        """Verify result (DRAFT → VERIFIED)"""
        result = self.get_object()
        if result.status != ResultHeader.STATUS_DRAFT:
            return Response(
                {"error": {"code": "NOT_VERIFIABLE", "message": f"Cannot verify result with status {result.status}"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result.status = ResultHeader.STATUS_VERIFIED
        result.save()
        return Response(ResultHeaderSerializer(result).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        """Publish result (DRAFT/VERIFIED → PUBLISHED)"""
        result = self.get_object()
        try:
            result.publish(request.user)
            return Response(ResultHeaderSerializer(result).data, status=status.HTTP_200_OK)
        except ResultError as e:
            return Response({"error": {"code": e.code, "message": e.message}}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="freeze")
    def freeze(self, request, pk=None):
        """Freeze result (PUBLISHED → FROZEN, makes immutable)"""
        result = self.get_object()
        try:
            result.freeze(request.user)
            return Response(ResultHeaderSerializer(result).data, status=status.HTTP_200_OK)
        except ResultError as e:
            return Response({"error": {"code": e.code, "message": e.message}}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """Student's own results (published or frozen; drafts are not yet finalized)"""
        # get_queryset() applies student-specific filtering
        queryset = self.get_queryset().filter(
            status__in=[ResultHeader.STATUS_PUBLISHED, ResultHeader.STATUS_FROZEN]
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ResultComponentEntryViewSet(viewsets.ModelViewSet):
    queryset = ResultComponentEntry.objects.select_related("result_header", "exam_component").all()
    serializer_class = ResultComponentEntrySerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["result_header", "exam_component"]
    ordering_fields = ["exam_component__sequence"]
    ordering = ["result_header", "exam_component__sequence"]
    required_tasks = ["results.result_components.view"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["results.result_components.view"]
        elif self.action == "create":
            self.required_tasks = ["results.result_components.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["results.result_components.update"]
        elif self.action == "destroy":
            self.required_tasks = ["results.result_components.delete"]
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

    def perform_create(self, serializer):
        result_header = serializer.validated_data["result_header"]
        if not result_header.is_editable:
            raise PermissionDenied(
                detail={"code": "IMMUTABLE_RESULT", "message": f"Cannot add a component to result with status {result_header.status}. Submit a correction request instead."}
            )
        instance = serializer.save()
        compute_result_passing_status(instance.result_header)

    def perform_destroy(self, instance):
        if not instance.result_header.is_editable:
            raise PermissionDenied(
                detail={"code": "IMMUTABLE_RESULT", "message": f"Cannot delete a component from result with status {instance.result_header.status}. Submit a correction request instead."}
            )
        result_header = instance.result_header
        instance.delete()
        compute_result_passing_status(result_header)


class ResultCorrectionRequestViewSet(viewsets.ModelViewSet):
    """Narrow, auditable exception path for immutable result corrections."""

    queryset = ResultCorrectionRequest.objects.select_related("result_header", "requested_by", "reviewed_by", "applied_by")
    serializer_class = ResultCorrectionRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def _can_review(self, user):
        return has_permission_task(user, "results.result_corrections.review")

    def get_queryset(self):
        queryset = super().get_queryset()
        if self._can_review(self.request.user):
            return queryset
        return queryset.filter(requested_by=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        result = serializer.validated_data["result_header"]
        student = getattr(user, "student", None)
        if in_group(user, "STUDENT"):
            if not student or result.student_id != student.id:
                raise PermissionDenied(detail={"code": "RESULT_SCOPE_DENIED", "message": "Students may request corrections only for their own results."})
        elif not has_permission_task(user, "results.result_corrections.create"):
            raise PermissionDenied(detail={"code": "CORRECTION_REQUEST_DENIED", "message": "You are not allowed to request a result correction."})

        original_values = {
            "total_obtained": str(result.total_obtained),
            "total_max": str(result.total_max),
            "status": result.status,
            "component_marks": {str(entry.id): str(entry.marks_obtained) for entry in result.component_entries.all()},
        }
        serializer.save(requested_by=user, original_values=original_values)

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        if not self._can_review(request.user):
            raise PermissionDenied(detail={"code": "CORRECTION_REVIEW_DENIED", "message": "You are not allowed to review result corrections."})
        correction = self.get_object()
        decision = request.data.get("decision")
        if correction.status != ResultCorrectionRequest.STATUS_PENDING:
            return Response({"error": {"code": "INVALID_CORRECTION_STATE", "message": "Only pending correction requests can be reviewed."}}, status=status.HTTP_400_BAD_REQUEST)
        if decision not in [ResultCorrectionRequest.STATUS_APPROVED, ResultCorrectionRequest.STATUS_REJECTED]:
            return Response({"error": {"code": "INVALID_DECISION", "message": "Decision must be APPROVED or REJECTED."}}, status=status.HTTP_400_BAD_REQUEST)
        correction.status = decision
        correction.reviewed_by = request.user
        correction.reviewed_at = timezone.now()
        correction.review_note = str(request.data.get("review_note", ""))
        correction.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_note", "updated_at"])
        return Response(self.get_serializer(correction).data)

    @action(detail=True, methods=["post"])
    def apply(self, request, pk=None):
        if not self._can_review(request.user):
            raise PermissionDenied(detail={"code": "CORRECTION_APPLY_DENIED", "message": "You are not allowed to apply result corrections."})
        correction = self.get_object()
        if correction.status != ResultCorrectionRequest.STATUS_APPROVED:
            return Response({"error": {"code": "INVALID_CORRECTION_STATE", "message": "Only approved correction requests can be applied."}}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            result = ResultHeader.objects.select_for_update().get(pk=correction.result_header_id)
            changes = correction.proposed_changes
            component_marks = changes.get("component_marks", {})
            entries = {str(entry.id): entry for entry in result.component_entries.select_for_update()}
            unknown = set(component_marks) - set(entries)
            if unknown:
                return Response({"error": {"code": "UNKNOWN_COMPONENT_ENTRY", "message": "Correction references a component entry outside this result."}}, status=status.HTTP_400_BAD_REQUEST)
            if "total_obtained" in changes:
                result.total_obtained = Decimal(str(changes["total_obtained"]))
            if "total_max" in changes:
                result.total_max = Decimal(str(changes["total_max"]))
            result.save(update_fields=["total_obtained", "total_max", "updated_at"])

            for entry_id, marks in component_marks.items():
                entry = entries[entry_id]
                entry.marks_obtained = Decimal(str(marks))
                entry.save(update_fields=["marks_obtained", "updated_at"])

            compute_result_passing_status(result)
            correction.status = ResultCorrectionRequest.STATUS_APPLIED
            correction.applied_by = request.user
            correction.applied_at = timezone.now()
            correction.save(update_fields=["status", "applied_by", "applied_at", "updated_at"])
        return Response(self.get_serializer(correction).data)
