from rest_framework import serializers
from .models import RequirementDefinition, RequirementInstance, RequirementSubmission, ComplianceActionLog

class RequirementDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequirementDefinition
        fields = '__all__'

class RequirementSubmissionSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source='submitted_by.username', read_only=True)
    
    class Meta:
        model = RequirementSubmission
        fields = ['id', 'file', 'value', 'submitted_by', 'submitted_by_name', 'created_at']
        read_only_fields = ['submitted_by', 'created_at']

class RequirementInstanceSerializer(serializers.ModelSerializer):
    definition_title = serializers.CharField(source='definition.title', read_only=True)
    definition_description = serializers.CharField(source='definition.description', read_only=True)
    definition_type = serializers.CharField(source='definition.requirement_type', read_only=True)
    is_locked = serializers.BooleanField(read_only=True)
    submissions = RequirementSubmissionSerializer(many=True, read_only=True)

    class Meta:
        model = RequirementInstance
        fields = ['id', 'student', 'definition', 'definition_title', 'definition_description', 'definition_type', 
                  'status', 'due_at', 'completed_at', 'notes', 'is_locked', 'submissions', 'updated_at']
        # By default, preventing direct manipulation of status/student via update
        read_only_fields = ['student', 'definition', 'completed_at', 'status'] 

class ComplianceActionLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = ComplianceActionLog
        fields = '__all__'
