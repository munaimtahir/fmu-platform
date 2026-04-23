import pytest
from django.core.exceptions import ValidationError
from datetime import date
from sims_backend.academics.models import Program, Period, Track, LearningBlock, Department, Module
from sims_backend.academics.services import ProgramService, LearningBlockService, DepartmentService

@pytest.mark.django_db
class TestAcademicsServices:
    def test_program_structure_validation_custom(self):
        program = Program(name="Custom Program", structure_type=Program.STRUCTURE_TYPE_CUSTOM)
        # Missing fields should raise ValidationError
        with pytest.raises(ValidationError):
            ProgramService.validate_structure_fields(program, {"structure_type": Program.STRUCTURE_TYPE_CUSTOM})
        
        # Correct fields should pass
        ProgramService.validate_structure_fields(program, {
            "structure_type": Program.STRUCTURE_TYPE_CUSTOM,
            "period_length_months": 6,
            "total_periods": 10
        })

    def test_program_structure_validation_yearly_disallow_custom_fields(self):
        program = Program(name="Yearly Program", structure_type=Program.STRUCTURE_TYPE_YEARLY)
        with pytest.raises(ValidationError):
            ProgramService.validate_structure_fields(program, {
                "structure_type": Program.STRUCTURE_TYPE_YEARLY,
                "period_length_months": 6
            })

    def test_finalize_program_locks_fields(self):
        program = Program.objects.create(name="Locked Program", structure_type=Program.STRUCTURE_TYPE_YEARLY)
        ProgramService.finalize_program(program)
        assert program.is_finalized
        
        with pytest.raises(ValidationError):
            ProgramService.check_finalize_lock(program, {"structure_type": Program.STRUCTURE_TYPE_SEMESTER})
        
        with pytest.raises(ValidationError):
            ProgramService.finalize_program(program)

    def test_generate_periods_yearly(self):
        program = Program.objects.create(name="Yearly", structure_type=Program.STRUCTURE_TYPE_YEARLY)
        ProgramService.finalize_program(program)
        periods = ProgramService.generate_periods(program)
        assert len(periods) == 5
        assert Period.objects.filter(program=program).count() == 5

    def test_generate_periods_semester(self):
        program = Program.objects.create(name="Semester", structure_type=Program.STRUCTURE_TYPE_SEMESTER)
        ProgramService.finalize_program(program)
        periods = ProgramService.generate_periods(program)
        assert len(periods) == 10

    def test_generate_periods_custom(self):
        program = Program.objects.create(
            name="Custom", 
            structure_type=Program.STRUCTURE_TYPE_CUSTOM,
            period_length_months=4,
            total_periods=8
        )
        ProgramService.finalize_program(program)
        periods = ProgramService.generate_periods(program)
        assert len(periods) == 8

    def test_learning_block_rotation_rules(self):
        dept1 = Department.objects.create(name="Surgery")
        dept2 = Department.objects.create(name="General Surgery", parent=dept1)
        dept3 = Department.objects.create(name="Cardiology")
        
        block = LearningBlock(name="Rotation", block_type=LearningBlock.BLOCK_TYPE_ROTATION)
        
        # Missing primary dept
        with pytest.raises(ValidationError, match="primary_department is required"):
            LearningBlockService.validate_block_type_rules(block, {"block_type": LearningBlock.BLOCK_TYPE_ROTATION})
            
        # Wrong sub dept parent
        with pytest.raises(ValidationError, match="sub_department must be a child"):
            LearningBlockService.validate_block_type_rules(block, {
                "block_type": LearningBlock.BLOCK_TYPE_ROTATION,
                "primary_department": dept1,
                "sub_department": dept3
            })

    def test_learning_block_integrated_rules(self):
        dept1 = Department.objects.create(name="Surgery")
        block = LearningBlock(name="Integrated", block_type=LearningBlock.BLOCK_TYPE_INTEGRATED)
        
        with pytest.raises(ValidationError, match="primary_department must be null"):
            LearningBlockService.validate_block_type_rules(block, {
                "block_type": LearningBlock.BLOCK_TYPE_INTEGRATED,
                "primary_department": dept1
            })

    def test_learning_block_overlap(self):
        program = Program.objects.create(name="P")
        period = Period.objects.create(program=program, name="P1", order=1)
        track = Track.objects.create(program=program, name="T1")
        
        LearningBlock.objects.create(
            track=track, period=period, name="B1", 
            start_date=date(2024, 1, 1), 
            end_date=date(2024, 1, 31)
        )
        
        new_block = LearningBlock(track=track, name="B2")
        
        # Exact overlap
        with pytest.raises(ValidationError, match="overlaps"):
            LearningBlockService.validate_overlap(new_block, track, date(2024, 1, 15), date(2024, 2, 1))

    def test_department_circular_reference(self):
        d1 = Department.objects.create(name="D1")
        d2 = Department.objects.create(name="D2", parent=d1)
        
        with pytest.raises(ValidationError, match="circular reference"):
            DepartmentService.validate_parent_relationship(d1, d2)
