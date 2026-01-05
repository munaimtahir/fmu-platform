"""
Service layer for Academics module business logic and validations.
All business rules are enforced here, not in viewsets.
"""
from datetime import date, timedelta
from typing import List, Optional

from django.core.exceptions import ValidationError
from django.db import transaction

from .models import Department, LearningBlock, Module, Period, Program, Track


class ProgramService:
    """Service for Program operations"""

    @staticmethod
    def validate_structure_fields(program: Program, data: dict) -> None:
        """
        Validate structure fields based on structure_type.
        Raises ValidationError if invalid.
        """
        structure_type = data.get("structure_type", program.structure_type)

        if structure_type == Program.STRUCTURE_TYPE_CUSTOM:
            period_length = data.get("period_length_months", program.period_length_months)
            total_periods = data.get("total_periods", program.total_periods)

            if not period_length or period_length <= 0:
                raise ValidationError(
                    "period_length_months is required and must be > 0 for CUSTOM structure_type"
                )
            if not total_periods or total_periods <= 0:
                raise ValidationError(
                    "total_periods is required and must be > 0 for CUSTOM structure_type"
                )
        else:
            # YEARLY and SEMESTER don't need these fields
            if "period_length_months" in data and data["period_length_months"] is not None:
                raise ValidationError(
                    f"period_length_months is not allowed for {structure_type} structure_type"
                )
            if "total_periods" in data and data["total_periods"] is not None:
                raise ValidationError(
                    f"total_periods is not allowed for {structure_type} structure_type"
                )

    @staticmethod
    def check_finalize_lock(program: Program, data: dict) -> None:
        """
        Check if program is finalized and prevent structure field edits.
        Raises ValidationError if trying to edit locked fields.
        """
        if not program.is_finalized:
            return

        locked_fields = [
            "structure_type",
            "period_length_months",
            "total_periods",
        ]

        for field in locked_fields:
            if field in data and data[field] != getattr(program, field):
                raise ValidationError(
                    f"Cannot modify {field} after program is finalized"
                )

    @staticmethod
    @transaction.atomic
    def finalize_program(program: Program) -> Program:
        """
        Finalize a program, locking structure fields.
        Raises ValidationError if program structure is invalid.
        """
        if program.is_finalized:
            raise ValidationError("Program is already finalized")

        # Validate structure fields are set
        if program.structure_type == Program.STRUCTURE_TYPE_CUSTOM:
            if not program.period_length_months or not program.total_periods:
                raise ValidationError(
                    "period_length_months and total_periods must be set before finalizing CUSTOM program"
                )

        program.is_finalized = True
        program.save()
        return program

    @staticmethod
    @transaction.atomic
    def generate_periods(program: Program) -> List[Period]:
        """
        Generate periods for a program based on its structure_type.
        Returns list of created Period objects.
        Raises ValidationError if program is not finalized or structure is invalid.
        """
        if not program.is_finalized:
            raise ValidationError("Program must be finalized before generating periods")

        # Delete existing periods if any
        Period.objects.filter(program=program).delete()

        periods = []

        if program.structure_type == Program.STRUCTURE_TYPE_YEARLY:
            # Generate 5 years by default (can be customized)
            for year in range(1, 6):
                period = Period.objects.create(
                    program=program,
                    name=f"Year {year}",
                    order=year,
                )
                periods.append(period)

        elif program.structure_type == Program.STRUCTURE_TYPE_SEMESTER:
            # Generate 10 semesters (5 years * 2 semesters)
            for sem in range(1, 11):
                period = Period.objects.create(
                    program=program,
                    name=f"Semester {sem}",
                    order=sem,
                )
                periods.append(period)

        elif program.structure_type == Program.STRUCTURE_TYPE_CUSTOM:
            if not program.period_length_months or not program.total_periods:
                raise ValidationError(
                    "period_length_months and total_periods must be set for CUSTOM structure"
                )

            for i in range(1, program.total_periods + 1):
                period = Period.objects.create(
                    program=program,
                    name=f"Period {i}",
                    order=i,
                )
                periods.append(period)

        return periods


class LearningBlockService:
    """Service for LearningBlock operations"""

    @staticmethod
    def validate_block_type_rules(block: LearningBlock, data: dict) -> None:
        """
        Validate block type rules:
        - ROTATION_BLOCK: primary_department required; sub_department must be child of primary; NO modules allowed
        - INTEGRATED_BLOCK: modules allowed; department fields MUST be null
        Raises ValidationError if invalid.
        """
        block_type = data.get("block_type", getattr(block, 'block_type', None))
        primary_dept = data.get("primary_department", getattr(block, 'primary_department', None))
        sub_dept = data.get("sub_department", getattr(block, 'sub_department', None))

        if block_type == LearningBlock.BLOCK_TYPE_ROTATION:
            # ROTATION_BLOCK rules
            if not primary_dept:
                raise ValidationError(
                    "primary_department is required for ROTATION_BLOCK"
                )

            if sub_dept:
                # Check if sub_department is a child of primary_department
                if sub_dept.parent != primary_dept:
                    raise ValidationError(
                        "sub_department must be a child of primary_department"
                    )

            # Check for existing modules (if block exists)
            if hasattr(block, 'pk') and block.pk:
                module_count = Module.objects.filter(block=block).count()
                if module_count > 0:
                    raise ValidationError(
                        "ROTATION_BLOCK cannot have modules. Please remove existing modules first."
                    )

        elif block_type == LearningBlock.BLOCK_TYPE_INTEGRATED:
            # INTEGRATED_BLOCK rules
            if primary_dept is not None:
                raise ValidationError(
                    "primary_department must be null for INTEGRATED_BLOCK"
                )
            if sub_dept is not None:
                raise ValidationError(
                    "sub_department must be null for INTEGRATED_BLOCK"
                )

    @staticmethod
    def validate_overlap(block: LearningBlock, track: Track, start_date: date, end_date: date, exclude_id: Optional[int] = None) -> None:
        """
        Validate that blocks don't overlap within the same track.
        Overlap rule: startA <= endB AND startB <= endA => reject
        Raises ValidationError if overlap detected.
        """
        if start_date > end_date:
            raise ValidationError("start_date must be <= end_date")

        # Find overlapping blocks in the same track
        overlapping = LearningBlock.objects.filter(
            track=track,
            start_date__lte=end_date,
            end_date__gte=start_date,
        )

        if exclude_id:
            overlapping = overlapping.exclude(pk=exclude_id)

        if overlapping.exists():
            overlap_block = overlapping.first()
            raise ValidationError(
                f"Block overlaps with existing block '{overlap_block.name}' "
                f"({overlap_block.start_date} to {overlap_block.end_date}) in the same track"
            )

    @staticmethod
    def validate_parallel_blocks_allowed(track1: Track, track2: Track) -> bool:
        """
        Check if blocks can run in parallel across different tracks.
        Returns True if tracks are different (parallel allowed).
        """
        return track1 != track2


class DepartmentService:
    """Service for Department operations"""

    @staticmethod
    def validate_parent_relationship(department: Department, parent: Optional[Department]) -> None:
        """
        Validate parent department relationship.
        Prevents circular references.
        Raises ValidationError if invalid.
        """
        if not parent:
            return

        # Check for circular reference
        if department.pk:
            # Check if parent is a descendant of this department
            current = parent
            while current:
                if current.pk == department.pk:
                    raise ValidationError("Cannot set parent: would create circular reference")
                current = current.parent

