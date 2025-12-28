from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogFilter(filters.FilterSet):
    """Filter for audit logs."""

    actor = filters.CharFilter(field_name="actor__username", lookup_expr="icontains")
    entity = filters.CharFilter(field_name="model", lookup_expr="icontains")
    date_from = filters.DateTimeFilter(field_name="timestamp", lookup_expr="gte")
    date_to = filters.DateTimeFilter(field_name="timestamp", lookup_expr="lte")
    method = filters.CharFilter(field_name="method", lookup_expr="iexact")

    class Meta:
        model = AuditLog
        fields = ["actor", "entity", "date_from", "date_to", "method"]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing audit logs.
    Only admins can view audit logs.
    """

    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filterset_class = AuditLogFilter
    ordering_fields = ["timestamp", "method", "status_code"]
    ordering = ["-timestamp"]
