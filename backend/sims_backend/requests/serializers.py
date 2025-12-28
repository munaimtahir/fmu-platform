from rest_framework import serializers

from .models import Request


class RequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = [
            "id",
            "student",
            "type",
            "status",
            "notes",
            "created_at",
            "updated_at",
            "processed_by",
        ]
        read_only_fields = ["created_at", "updated_at"]
