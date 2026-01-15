"""Serializers for Student CSV import API"""
from rest_framework import serializers

from sims_backend.students.imports.models import ImportJob


class PreviewRequestSerializer(serializers.Serializer):
    """Serializer for preview request"""
    file = serializers.FileField(help_text="CSV file to import")
    mode = serializers.ChoiceField(
        choices=ImportJob.MODE_CHOICES,
        default=ImportJob.MODE_CREATE_ONLY,
        help_text="Import mode: CREATE_ONLY or UPSERT"
    )
    auto_create = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Automatically create missing Programs, Batches, and Groups"
    )


class RowErrorSerializer(serializers.Serializer):
    """Serializer for row validation errors"""
    column = serializers.CharField()
    message = serializers.CharField()


class PreviewRowSerializer(serializers.Serializer):
    """Serializer for preview row result"""
    row_number = serializers.IntegerField()
    action = serializers.CharField()  # CREATE, UPDATE, SKIP
    errors = RowErrorSerializer(many=True)
    data = serializers.DictField()


class PreviewResponseSerializer(serializers.Serializer):
    """Serializer for preview response"""
    import_job_id = serializers.UUIDField()
    total_rows = serializers.IntegerField()
    valid_rows = serializers.IntegerField()
    invalid_rows = serializers.IntegerField()
    duplicate_file_warning = serializers.BooleanField()
    preview_rows = PreviewRowSerializer(many=True)
    summary = serializers.DictField()


class CommitRequestSerializer(serializers.Serializer):
    """Serializer for commit request"""
    import_job_id = serializers.UUIDField(help_text="ID of the previewed import job")
    confirm = serializers.BooleanField(help_text="Must be True to confirm commit")
    auto_create = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Automatically create missing Programs, Batches, and Groups (must match preview setting)"
    )


class CommitResponseSerializer(serializers.Serializer):
    """Serializer for commit response"""
    import_job_id = serializers.UUIDField()
    status = serializers.CharField()
    created_count = serializers.IntegerField()
    updated_count = serializers.IntegerField()
    failed_count = serializers.IntegerField()
    has_error_report = serializers.BooleanField()


class ImportJobSerializer(serializers.ModelSerializer):
    """Serializer for ImportJob model"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = ImportJob
        fields = [
            'id', 'created_by', 'created_by_username', 'created_at', 'finished_at',
            'status', 'mode', 'auto_create', 'original_filename', 'file_hash',
            'total_rows', 'valid_rows', 'invalid_rows',
            'created_count', 'updated_count', 'failed_count',
            'error_report_file', 'summary'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'finished_at',
            'file_hash', 'total_rows', 'valid_rows', 'invalid_rows',
            'created_count', 'updated_count', 'failed_count',
            'error_report_file', 'summary'
        ]
