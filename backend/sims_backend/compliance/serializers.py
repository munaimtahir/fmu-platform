from rest_framework import serializers

from .models import (
    ComplianceActionLog,
    RequirementDefinition,
    RequirementInstance,
    RequirementScope,
    RequirementSubmission,
)


class RequirementDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequirementDefinition
        fields = "__all__"


class RequirementScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequirementScope
        fields = ["id", "definition", "scope_type", "program", "batch", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        scope_type = attrs.get("scope_type", getattr(self.instance, "scope_type", None))
        program = attrs.get("program", getattr(self.instance, "program", None))
        batch = attrs.get("batch", getattr(self.instance, "batch", None))
        definition = attrs.get("definition", getattr(self.instance, "definition", None))
        if definition and (
            definition.requirement_type != RequirementDefinition.TYPE_DOCUMENT
            or not definition.is_active
            or not definition.is_onboarding_required
        ):
            raise serializers.ValidationError("Scopes require an active onboarding document definition")
        if scope_type == RequirementScope.SCOPE_GLOBAL and (program or batch):
            raise serializers.ValidationError("Global scopes cannot select a Program or Batch")
        if scope_type == RequirementScope.SCOPE_PROGRAM and (not program or batch):
            raise serializers.ValidationError("Program scopes require only a Program")
        if scope_type == RequirementScope.SCOPE_BATCH and (not batch or program):
            raise serializers.ValidationError("Batch scopes require only a Batch")
        duplicate = RequirementScope.objects.filter(
            definition=definition,
            scope_type=scope_type,
            program=program,
            batch=batch,
        )
        if self.instance:
            duplicate = duplicate.exclude(pk=self.instance.pk)
        if duplicate.exists():
            raise serializers.ValidationError("This requirement scope already exists")
        return attrs


class RequirementSubmissionSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source="submitted_by.username", read_only=True)
    has_file = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    def get_has_file(self, obj) -> bool:
        return bool(obj.file)

    def get_file_name(self, obj) -> str:
        return obj.original_filename or (obj.file.name.rsplit("/", 1)[-1] if obj.file else "")

    class Meta:
        model = RequirementSubmission
        fields = ["id", "has_file", "file_name", "value", "submitted_by", "submitted_by_name", "created_at"]
        read_only_fields = ["submitted_by", "created_at"]


class RequirementInstanceSerializer(serializers.ModelSerializer):
    definition_title = serializers.CharField(source="definition.title", read_only=True)
    definition_description = serializers.CharField(source="definition.description", read_only=True)
    definition_type = serializers.CharField(source="definition.requirement_type", read_only=True)
    is_locked = serializers.BooleanField(read_only=True)
    submissions = RequirementSubmissionSerializer(many=True, read_only=True)

    class Meta:
        model = RequirementInstance
        fields = [
            "id",
            "student",
            "definition",
            "definition_title",
            "definition_description",
            "definition_type",
            "status",
            "due_at",
            "completed_at",
            "notes",
            "is_active",
            "assignment_source",
            "is_locked",
            "submissions",
            "updated_at",
        ]
        # By default, preventing direct manipulation of status/student via update
        read_only_fields = ["student", "definition", "completed_at", "status", "is_active", "assignment_source"]


class ComplianceActionLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ComplianceActionLog
        fields = "__all__"
