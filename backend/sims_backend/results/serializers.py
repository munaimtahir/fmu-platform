from rest_framework import serializers

from sims_backend.common.workflow import validate_workflow_transition
from sims_backend.common_permissions import in_group
from sims_backend.results.models import ResultComponentEntry, ResultHeader


class ResultComponentEntrySerializer(serializers.ModelSerializer):
    exam_component_name = serializers.CharField(source='exam_component.name', read_only=True)
    exam_component_max_marks = serializers.DecimalField(source='exam_component.max_marks', read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = ResultComponentEntry
        fields = [
            'id', 'result_header', 'exam_component', 'exam_component_name',
            'exam_component_max_marks', 'marks_obtained', 'component_outcome',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['component_outcome', 'created_at', 'updated_at']


class ResultHeaderSerializer(serializers.ModelSerializer):
    student_reg_no = serializers.CharField(source='student.reg_no', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    component_entries = ResultComponentEntrySerializer(many=True, read_only=True)

    class Meta:
        model = ResultHeader
        fields = [
            'id', 'exam', 'exam_title', 'student', 'student_reg_no', 'student_name',
            'total_obtained', 'total_max', 'final_outcome', 'status',
            'component_entries', 'created_at', 'updated_at'
        ]
        read_only_fields = ['final_outcome', 'created_at', 'updated_at']

    def validate_status(self, value):
        user = self.context['request'].user

        if self.instance:  # Update
            current_status = self.instance.status
            if current_status != value:
                # Validate workflow transition
                validate_workflow_transition(user, self.instance, current_status, value)
        else:  # Create
            # OfficeAssistant can only create in DRAFT
            if in_group(user, 'OFFICE_ASSISTANT'):
                if value != 'DRAFT':
                    raise serializers.ValidationError("Office Assistant can only create results in DRAFT status")

        return value

    def validate(self, data):
        user = self.context['request'].user

        # OfficeAssistant restrictions
        if in_group(user, 'OFFICE_ASSISTANT'):
            if self.instance:
                # Cannot transition from DRAFT
                if self.instance.status != 'DRAFT':
                    if 'status' in data and data['status'] != self.instance.status:
                        raise serializers.ValidationError("Cannot change status from non-DRAFT state")

        return data
