"""
Management command to seed demo data for Academics module.
Creates MBBS program with 5 periods, 2 tracks, parallel blocks, modules, and departments.
"""
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from sims_backend.academics.models import (
    Department,
    LearningBlock,
    Module,
    Period,
    Program,
    Track,
)
from sims_backend.academics.services import ProgramService


class Command(BaseCommand):
    help = "Seed demo data for Academics module (MBBS program)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Academics demo data...")

        with transaction.atomic():
            # Create departments hierarchy
            self.stdout.write("Creating departments...")
            medicine = Department.objects.create(
                name="Medicine",
                code="MED",
                description="Department of Medicine",
            )
            surgery = Department.objects.create(
                name="Surgery",
                code="SURG",
                description="Department of Surgery",
            )
            pediatrics = Department.objects.create(
                name="Pediatrics",
                code="PEDS",
                description="Department of Pediatrics",
            )
            cardiology = Department.objects.create(
                name="Cardiology",
                code="CARD",
                description="Cardiology Department",
                parent=medicine,
            )
            orthopedics = Department.objects.create(
                name="Orthopedics",
                code="ORTHO",
                description="Orthopedics Department",
                parent=surgery,
            )
            self.stdout.write(self.style.SUCCESS(f"Created {Department.objects.count()} departments"))

            # Create MBBS program
            self.stdout.write("Creating MBBS program...")
            program = Program.objects.create(
                name="MBBS",
                description="Bachelor of Medicine and Bachelor of Surgery",
                structure_type=Program.STRUCTURE_TYPE_YEARLY,
                is_active=True,
            )
            self.stdout.write(self.style.SUCCESS(f"Created program: {program.name}"))

            # Finalize program
            self.stdout.write("Finalizing program...")
            program = ProgramService.finalize_program(program)
            self.stdout.write(self.style.SUCCESS("Program finalized"))

            # Generate periods
            self.stdout.write("Generating periods...")
            periods = ProgramService.generate_periods(program)
            self.stdout.write(self.style.SUCCESS(f"Generated {len(periods)} periods"))

            # Create tracks
            self.stdout.write("Creating tracks...")
            track_a = Track.objects.create(
                program=program,
                name="Track A",
                description="Primary clinical track",
            )
            track_b = Track.objects.create(
                program=program,
                name="Track B",
                description="Alternative clinical track",
            )
            self.stdout.write(self.style.SUCCESS(f"Created {Track.objects.count()} tracks"))

            # Create learning blocks
            self.stdout.write("Creating learning blocks...")
            
            # Year 1 - Integrated blocks
            period1 = periods[0]
            integrated1 = LearningBlock.objects.create(
                period=period1,
                track=track_a,
                name="Foundation Sciences",
                block_type=LearningBlock.BLOCK_TYPE_INTEGRATED,
                start_date=date(2024, 1, 1),
                end_date=date(2024, 6, 30),
            )
            
            # Add modules to integrated block
            Module.objects.create(
                block=integrated1,
                name="Anatomy",
                description="Human anatomy fundamentals",
                order=1,
            )
            Module.objects.create(
                block=integrated1,
                name="Physiology",
                description="Human physiology fundamentals",
                order=2,
            )
            Module.objects.create(
                block=integrated1,
                name="Biochemistry",
                description="Biochemistry fundamentals",
                order=3,
            )

            # Parallel block in Track B
            integrated1b = LearningBlock.objects.create(
                period=period1,
                track=track_b,
                name="Foundation Sciences",
                block_type=LearningBlock.BLOCK_TYPE_INTEGRATED,
                start_date=date(2024, 1, 1),
                end_date=date(2024, 6, 30),
            )
            Module.objects.create(
                block=integrated1b,
                name="Anatomy",
                order=1,
            )
            Module.objects.create(
                block=integrated1b,
                name="Physiology",
                order=2,
            )

            # Year 2 - Rotation blocks
            period2 = periods[1]
            rotation1 = LearningBlock.objects.create(
                period=period2,
                track=track_a,
                name="Medicine Rotation",
                block_type=LearningBlock.BLOCK_TYPE_ROTATION,
                start_date=date(2025, 1, 1),
                end_date=date(2025, 3, 31),
                primary_department=medicine,
                sub_department=cardiology,
            )

            rotation2 = LearningBlock.objects.create(
                period=period2,
                track=track_a,
                name="Surgery Rotation",
                block_type=LearningBlock.BLOCK_TYPE_ROTATION,
                start_date=date(2025, 4, 1),
                end_date=date(2025, 6, 30),
                primary_department=surgery,
                sub_department=orthopedics,
            )

            # Parallel rotation in Track B
            rotation1b = LearningBlock.objects.create(
                period=period2,
                track=track_b,
                name="Medicine Rotation",
                block_type=LearningBlock.BLOCK_TYPE_ROTATION,
                start_date=date(2025, 1, 1),
                end_date=date(2025, 3, 31),
                primary_department=medicine,
            )

            # Year 3 - Mixed blocks
            period3 = periods[2]
            integrated2 = LearningBlock.objects.create(
                period=period3,
                track=track_a,
                name="Clinical Integration",
                block_type=LearningBlock.BLOCK_TYPE_INTEGRATED,
                start_date=date(2026, 1, 1),
                end_date=date(2026, 6, 30),
            )
            Module.objects.create(
                block=integrated2,
                name="Pathology",
                order=1,
            )
            Module.objects.create(
                block=integrated2,
                name="Pharmacology",
                order=2,
            )

            rotation3 = LearningBlock.objects.create(
                period=period3,
                track=track_a,
                name="Pediatrics Rotation",
                block_type=LearningBlock.BLOCK_TYPE_ROTATION,
                start_date=date(2026, 7, 1),
                end_date=date(2026, 9, 30),
                primary_department=pediatrics,
            )

            # Year 4 & 5 - More rotations
            period4 = periods[3]
            period5 = periods[4]

            LearningBlock.objects.create(
                period=period4,
                track=track_a,
                name="Advanced Medicine Rotation",
                block_type=LearningBlock.BLOCK_TYPE_ROTATION,
                start_date=date(2027, 1, 1),
                end_date=date(2027, 6, 30),
                primary_department=medicine,
            )

            LearningBlock.objects.create(
                period=period5,
                track=track_a,
                name="Final Year Rotation",
                block_type=LearningBlock.BLOCK_TYPE_ROTATION,
                start_date=date(2028, 1, 1),
                end_date=date(2028, 6, 30),
                primary_department=surgery,
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Created {LearningBlock.objects.count()} learning blocks"
                )
            )
            self.stdout.write(
                self.style.SUCCESS(f"Created {Module.objects.count()} modules")
            )

        self.stdout.write(
            self.style.SUCCESS("\n✅ Academics demo data seeded successfully!")
        )
        self.stdout.write("\nSummary:")
        self.stdout.write(f"  - Programs: {Program.objects.count()}")
        self.stdout.write(f"  - Periods: {Period.objects.count()}")
        self.stdout.write(f"  - Tracks: {Track.objects.count()}")
        self.stdout.write(f"  - Learning Blocks: {LearningBlock.objects.count()}")
        self.stdout.write(f"  - Modules: {Module.objects.count()}")
        self.stdout.write(f"  - Departments: {Department.objects.count()}")


