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
            "model",
            "object_id",
            "summary",
        ]
        read_only_fields = fields
