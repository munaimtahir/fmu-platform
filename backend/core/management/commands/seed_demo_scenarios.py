"""
Management command to seed demo scenarios with students in different workflow stages.

This command creates students and places them into different stages:
- ENROLLED_ONLY: enrollment exists, no attendance, no scores
- ATTENDANCE_STARTED: attendance marked 3-5 sessions
- LOW_ATTENDANCE_AT_RISK: attendance < threshold (60-74%)
- ASSESSMENT_SCORES_PARTIAL: quiz scores entered, midterm missing
- ASSESSMENT_COMPLETE_RESULTS_DRAFT: all scores entered, result in draft
- RESULTS_PUBLISHED: published results visible to student
- RESULTS_FROZEN: frozen results (using VERIFIED status as proxy)
- FEES_VOUCHER_GENERATED: voucher generated (unpaid)
"""

from decimal import Decimal
from typing import Dict, List

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from core.demo_scenarios import (
    create_attendance_for_student,
    create_challan_for_student,
    create_demo_exam,
    create_demo_sessions,
    create_demo_student_with_user,
    create_result_for_student,
    delete_demo_objects,
    get_or_create_demo_academic_period,
    get_or_create_demo_batch,
    get_or_create_demo_departments,
    get_or_create_demo_groups,
    get_or_create_demo_program,
)
from sims_backend.results.models import ResultHeader

User = get_user_model()
fake = Faker()


class Command(BaseCommand):
    help = "Seed demo scenarios with students in different workflow stages"

    def add_arguments(self, parser):
        parser.add_argument(
            "--students",
            type=int,
            default=20,
            help="Total number of students to create (default: 20)",
        )
        parser.add_argument(
            "--program",
            type=str,
            default="MBBS",
            help="Program name (default: MBBS)",
        )
        parser.add_argument(
            "--term",
            type=str,
            default="Block-1",
            help="Academic period/term name (default: Block-1)",
        )
        parser.add_argument(
            "--sections",
            type=int,
            default=3,
            help="Number of sections/groups (default: 3)",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing demo objects before creating new ones",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        num_students = options["students"]
        program_name = options["program"]
        term_name = options["term"]
        num_sections = options["sections"]
        reset = options["reset"]

        if reset:
            self.stdout.write(self.style.WARNING("Deleting existing demo objects..."))
            delete_demo_objects()
            self.stdout.write(self.style.SUCCESS("  ✓ Demo objects deleted"))

        self.stdout.write(self.style.SUCCESS("Creating demo scenarios..."))

        # Create academic structure
        program = get_or_create_demo_program(program_name)
        batch = get_or_create_demo_batch(program)
        academic_period = get_or_create_demo_academic_period(term_name)
        departments = get_or_create_demo_departments()
        groups = get_or_create_demo_groups(batch, num_sections)

        self.stdout.write(f"  ✓ Program: {program.name}")
        self.stdout.write(f"  ✓ Batch: {batch.name}")
        self.stdout.write(f"  ✓ Academic Period: {academic_period.name}")
        self.stdout.write(f"  ✓ Groups: {len(groups)}")

        # Create faculty users
        faculty_users = self._get_or_create_faculty_users(departments)

        # Create sessions for attendance
        sessions = create_demo_sessions(academic_period, groups, departments, faculty_users, count_per_group=10)
        self.stdout.write(f"  ✓ Created {len(sessions)} sessions")

        # Create exams
        midterm_exam = create_demo_exam(
            academic_period, departments[0], "Midterm Exam", "Midterm"
        )
        quiz_exam = create_demo_exam(
            academic_period, departments[0], "Quiz 1", "Quiz"
        )
        self.stdout.write(f"  ✓ Created exams: {midterm_exam.title}, {quiz_exam.title}")

        # Define scenario buckets with counts
        scenario_counts = {
            "ENROLLED_ONLY": 3,
            "ATTENDANCE_STARTED": 4,
            "LOW_ATTENDANCE_AT_RISK": 3,
            "ASSESSMENT_SCORES_PARTIAL": 3,
            "ASSESSMENT_COMPLETE_RESULTS_DRAFT": 3,
            "RESULTS_PUBLISHED": 2,
            "RESULTS_FROZEN": 1,
            "FEES_VOUCHER_GENERATED": 1,
        }

        total_required = sum(scenario_counts.values())
        if num_students < total_required:
            self.stdout.write(
                self.style.WARNING(
                    f"Warning: {num_students} students requested but {total_required} required. "
                    f"Creating {total_required} students instead."
                )
            )
            num_students = total_required

        # Create students and assign to scenarios
        students_by_scenario = self._create_students_in_scenarios(
            num_students,
            program,
            batch,
            groups,
            scenario_counts,
            sessions,
            midterm_exam,
            quiz_exam,
            academic_period,
        )

        # Print summary
        self._print_summary(
            program,
            batch,
            academic_period,
            groups,
            faculty_users,
            students_by_scenario,
        )

    def _get_or_create_faculty_users(self, departments):
        """Get or create faculty users."""
        from django.contrib.auth.models import Group as AuthGroup

        faculty_group, _ = AuthGroup.objects.get_or_create(name="Faculty")
        faculty_users = []

        for i in range(2):
            username = f"demofaculty{i+1}"
            email = f"{username}@sims.edu"
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": fake.first_name(),
                    "last_name": fake.last_name(),
                }
            )
            if created:
                user.set_password("faculty123")
                user.save()
                user.groups.add(faculty_group)
            faculty_users.append(user)

        return faculty_users

    def _create_students_in_scenarios(
        self,
        num_students: int,
        program,
        batch,
        groups: List,
        scenario_counts: Dict[str, int],
        sessions: List,
        midterm_exam,
        quiz_exam,
        academic_period,
    ) -> Dict[str, List]:
        """Create students and assign them to different scenario buckets."""
        students_by_scenario = {key: [] for key in scenario_counts.keys()}
        student_counter = 0

        # ENROLLED_ONLY (3 students)
        for i in range(scenario_counts["ENROLLED_ONLY"]):
            student_counter += 1
            reg_no = f"DEMO-{batch.start_year}-{program_name_short(program.name)}-{student_counter:03d}"
            name = fake.name()
            group = groups[student_counter % len(groups)]
            student, user = create_demo_student_with_user(
                reg_no, name, program, batch, group
            )
            students_by_scenario["ENROLLED_ONLY"].append((student, user))

        # ATTENDANCE_STARTED (4 students)
        for i in range(scenario_counts["ATTENDANCE_STARTED"]):
            student_counter += 1
            reg_no = f"DEMO-{batch.start_year}-{program_name_short(program.name)}-{student_counter:03d}"
            name = fake.name()
            group = groups[student_counter % len(groups)]
            student, user = create_demo_student_with_user(
                reg_no, name, program, batch, group
            )
            # Mark 3-5 sessions with mixed present/absent
            present_count = 3 + (i % 3)  # 3, 4, or 5
            create_attendance_for_student(student, sessions, present_count, total_sessions=5)
            students_by_scenario["ATTENDANCE_STARTED"].append((student, user))

        # LOW_ATTENDANCE_AT_RISK (3 students)
        for i in range(scenario_counts["LOW_ATTENDANCE_AT_RISK"]):
            student_counter += 1
            reg_no = f"DEMO-{batch.start_year}-{program_name_short(program.name)}-{student_counter:03d}"
            name = fake.name()
            group = groups[student_counter % len(groups)]
            student, user = create_demo_student_with_user(
                reg_no, name, program, batch, group
            )
            # Mark attendance with 60-74% (low attendance)
            total_sessions = 10
            present_count = 6 + i  # 6, 7, or 8 out of 10 (60%, 70%, 80% - but we'll use 6-7 for <75%)
            create_attendance_for_student(student, sessions, present_count, total_sessions=total_sessions)
            students_by_scenario["LOW_ATTENDANCE_AT_RISK"].append((student, user))

        # ASSESSMENT_SCORES_PARTIAL (3 students) - quiz scores only
        for i in range(scenario_counts["ASSESSMENT_SCORES_PARTIAL"]):
            student_counter += 1
            reg_no = f"DEMO-{batch.start_year}-{program_name_short(program.name)}-{student_counter:03d}"
            name = fake.name()
            group = groups[student_counter % len(groups)]
            student, user = create_demo_student_with_user(
                reg_no, name, program, batch, group
            )
            # Create quiz result only (no midterm)
            create_result_for_student(student, quiz_exam, ResultHeader.STATUS_DRAFT, marks_percentage=70.0)
            students_by_scenario["ASSESSMENT_SCORES_PARTIAL"].append((student, user))

        # ASSESSMENT_COMPLETE_RESULTS_DRAFT (3 students)
        for i in range(scenario_counts["ASSESSMENT_COMPLETE_RESULTS_DRAFT"]):
            student_counter += 1
            reg_no = f"DEMO-{batch.start_year}-{program_name_short(program.name)}-{student_counter:03d}"
            name = fake.name()
            group = groups[student_counter % len(groups)]
            student, user = create_demo_student_with_user(
                reg_no, name, program, batch, group
            )
            # Create both quiz and midterm results in DRAFT
            create_result_for_student(student, quiz_exam, ResultHeader.STATUS_DRAFT, marks_percentage=75.0)
            create_result_for_student(student, midterm_exam, ResultHeader.STATUS_DRAFT, marks_percentage=80.0)
            students_by_scenario["ASSESSMENT_COMPLETE_RESULTS_DRAFT"].append((student, user))

        # RESULTS_PUBLISHED (2 students)
        for i in range(scenario_counts["RESULTS_PUBLISHED"]):
            student_counter += 1
            reg_no = f"DEMO-{batch.start_year}-{program_name_short(program.name)}-{student_counter:03d}"
            name = fake.name()
            group = groups[student_counter % len(groups)]
            student, user = create_demo_student_with_user(
                reg_no, name, program, batch, group
            )
            # Create published results
            create_result_for_student(student, midterm_exam, ResultHeader.STATUS_PUBLISHED, marks_percentage=85.0)
            students_by_scenario["RESULTS_PUBLISHED"].append((student, user))

        # RESULTS_FROZEN (1 student) - using VERIFIED as proxy for frozen
        for i in range(scenario_counts["RESULTS_FROZEN"]):
            student_counter += 1
            reg_no = f"DEMO-{batch.start_year}-{program_name_short(program.name)}-{student_counter:03d}"
            name = fake.name()
            group = groups[student_counter % len(groups)]
            student, user = create_demo_student_with_user(
                reg_no, name, program, batch, group
            )
            # Create verified result (as proxy for frozen - system doesn't have frozen status)
            create_result_for_student(student, midterm_exam, ResultHeader.STATUS_VERIFIED, marks_percentage=90.0)
            students_by_scenario["RESULTS_FROZEN"].append((student, user))

        # FEES_VOUCHER_GENERATED (1 student)
        for i in range(scenario_counts["FEES_VOUCHER_GENERATED"]):
            student_counter += 1
            reg_no = f"DEMO-{batch.start_year}-{program_name_short(program.name)}-{student_counter:03d}"
            name = fake.name()
            group = groups[student_counter % len(groups)]
            student, user = create_demo_student_with_user(
                reg_no, name, program, batch, group
            )
            # Create challan
            create_challan_for_student(student, academic_period, amount=Decimal("50000.00"))
            students_by_scenario["FEES_VOUCHER_GENERATED"].append((student, user))

        return students_by_scenario

    def _print_summary(
        self,
        program,
        batch,
        academic_period,
        groups,
        faculty_users,
        students_by_scenario: Dict[str, List],
    ):
        """Print a summary of created data."""
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("✅ DEMO SCENARIOS CREATED SUCCESSFULLY"))
        self.stdout.write("=" * 80)

        self.stdout.write("\n📚 ACADEMIC STRUCTURE:")
        self.stdout.write(f"  Program: {program.name}")
        self.stdout.write(f"  Batch: {batch.name}")
        self.stdout.write(f"  Academic Period: {academic_period.name}")
        self.stdout.write(f"  Groups/Sections: {', '.join(g.name for g in groups)}")

        self.stdout.write(f"\n👨‍🏫 FACULTY USERS:")
        for user in faculty_users:
            self.stdout.write(f"  - {user.username} ({user.email}) - Password: faculty123")

        self.stdout.write("\n👥 STUDENTS BY SCENARIO:")
        total_students = 0
        for scenario_name, students in students_by_scenario.items():
            count = len(students)
            total_students += count
            self.stdout.write(f"\n  {scenario_name} ({count} students):")
            for student, user in students:
                password = f"student{student.reg_no.split('-')[1]}"
                self.stdout.write(f"    - {student.reg_no}: {student.name}")
                self.stdout.write(f"      Username: {user.username} | Password: {password}")

        self.stdout.write(f"\n📊 TOTAL: {total_students} students created")

        self.stdout.write("\n🔗 KEY ENDPOINTS:")
        self.stdout.write("  - Admin: http://localhost:8000/admin/")
        self.stdout.write("  - API: http://localhost:8000/api/")
        self.stdout.write("  - Students API: http://localhost:8000/api/students/")
        self.stdout.write("  - Results API: http://localhost:8000/api/results/")
        self.stdout.write("  - Finance API: http://localhost:8000/api/finance/")

        self.stdout.write("\n" + "=" * 80)


def program_name_short(program_name: str) -> str:
    """Extract short program name (e.g., 'MBBS' from 'DEMO_MBBS')."""
    if program_name.startswith("DEMO_"):
        return program_name[5:]
    return program_name[:4].upper()
