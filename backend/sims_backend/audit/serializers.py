from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit log entries."""

    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "timestamp",
            "actor",
            "actor_username",
            "method",
            "path",
            "status_code",
            "entity",
            "entity_id",
            "action",
            "summary",
            "metadata",
            "ip_address",
            "user_agent",
            # Legacy fields for backward compatibility
            "model",
            "object_id",
            "request_data",
        ]
        read_only_fields = fields
