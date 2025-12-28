from rest_framework import serializers

from .models import PendingChange, Result


class ResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Result
        fields = [
            "id",
            "student",
            "section",
            "final_grade",
            "state",
            "is_published",
            "published_at",
            "published_by",
            "frozen_at",
            "frozen_by",
        ]
        read_only_fields = [
            "state",
            "is_published",
            "published_at",
            "published_by",
            "frozen_at",
            "frozen_by",
        ]


class PendingChangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PendingChange
        fields = [
            "id",
            "result",
            "requested_by",
            "approved_by",
            "status",
            "new_grade",
            "reason",
            "requested_at",
            "resolved_at",
        ]
        read_only_fields = ["requested_at", "resolved_at", "status"]
