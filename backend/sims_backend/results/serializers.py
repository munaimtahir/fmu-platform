from decimal import Decimal, InvalidOperation

from rest_framework import serializers

from sims_backend.common.workflow import validate_workflow_transition
from sims_backend.common_permissions import in_group
from sims_backend.results.models import ResultComponentEntry, ResultCorrectionRequest, ResultHeader


class ResultComponentEntrySerializer(serializers.ModelSerializer):
    exam_component_name = serializers.CharField(source="exam_component.name", read_only=True)
    exam_component_max_marks = serializers.DecimalField(
        source="exam_component.max_marks", read_only=True, max_digits=10, decimal_places=2
    )

    class Meta:
        model = ResultComponentEntry
        fields = [
            "id",
            "result_header",
            "exam_component",
            "exam_component_name",
            "exam_component_max_marks",
            "marks_obtained",
            "component_outcome",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["component_outcome", "created_at", "updated_at"]


class ResultHeaderSerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source="student.reg_no", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    exam_title = serializers.CharField(source="exam.title", read_only=True)
    component_entries = ResultComponentEntrySerializer(many=True, read_only=True)

    class Meta:
        model = ResultHeader
        fields = [
            "id",
            "exam",
            "exam_title",
            "student",
            "student_reg_no",
            "student_name",
            "total_obtained",
            "total_max",
            "final_outcome",
            "status",
            "component_entries",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["final_outcome", "created_at", "updated_at"]

    def validate_status(self, value):
        user = self.context["request"].user

        if self.instance:  # Update
            current_status = self.instance.status
            if current_status != value:
                # Validate workflow transition
                validate_workflow_transition(user, self.instance, current_status, value)
        else:  # Create
            # OfficeAssistant can only create in DRAFT
            if in_group(user, "OFFICE_ASSISTANT"):
                if value != "DRAFT":
                    raise serializers.ValidationError("Office Assistant can only create results in DRAFT status")

        return value

    def validate(self, data):
        user = self.context["request"].user

        # OfficeAssistant restrictions
        if in_group(user, "OFFICE_ASSISTANT"):
            if self.instance:
                # Cannot transition from DRAFT
                if self.instance.status != "DRAFT":
                    if "status" in data and data["status"] != self.instance.status:
                        raise serializers.ValidationError("Cannot change status from non-DRAFT state")

        return data


class ResultCorrectionRequestSerializer(serializers.ModelSerializer):
    result_status = serializers.CharField(source="result_header.status", read_only=True)
    requested_by_username = serializers.CharField(source="requested_by.username", read_only=True)
    reviewed_by_username = serializers.CharField(source="reviewed_by.username", read_only=True)

    class Meta:
        model = ResultCorrectionRequest
        fields = [
            "id",
            "result_header",
            "result_status",
            "requested_by",
            "requested_by_username",
            "reason",
            "proposed_changes",
            "original_values",
            "status",
            "reviewed_by",
            "reviewed_by_username",
            "reviewed_at",
            "review_note",
            "applied_by",
            "applied_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "requested_by",
            "original_values",
            "status",
            "reviewed_by",
            "reviewed_at",
            "review_note",
            "applied_by",
            "applied_at",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        result = attrs["result_header"]
        if result.status not in [ResultHeader.STATUS_PUBLISHED, ResultHeader.STATUS_FROZEN]:
            raise serializers.ValidationError({"result_header": "Corrections are only requested for published or frozen results."})
        return attrs

    def validate_proposed_changes(self, value):
        if not isinstance(value, dict) or not value:
            raise serializers.ValidationError("Provide at least one proposed result change.")
        allowed = {"total_obtained", "total_max", "component_marks"}
        unknown = set(value) - allowed
        if unknown:
            raise serializers.ValidationError(f"Unsupported correction fields: {', '.join(sorted(unknown))}.")

        for field in ["total_obtained", "total_max"]:
            if field in value:
                try:
                    if Decimal(str(value[field])) < 0:
                        raise serializers.ValidationError({field: "Must be zero or greater."})
                except (InvalidOperation, ValueError):
                    raise serializers.ValidationError({field: "Must be a decimal value."})

        component_marks = value.get("component_marks")
        if component_marks is not None:
            if not isinstance(component_marks, dict) or not component_marks:
                raise serializers.ValidationError({"component_marks": "Must map component entry IDs to marks."})
            for entry_id, marks in component_marks.items():
                try:
                    if int(entry_id) <= 0 or Decimal(str(marks)) < 0:
                        raise ValueError
                except (InvalidOperation, TypeError, ValueError):
                    raise serializers.ValidationError({"component_marks": "Keys must be positive entry IDs and values non-negative decimals."})
        return value
