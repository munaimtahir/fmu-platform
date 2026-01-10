from rest_framework import serializers

from sims_backend.academics.models import (
    AcademicPeriod,
    Batch,
    Course,
    Department,
    Group,
    LearningBlock,
    Module,
    Period,
    Program,
    Section,
    Track,
)
from sims_backend.academics.services import (
    DepartmentService,
    LearningBlockService,
    ProgramService,
)


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = [
            'id',
            'name',
            'description',
            'is_active',
            'structure_type',
            'is_finalized',
            'period_length_months',
            'total_periods',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_finalized']

    def validate(self, data):
        """Validate structure fields using service layer"""
        program = self.instance if self.instance else Program()
        ProgramService.validate_structure_fields(program, data)
        if self.instance:
            ProgramService.check_finalize_lock(self.instance, data)
        return data


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
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id',
            'name',
            'code',
            'description',
            'parent',
            'parent_name',
            'children_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_children_count(self, obj):
        """Get count of child departments"""
        return obj.children.count() if hasattr(obj, 'children') else 0

    def validate(self, data):
        """Validate parent relationship using service layer"""
        department = self.instance if self.instance else Department()
        DepartmentService.validate_parent_relationship(department, data.get('parent'))
        return data


# New Academics Module Serializers

class PeriodSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = Period
        fields = [
            'id',
            'program',
            'program_name',
            'name',
            'order',
            'start_date',
            'end_date',
            'students_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_students_count(self, obj):
        """Get count of active students in batches that correspond to this period"""
        from django.utils import timezone
        from sims_backend.students.models import Student
        from sims_backend.academics.models import Batch

        # Get all batches for this program
        batches = Batch.objects.filter(program=obj.program)
        
        # Determine which batches correspond to this period based on program structure
        matching_batch_ids = []
        current_year = timezone.now().year
        current_month = timezone.now().month
        
        for batch in batches:
            # Calculate how many periods (years/semesters) have passed since batch started
            years_since_start = current_year - batch.start_year
            
            if obj.program.structure_type == 'YEARLY':
                # For yearly: period order should match years since start + 1
                # Year 1 batch in 2024 -> Year 1 (order=1) in 2024
                # Year 1 batch in 2025 -> Year 2 (order=2) in 2025
                batch_current_period_order = years_since_start + 1
            elif obj.program.structure_type == 'SEMESTER':
                # For semester: calculate semesters (2 per year)
                # Assume semester 1 is Jan-Jun, semester 2 is Jul-Dec
                semester_in_current_year = 1 if current_month <= 6 else 2
                batch_current_period_order = (years_since_start * 2) + semester_in_current_year
            else:  # CUSTOM
                # For custom, assume 1 period per year for simplicity
                batch_current_period_order = years_since_start + 1
            
            if batch_current_period_order == obj.order:
                matching_batch_ids.append(batch.id)
        
        if not matching_batch_ids:
            return 0
        
        # Count active students in matching batches
        return Student.objects.filter(
            batch_id__in=matching_batch_ids,
            status='active'
        ).count()


class TrackSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = Track
        fields = [
            'id',
            'program',
            'program_name',
            'name',
            'description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class ModuleSerializer(serializers.ModelSerializer):
    block_name = serializers.CharField(source='block.name', read_only=True)

    class Meta:
        model = Module
        fields = [
            'id',
            'block',
            'block_name',
            'name',
            'description',
            'order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class LearningBlockSerializer(serializers.ModelSerializer):
    period_name = serializers.CharField(source='period.name', read_only=True)
    track_name = serializers.CharField(source='track.name', read_only=True)
    primary_department_name = serializers.CharField(
        source='primary_department.name', read_only=True
    )
    sub_department_name = serializers.CharField(
        source='sub_department.name', read_only=True
    )
    modules = ModuleSerializer(many=True, read_only=True)
    modules_count = serializers.SerializerMethodField()

    class Meta:
        model = LearningBlock
        fields = [
            'id',
            'period',
            'period_name',
            'track',
            'track_name',
            'name',
            'block_type',
            'start_date',
            'end_date',
            'primary_department',
            'primary_department_name',
            'sub_department',
            'sub_department_name',
            'modules',
            'modules_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_modules_count(self, obj):
        """Get count of modules"""
        return obj.modules.count() if hasattr(obj, 'modules') else 0

    def validate(self, data):
        """Validate block type rules and overlap using service layer"""
        block = self.instance if self.instance else LearningBlock()
        
        # Validate block type rules
        LearningBlockService.validate_block_type_rules(block, data)
        
        # Validate overlap within same track
        track = data.get('track', getattr(block, 'track', None))
        start_date = data.get('start_date', getattr(block, 'start_date', None))
        end_date = data.get('end_date', getattr(block, 'end_date', None))
        
        if track and start_date and end_date:
            exclude_id = self.instance.pk if self.instance and self.instance.pk else None
            LearningBlockService.validate_overlap(block, track, start_date, end_date, exclude_id)
        
        return data


class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    academic_period_name = serializers.CharField(source='academic_period.name', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id',
            'code',
            'name',
            'department',
            'department_name',
            'academic_period',
            'academic_period_name',
            'credits',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class SectionSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    academic_period_name = serializers.CharField(source='academic_period.name', read_only=True)
    faculty_username = serializers.CharField(source='faculty.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = [
            'id',
            'course',
            'course_code',
            'course_name',
            'name',
            'academic_period',
            'academic_period_name',
            'faculty',
            'faculty_username',
            'group',
            'group_name',
            'capacity',
            'enrolled_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_enrolled_count(self, obj):
        """Get count of enrolled students for this section."""
        # Legacy enrollment module removed - return 0 or implement via students app if needed
        return 0
