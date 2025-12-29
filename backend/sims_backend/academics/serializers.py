from rest_framework import serializers

from sims_backend.academics.models import Program, Batch, AcademicPeriod, Group, Department


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class BatchSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = Batch
        fields = ['id', 'program', 'program_name', 'name', 'start_year', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class AcademicPeriodSerializer(serializers.ModelSerializer):
    parent_period_name = serializers.CharField(source='parent_period.name', read_only=True)

    class Meta:
        model = AcademicPeriod
        fields = ['id', 'period_type', 'name', 'parent_period', 'parent_period_name', 'start_date', 'end_date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class GroupSerializer(serializers.ModelSerializer):
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    program_name = serializers.CharField(source='batch.program.name', read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'batch', 'batch_name', 'program_name', 'name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
