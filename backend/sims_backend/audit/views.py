import csv

from django.http import HttpResponse
from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import PermissionTaskRequired

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogFilter(filters.FilterSet):
    """Filter for audit logs."""

    actor = filters.CharFilter(
        field_name="actor__username", lookup_expr="icontains"
    )
    entity = filters.CharFilter(field_name="entity", lookup_expr="icontains")
    action = filters.CharFilter(field_name="action", lookup_expr="iexact")
    date_from = filters.DateTimeFilter(
        field_name="timestamp", lookup_expr="gte"
    )
    date_to = filters.DateTimeFilter(field_name="timestamp", lookup_expr="lte")
    method = filters.CharFilter(field_name="method", lookup_expr="iexact")

    class Meta:
        model = AuditLog
        fields = [
            "actor", "entity", "action", "date_from", "date_to", "method"
        ]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing audit logs.
    Requires audit.events.view permission task.
    """

    queryset = AuditLog.objects.all().select_related("actor")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, PermissionTaskRequired]
    filterset_class = AuditLogFilter
    ordering_fields = ["timestamp", "method", "status_code", "action"]
    ordering = ["-timestamp"]
    required_tasks = ["audit.events.view"]

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        """
        Export audit events as CSV.
        Requires audit.events.export permission task.
        """
        # Check export permission
        from core.permissions import has_permission_task
        if not has_permission_task(request.user, "audit.events.export"):
            return Response(
                {"error": "Permission denied"}, status=403
            )

        # Apply filters
        queryset = self.filter_queryset(self.get_queryset())

        # Create CSV response
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            'attachment; filename="audit_events.csv"'
        )

        writer = csv.writer(response)
        writer.writerow([
            "ID", "Timestamp", "Actor", "Method", "Path", "Entity",
            "Entity ID", "Action", "Summary", "IP Address"
        ])

        for log in queryset[:10000]:  # Limit to 10k records
            writer.writerow([
                str(log.id),
                log.timestamp.isoformat(),
                log.actor.username if log.actor else "System",
                log.method,
                log.path,
                log.entity or log.model or "",
                log.entity_id or log.object_id or "",
                log.action,
                log.summary[:200],  # Truncate long summaries
                log.ip_address or "",
            ])
        return response
