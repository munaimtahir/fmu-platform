"""Views for requests module."""
from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired, has_permission_task

from .models import Request, RequestType, RequestAttachment, RequestRemark, RequestHistory
from .serializers import (
    RequestSerializer,
    RequestListSerializer,
    RequestTypeSerializer,
    RequestAttachmentSerializer,
    RequestRemarkSerializer,
    RequestHistorySerializer,
)


class RequestTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for RequestType model (read-only)."""

    queryset = RequestType.objects.filter(is_active=True)
    serializer_class = RequestTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.DjangoFilterBackend, SearchFilter]
    search_fields = ["name", "description"]
    filterset_fields = ["target_module", "requires_attachment"]


class RequestFilter(filters.FilterSet):
    """Filter for Request model."""

    status = filters.CharFilter(lookup_expr="iexact")
    priority = filters.CharFilter(lookup_expr="iexact")
    submitted_after = filters.DateTimeFilter(field_name="submitted_at", lookup_expr="gte")
    submitted_before = filters.DateTimeFilter(field_name="submitted_at", lookup_expr="lte")

    class Meta:
        model = Request
        fields = ["type", "status", "priority", "requester", "assigned_to", "student"]


class RequestViewSet(viewsets.ModelViewSet):
    """ViewSet for Request model."""

    queryset = Request.objects.all().select_related(
        "type", "requester", "student", "assigned_to"
    ).prefetch_related("attachments", "remarks")
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filterset_class = RequestFilter
    filter_backends = [filters.DjangoFilterBackend, SearchFilter]
    search_fields = ["title", "description"]
    required_tasks = ["requests.view"]

    def get_serializer_class(self):
        if self.action == "list":
            return RequestListSerializer
        return RequestSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            self.required_tasks = ["requests.view"]
        elif self.action == "create":
            self.required_tasks = ["requests.create"]
        elif self.action in ["update", "partial_update"]:
            self.required_tasks = ["requests.update"]
        elif self.action == "destroy":
            self.required_tasks = ["requests.delete"]
        elif self.action == "assign":
            self.required_tasks = ["requests.assign"]
        elif self.action in ["approve", "reject"]:
            self.required_tasks = ["requests.approve"]
        elif self.action == "complete":
            self.required_tasks = ["requests.complete"]
        return super().get_permissions()

    def get_queryset(self):
        """Object-level permission: users can view their own requests."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view all, return all
        if has_permission_task(user, "requests.view"):
            return qs

        # Otherwise, return only own requests
        return qs.filter(requester=user)

    def perform_create(self, serializer):
        """Set requester on create."""
        request = serializer.save(requester=self.request.user)
        # Create history entry
        RequestHistory.objects.create(
            request=request,
            action=RequestHistory.ACTION_CREATED,
            actor=self.request.user,
            summary=f"Request created: {request.title}",
        )

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        """Assign request to a user."""
        req = self.get_object()
        user_id = request.data.get("assigned_to")

        if not user_id:
            return Response(
                {"error": {"code": "MISSING_USER", "message": "assigned_to is required"}},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            assignee = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": {"code": "USER_NOT_FOUND", "message": "User not found"}},
                status=status.HTTP_404_NOT_FOUND
            )

        old_assignee = req.assigned_to
        req.assigned_to = assignee
        if req.status == Request.STATUS_PENDING:
            req.status = Request.STATUS_UNDER_REVIEW
        req.save()

        # Create history entry
        RequestHistory.objects.create(
            request=req,
            action=RequestHistory.ACTION_ASSIGNED,
            actor=request.user,
            old_value={"assigned_to": old_assignee.id if old_assignee else None},
            new_value={"assigned_to": assignee.id},
            summary=f"Assigned to {assignee.username}",
        )

        serializer = self.get_serializer(req)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve a request."""
        req = self.get_object()

        if not req.is_resolvable:
            return Response(
                {"error": {"code": "NOT_RESOLVABLE", "message": "Request cannot be approved in current status"}},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = req.status
        req.status = Request.STATUS_APPROVED
        req.resolved_at = timezone.now()
        req.resolution_notes = request.data.get("notes", "")
        req.save()

        # Create history entry
        RequestHistory.objects.create(
            request=req,
            action=RequestHistory.ACTION_STATUS_CHANGED,
            actor=request.user,
            old_value={"status": old_status},
            new_value={"status": req.status},
            summary=f"Request approved",
        )

        serializer = self.get_serializer(req)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject a request."""
        req = self.get_object()

        if not req.is_resolvable:
            return Response(
                {"error": {"code": "NOT_RESOLVABLE", "message": "Request cannot be rejected in current status"}},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = req.status
        req.status = Request.STATUS_REJECTED
        req.resolved_at = timezone.now()
        req.resolution_notes = request.data.get("notes", "")
        req.save()

        # Create history entry
        RequestHistory.objects.create(
            request=req,
            action=RequestHistory.ACTION_STATUS_CHANGED,
            actor=request.user,
            old_value={"status": old_status},
            new_value={"status": req.status},
            summary=f"Request rejected",
        )

        serializer = self.get_serializer(req)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark request as completed."""
        req = self.get_object()

        if req.status != Request.STATUS_APPROVED:
            return Response(
                {"error": {"code": "NOT_APPROVED", "message": "Only approved requests can be completed"}},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = req.status
        req.status = Request.STATUS_COMPLETED
        req.save()

        # Create history entry
        RequestHistory.objects.create(
            request=req,
            action=RequestHistory.ACTION_STATUS_CHANGED,
            actor=request.user,
            old_value={"status": old_status},
            new_value={"status": req.status},
            summary=f"Request completed",
        )

        serializer = self.get_serializer(req)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """Get request history."""
        req = self.get_object()
        history = req.history.all()
        serializer = RequestHistorySerializer(history, many=True)
        return Response(serializer.data)


class RequestAttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet for RequestAttachment model."""

    queryset = RequestAttachment.objects.all().select_related("request", "uploaded_by")
    serializer_class = RequestAttachmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["request"]

    def perform_create(self, serializer):
        """Set uploaded_by on create."""
        attachment = serializer.save(uploaded_by=self.request.user)
        # Create history entry
        RequestHistory.objects.create(
            request=attachment.request,
            action=RequestHistory.ACTION_ATTACHMENT_ADDED,
            actor=self.request.user,
            summary=f"Attachment added: {attachment.name}",
        )


class RequestRemarkViewSet(viewsets.ModelViewSet):
    """ViewSet for RequestRemark model."""

    queryset = RequestRemark.objects.all().select_related("request", "author")
    serializer_class = RequestRemarkSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["request", "is_internal"]

    def get_queryset(self):
        """Filter out internal remarks for non-admin users."""
        qs = super().get_queryset()
        user = self.request.user

        # If user has permission to view internal remarks, return all
        if has_permission_task(user, "requests.view_internal"):
            return qs

        # Otherwise, filter out internal remarks
        return qs.filter(is_internal=False)

    def perform_create(self, serializer):
        """Set author on create."""
        remark = serializer.save(author=self.request.user)
        # Create history entry
        RequestHistory.objects.create(
            request=remark.request,
            action=RequestHistory.ACTION_REMARKED,
            actor=self.request.user,
            summary=f"Remark added",
        )
