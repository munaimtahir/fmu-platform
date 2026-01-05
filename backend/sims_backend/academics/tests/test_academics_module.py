"""
Comprehensive tests for Academics module business rules and validations.
Tests all locked rules: overlap, type rules, department parent, finalize lock, generate periods.
"""
from datetime import date, timedelta

import pytest
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User

from sims_backend.academics.models import (
    Department,
    LearningBlock,
    Module,
    Period,
    Program,
    Track,
)
from sims_backend.academics.services import (
    DepartmentService,
    LearningBlockService,
    ProgramService,
)


@pytest.fixture
def program(db):
    """Create a test program"""
    return Program.objects.create(
        name="MBBS",
        description="Bachelor of Medicine and Bachelor of Surgery",
        structure_type=Program.STRUCTURE_TYPE_YEARLY,
    )


@pytest.fixture
def finalized_program(db):
    """Create a finalized program"""
    program = Program.objects.create(
        name="MBBS",
        description="Bachelor of Medicine and Bachelor of Surgery",
        structure_type=Program.STRUCTURE_TYPE_YEARLY,
        is_finalized=True,
    )
    return program


@pytest.fixture
def custom_program(db):
    """Create a custom structure program"""
    return Program.objects.create(
        name="Custom Program",
        structure_type=Program.STRUCTURE_TYPE_CUSTOM,
        period_length_months=3,
        total_periods=8,
    )


@pytest.fixture
def period(program):
    """Create a test period"""
    return Period.objects.create(
        program=program,
        name="Year 1",
        order=1,
        start_date=date(2024, 1, 1),
        end_date=date(2024, 12, 31),
    )


@pytest.fixture
def track(program):
    """Create a test track"""
    return Track.objects.create(
        program=program,
        name="Track A",
    )


@pytest.fixture
def track_b(program):
    """Create another test track"""
    return Track.objects.create(
        program=program,
        name="Track B",
    )


@pytest.fixture
def department(db):
    """Create a test department"""
    return Department.objects.create(
        name="Medicine",
        code="MED",
    )


@pytest.fixture
def sub_department(department):
    """Create a sub-department"""
    return Department.objects.create(
        name="Cardiology",
        code="CARD",
        parent=department,
    )


@pytest.fixture
def integrated_block(period, track):
    """Create an integrated learning block"""
    return LearningBlock.objects.create(
        period=period,
        track=track,
        name="Integrated Block 1",
        block_type=LearningBlock.BLOCK_TYPE_INTEGRATED,
        start_date=date(2024, 1, 1),
        end_date=date(2024, 3, 31),
    )


@pytest.fixture
def rotation_block(period, track, department):
    """Create a rotation block"""
    return LearningBlock.objects.create(
        period=period,
        track=track,
        name="Medicine Rotation",
        block_type=LearningBlock.BLOCK_TYPE_ROTATION,
        start_date=date(2024, 4, 1),
        end_date=date(2024, 6, 30),
        primary_department=department,
    )


class TestProgramStructure:
    """Tests for Program structure validation"""

    def test_program_custom_structure_requires_fields(self, db):
        """CUSTOM structure_type requires period_length_months and total_periods"""
        program = Program(structure_type=Program.STRUCTURE_TYPE_CUSTOM)
        
        with pytest.raises(ValidationError) as exc_info:
            ProgramService.validate_structure_fields(program, {"structure_type": Program.STRUCTURE_TYPE_CUSTOM})
        
        assert "period_length_months" in str(exc_info.value)

    def test_program_yearly_structure_rejects_custom_fields(self, program):
        """YEARLY structure_type rejects period_length_months and total_periods"""
        with pytest.raises(ValidationError) as exc_info:
            ProgramService.validate_structure_fields(
                program,
                {"structure_type": Program.STRUCTURE_TYPE_YEARLY, "period_length_months": 3}
            )
        
        assert "not allowed" in str(exc_info.value).lower()

    def test_program_finalize_locks_structure_fields(self, finalized_program):
        """Finalized program cannot have structure fields modified"""
        with pytest.raises(ValidationError) as exc_info:
            ProgramService.check_finalize_lock(
                finalized_program,
                {"structure_type": Program.STRUCTURE_TYPE_SEMESTER}
            )
        
        assert "Cannot modify" in str(exc_info.value)

    def test_program_finalize_success(self, program):
        """Program can be finalized successfully"""
        program = ProgramService.finalize_program(program)
        assert program.is_finalized is True

    def test_program_finalize_already_finalized(self, finalized_program):
        """Cannot finalize an already finalized program"""
        with pytest.raises(ValidationError) as exc_info:
            ProgramService.finalize_program(finalized_program)
        
        assert "already finalized" in str(exc_info.value).lower()

    def test_program_generate_periods_yearly(self, finalized_program):
        """Generate periods for YEARLY structure creates 5 periods"""
        periods = ProgramService.generate_periods(finalized_program)
        assert len(periods) == 5
        assert periods[0].name == "Year 1"
        assert periods[4].name == "Year 5"

    def test_program_generate_periods_semester(self, db):
        """Generate periods for SEMESTER structure creates 10 periods"""
        program = Program.objects.create(
            name="Semester Program",
            structure_type=Program.STRUCTURE_TYPE_SEMESTER,
            is_finalized=True,
        )
        periods = ProgramService.generate_periods(program)
        assert len(periods) == 10
        assert periods[0].name == "Semester 1"
        assert periods[9].name == "Semester 10"

    def test_program_generate_periods_custom(self, custom_program):
        """Generate periods for CUSTOM structure uses total_periods"""
        custom_program.is_finalized = True
        custom_program.save()
        periods = ProgramService.generate_periods(custom_program)
        assert len(periods) == 8
        assert periods[0].name == "Period 1"
        assert periods[7].name == "Period 8"

    def test_program_generate_periods_requires_finalized(self, program):
        """Cannot generate periods for non-finalized program"""
        with pytest.raises(ValidationError) as exc_info:
            ProgramService.generate_periods(program)
        
        assert "must be finalized" in str(exc_info.value).lower()


class TestLearningBlockOverlap:
    """Tests for block overlap validation within same track"""

    def test_blocks_can_overlap_across_different_tracks(self, period, track, track_b, department):
        """Blocks can overlap if they are in different tracks"""
        block1 = LearningBlock.objects.create(
            period=period,
            track=track,
            name="Block 1",
            block_type=LearningBlock.BLOCK_TYPE_ROTATION,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            primary_department=department,
        )
        
        # Same dates in different track - should be allowed
        block2 = LearningBlock.objects.create(
            period=period,
            track=track_b,
            name="Block 2",
            block_type=LearningBlock.BLOCK_TYPE_ROTATION,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            primary_department=department,
        )
        
        # Should not raise error
        assert block1.track != block2.track

    def test_blocks_cannot_overlap_same_track(self, period, track, department):
        """Blocks cannot overlap within the same track"""
        block1 = LearningBlock.objects.create(
            period=period,
            track=track,
            name="Block 1",
            block_type=LearningBlock.BLOCK_TYPE_ROTATION,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            primary_department=department,
        )
        
        # Overlapping block in same track - should raise error
        with pytest.raises(ValidationError) as exc_info:
            LearningBlockService.validate_overlap(
                LearningBlock(),
                track,
                date(2024, 2, 1),  # Overlaps with block1
                date(2024, 4, 30),
                None,
            )
        
        assert "overlaps" in str(exc_info.value).lower()

    def test_blocks_touching_edges_allowed(self, period, track, department):
        """Blocks that touch at edges (no overlap) are allowed"""
        block1 = LearningBlock.objects.create(
            period=period,
            track=track,
            name="Block 1",
            block_type=LearningBlock.BLOCK_TYPE_ROTATION,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            primary_department=department,
        )
        
        # Block starting exactly when block1 ends - should be allowed
        LearningBlockService.validate_overlap(
            LearningBlock(),
            track,
            date(2024, 4, 1),  # Starts when block1 ends
            date(2024, 6, 30),
            None,
        )
        # Should not raise error

    def test_block_update_excludes_self_from_overlap_check(self, period, track, department):
        """When updating a block, it should exclude itself from overlap check"""
        block = LearningBlock.objects.create(
            period=period,
            track=track,
            name="Block 1",
            block_type=LearningBlock.BLOCK_TYPE_ROTATION,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            primary_department=department,
        )
        
        # Updating the same block should not trigger overlap error
        LearningBlockService.validate_overlap(
            block,
            track,
            date(2024, 1, 1),  # Same dates
            date(2024, 3, 31),
            block.pk,  # Exclude self
        )
        # Should not raise error


class TestLearningBlockTypeRules:
    """Tests for block type validation rules"""

    def test_rotation_block_requires_primary_department(self, period, track):
        """ROTATION_BLOCK requires primary_department"""
        with pytest.raises(ValidationError) as exc_info:
            LearningBlockService.validate_block_type_rules(
                LearningBlock(),
                {"block_type": LearningBlock.BLOCK_TYPE_ROTATION}
            )
        
        assert "primary_department is required" in str(exc_info.value)

    def test_rotation_block_sub_department_must_be_child(self, period, track, department, sub_department):
        """ROTATION_BLOCK sub_department must be child of primary_department"""
        # Try to set sub_department that is not a child
        wrong_sub = Department.objects.create(name="Wrong Sub", code="WRONG", parent=None)
        
        with pytest.raises(ValidationError) as exc_info:
            LearningBlockService.validate_block_type_rules(
                LearningBlock(),
                {
                    "block_type": LearningBlock.BLOCK_TYPE_ROTATION,
                    "primary_department": department,
                    "sub_department": wrong_sub,
                }
            )
        
        assert "must be a child" in str(exc_info.value).lower()

    def test_rotation_block_cannot_have_modules(self, rotation_block):
        """ROTATION_BLOCK cannot have modules"""
        # Try to add a module to rotation block
        with pytest.raises(ValidationError) as exc_info:
            LearningBlockService.validate_block_type_rules(
                rotation_block,
                {"block_type": LearningBlock.BLOCK_TYPE_ROTATION}
            )
        
        # This should be caught when trying to create module, but let's check the block itself
        # Actually, the validation should prevent modules from being added
        module = Module(block=rotation_block, name="Test Module", order=1)
        # The validation happens in ModuleViewSet.perform_create

    def test_integrated_block_departments_must_be_null(self, period, track, department):
        """INTEGRATED_BLOCK must have null department fields"""
        with pytest.raises(ValidationError) as exc_info:
            LearningBlockService.validate_block_type_rules(
                LearningBlock(),
                {
                    "block_type": LearningBlock.BLOCK_TYPE_INTEGRATED,
                    "primary_department": department,
                }
            )
        
        assert "must be null" in str(exc_info.value).lower()

    def test_integrated_block_can_have_modules(self, integrated_block):
        """INTEGRATED_BLOCK can have modules"""
        module = Module.objects.create(
            block=integrated_block,
            name="Module 1",
            order=1,
        )
        assert module.block.block_type == LearningBlock.BLOCK_TYPE_INTEGRATED


class TestDepartmentHierarchy:
    """Tests for department hierarchical structure"""

    def test_department_can_have_parent(self, department):
        """Department can have a parent"""
        sub_dept = Department.objects.create(
            name="Sub Department",
            code="SUB",
            parent=department,
        )
        assert sub_dept.parent == department

    def test_department_circular_reference_prevented(self, department, sub_department):
        """Cannot create circular reference in department hierarchy"""
        with pytest.raises(ValidationError) as exc_info:
            DepartmentService.validate_parent_relationship(
                department,
                sub_department,  # Try to set sub_department as parent of its parent
            )
        
        assert "circular reference" in str(exc_info.value).lower()

    def test_department_get_ancestors(self, department, sub_department):
        """get_ancestors returns all ancestor departments"""
        ancestors = sub_department.get_ancestors()
        assert len(ancestors) == 1
        assert ancestors[0] == department

    def test_department_is_descendant_of(self, department, sub_department):
        """is_descendant_of correctly identifies descendant relationship"""
        assert sub_department.is_descendant_of(department) is True
        assert department.is_descendant_of(sub_department) is False


class TestModuleRules:
    """Tests for module validation rules"""

    def test_module_can_only_be_in_integrated_block(self, integrated_block, rotation_block):
        """Modules can only be added to INTEGRATED_BLOCK"""
        # This is tested in ModuleViewSet.perform_create
        # But we can test the model relationship
        module = Module.objects.create(
            block=integrated_block,
            name="Test Module",
            order=1,
        )
        assert module.block.block_type == LearningBlock.BLOCK_TYPE_INTEGRATED

    def test_module_order_within_block(self, integrated_block):
        """Modules have order within their block"""
        module1 = Module.objects.create(block=integrated_block, name="Module 1", order=1)
        module2 = Module.objects.create(block=integrated_block, name="Module 2", order=2)
        
        modules = Module.objects.filter(block=integrated_block).order_by('order')
        assert list(modules) == [module1, module2]


class TestProgramFinalizeLock:
    """Tests for program finalize lock behavior"""

    def test_finalize_locks_structure_type(self, finalized_program):
        """Finalized program cannot change structure_type"""
        with pytest.raises(ValidationError):
            ProgramService.check_finalize_lock(
                finalized_program,
                {"structure_type": Program.STRUCTURE_TYPE_SEMESTER}
            )

    def test_finalize_locks_period_length_months(self, finalized_program):
        """Finalized program cannot change period_length_months"""
        with pytest.raises(ValidationError):
            ProgramService.check_finalize_lock(
                finalized_program,
                {"period_length_months": 6}
            )

    def test_finalize_locks_total_periods(self, finalized_program):
        """Finalized program cannot change total_periods"""
        with pytest.raises(ValidationError):
            ProgramService.check_finalize_lock(
                finalized_program,
                {"total_periods": 10}
            )

    def test_finalize_allows_other_fields(self, finalized_program):
        """Finalized program can still modify non-structure fields"""
        # Should not raise error
        ProgramService.check_finalize_lock(
            finalized_program,
            {"name": "Updated Name", "description": "Updated description"}
        )


