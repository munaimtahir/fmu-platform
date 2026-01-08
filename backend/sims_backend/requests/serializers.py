"""Serializers for requests module."""
from rest_framework import serializers

from .models import Request, RequestType, RequestAttachment, RequestRemark, RequestHistory


class RequestTypeSerializer(serializers.ModelSerializer):
    """Serializer for RequestType model."""

    class Meta:
        model = RequestType
        fields = [
            "id", "code", "name", "description", "target_module",
            "requires_attachment", "is_active", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class RequestAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for RequestAttachment model."""

    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)

    class Meta:
        model = RequestAttachment
        fields = [
            "id", "request", "file", "name", "uploaded_by",
            "uploaded_by_username", "created_at"
        ]
        read_only_fields = ["id", "uploaded_by", "uploaded_by_username", "created_at"]


class RequestRemarkSerializer(serializers.ModelSerializer):
    """Serializer for RequestRemark model."""

    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = RequestRemark
        fields = [
            "id", "request", "author", "author_username", "content",
            "is_internal", "created_at"
        ]
        read_only_fields = ["id", "author", "author_username", "created_at"]


class RequestHistorySerializer(serializers.ModelSerializer):
    """Serializer for RequestHistory model."""

    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = RequestHistory
        fields = [
            "id", "request", "action", "actor", "actor_username",
            "old_value", "new_value", "summary", "created_at"
        ]
        read_only_fields = fields


class RequestSerializer(serializers.ModelSerializer):
    """Serializer for Request model."""

    type_name = serializers.CharField(source="type.name", read_only=True)
    requester_username = serializers.CharField(source="requester.username", read_only=True)
    assigned_to_username = serializers.CharField(source="assigned_to.username", read_only=True)
    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)
    attachments = RequestAttachmentSerializer(many=True, read_only=True)
    remarks = RequestRemarkSerializer(many=True, read_only=True)
    is_editable = serializers.ReadOnlyField()
    is_resolvable = serializers.ReadOnlyField()

    class Meta:
        model = Request
        fields = [
            "id", "type", "type_name", "requester", "requester_username",
            "student", "student_reg_no", "status", "title", "description",
            "data", "assigned_to", "assigned_to_username", "priority",
            "submitted_at", "resolved_at", "resolution_notes",
            "attachments", "remarks", "is_editable", "is_resolvable",
            "created_at", "updated_at"
        ]
        read_only_fields = [
            "id", "requester", "requester_username", "type_name",
            "student_reg_no", "assigned_to_username", "submitted_at",
            "resolved_at", "attachments", "remarks", "is_editable",
            "is_resolvable", "created_at", "updated_at"
        ]

    def validate(self, attrs):
        """Validate request data."""
        request_type = attrs.get("type")
        if request_type and not request_type.is_active:
            raise serializers.ValidationError(
                {"type": "This request type is not currently active."}
            )
        return attrs


class RequestListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for Request list views."""

    type_name = serializers.CharField(source="type.name", read_only=True)
    requester_username = serializers.CharField(source="requester.username", read_only=True)
    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)

    class Meta:
        model = Request
        fields = [
            "id", "type", "type_name", "requester_username", "student_reg_no",
            "status", "title", "priority", "submitted_at", "resolved_at"
        ]
        read_only_fields = fields
