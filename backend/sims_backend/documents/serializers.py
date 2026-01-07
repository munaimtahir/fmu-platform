from rest_framework import serializers

from .models import Document, DocumentGenerationJob, DocumentType


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = ["id", "code", "name", "description", "template", "is_active", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class DocumentSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source="type.name", read_only=True)
    type_code = serializers.CharField(source="type.code", read_only=True)
    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    requested_by_username = serializers.CharField(source="requested_by.username", read_only=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "student",
            "student_reg_no",
            "student_name",
            "type",
            "type_name",
            "type_code",
            "document_number",
            "status",
            "file",
            "verification_token",
            "qr_code",
            "generated_at",
            "requested_by",
            "requested_by_username",
            "requested_at",
            "expires_at",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "document_number",
            "verification_token",
            "status",
            "file",
            "qr_code",
            "generated_at",
            "requested_by",
            "requested_at",
            "created_at",
            "updated_at",
        ]


class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    type_name = serializers.CharField(source="type.name", read_only=True)
    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "student_reg_no",
            "type_name",
            "document_number",
            "status",
            "generated_at",
            "requested_at",
        ]


class DocumentGenerationJobSerializer(serializers.ModelSerializer):
    document_number = serializers.CharField(source="document.document_number", read_only=True)

    class Meta:
        model = DocumentGenerationJob
        fields = [
            "id",
            "document",
            "document_number",
            "status",
            "started_at",
            "completed_at",
            "error_message",
            "created_at",
        ]
        read_only_fields = ["status", "started_at", "completed_at", "error_message", "created_at"]


class DocumentVerificationSerializer(serializers.Serializer):
    """Serializer for public verification response."""
    valid = serializers.BooleanField()
    document_number = serializers.CharField()
    type_name = serializers.CharField()
    student_reg_no = serializers.CharField()
    student_name = serializers.CharField()
    generated_at = serializers.DateTimeField()
    reason = serializers.CharField(required=False)
