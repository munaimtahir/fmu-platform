"""
Management command to seed demo data with different workflow scenarios.

Creates 20 students distributed across 8 different workflow stages:
1. ENROLLED_ONLY (3 students)
2. ATTENDANCE_STARTED (4 students)
3. LOW_ATTENDANCE_AT_RISK (3 students)
4. ASSESSMENT_SCORES_PARTIAL (3 students)
5. ASSESSMENT_COMPLETE_RESULTS_DRAFT (3 students)
6. RESULTS_PUBLISHED (2 students)
7. RESULTS_FROZEN (1 student)
8. FEES_VOUCHER_GENERATED (1 student)
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from core.demo_scenarios import DemoScenarioGenerator
from sims_backend.academics.models import AcademicPeriod, Batch, Department, Group
from sims_backend.results.models import ResultHeader


class Command(BaseCommand):
    """Django management command to seed demo scenario data"""

    help = "Seed demo data with students in different workflow stages"

    def add_arguments(self, parser):
        """Add command-line arguments"""
        parser.add_argument(
            "--students",
            type=int,
            default=20,
            help="Number of students to create (default: 20)",
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
            help="Term/Block name (default: Block-1)",
        )
        parser.add_argument(
            "--sections",
            type=int,
            default=3,
            help="Number of sections to create (default: 3)",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing demo data before seeding",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        """Main command handler"""
        num_students = options["students"]
        program_name = options["program"]
        term_name = options["term"]
        num_sections = options["sections"]
        reset = options["reset"]

        if num_students != 20:
            self.stdout.write(
                self.style.WARNING(
                    f"⚠️  Warning: The command is designed for exactly 20 students (8 buckets)."
                    f" You specified {num_students}. Results may not match expected distribution."
                )
            )

        generator = DemoScenarioGenerator(stdout=self.stdout)

        # Reset if requested
        if reset:
            self.stdout.write(self.style.WARNING("🗑️  Resetting demo data..."))
            generator.delete_demo_objects()

        self.stdout.write(self.style.SUCCESS("🚀 Starting demo scenario seeding..."))

        # Step 1: Create or get program
        self.stdout.write("\n📚 Setting up academic structure...")
        program = generator.get_or_create_program(program_name)

        # Step 2: Create or get academic period
        academic_period = generator.get_or_create_academic_period(
            term_name, AcademicPeriod.PERIOD_TYPE_BLOCK
        )

        # Step 3: Get or create batch and groups
        batch, _ = Batch.objects.get_or_create(
            program=program,
            name=f"{program_name} {academic_period.start_date.year if academic_period.start_date else date.today().year} Batch",
            defaults={"start_year": academic_period.start_date.year if academic_period.start_date else date.today().year},
        )

        groups = []
        for i in range(min(3, num_sections)):
            group_letter = chr(65 + i)  # A, B, C
            group, _ = Group.objects.get_or_create(
                batch=batch,
                name=f"Group {group_letter}",
            )
            groups.append(group)

        self.stdout.write(f"  ✓ Using batch: {batch.name}")
        self.stdout.write(f"  ✓ Using {len(groups)} groups")

        # Step 4: Create departments if needed
        departments = list(Department.objects.all()[:3])
        if not departments:
            for dept_data in [
                {"name": "Anatomy", "code": "ANAT"},
                {"name": "Physiology", "code": "PHYS"},
                {"name": "Biochemistry", "code": "BIOCHEM"},
            ]:
                dept, _ = Department.objects.get_or_create(
                    code=dept_data["code"], defaults=dept_data
                )
                departments.append(dept)
            self.stdout.write(f"  ✓ Created {len(departments)} departments")

        # Step 5: Create faculty users
        self.stdout.write("\n👨‍🏫 Creating faculty...")
        faculty_users = generator.create_demo_faculty(num_faculty=2)

        # Step 6: Create courses
        self.stdout.write("\n📖 Creating courses...")
        courses = generator.create_demo_courses(academic_period, num_courses=3)

        # Step 7: Create sections
        self.stdout.write("\n🏫 Creating sections...")
        sections = generator.create_demo_sections(
            courses, academic_period, faculty_users, groups, num_sections=num_sections
        )

        # Step 8: Create students
        self.stdout.write(f"\n👥 Creating {num_students} students...")
        students, student_logins = generator.create_demo_students(
            program, batch, groups, num_students=num_students
        )

        # Step 9: Enroll all students
        self.stdout.write("\n📝 Enrolling students in sections...")
        enrollments = generator.enroll_students_in_sections(students, sections, term_name)

        # Step 10: Create sessions for attendance
        self.stdout.write("\n🗓️  Creating timetable sessions...")
        sessions = generator.create_sessions_for_period(
            academic_period, groups, faculty_users, departments, num_sessions=5
        )
        self.stdout.write(f"  ✓ Created {len(sessions)} sessions")

        # Step 11: Distribute students into scenario buckets
        self.stdout.write("\n🎯 Distributing students into scenario buckets...")

        # Bucket 1: ENROLLED_ONLY (3 students) - No attendance, no scores
        bucket1_students = students[0:3]
        self.stdout.write(f"  ✓ Bucket 1 (ENROLLED_ONLY): {len(bucket1_students)} students")

        # Bucket 2: ATTENDANCE_STARTED (4 students) - 3-5 sessions marked
        bucket2_students = students[3:7]
        for student in bucket2_students:
            num_sessions_to_mark = 4  # Mark 4 out of 5 sessions
            sessions_to_mark = sessions[:num_sessions_to_mark]
            generator.create_attendance_records(
                [student], sessions_to_mark, attendance_percentage=75
            )
        self.stdout.write(f"  ✓ Bucket 2 (ATTENDANCE_STARTED): {len(bucket2_students)} students")

        # Bucket 3: LOW_ATTENDANCE_AT_RISK (3 students) - < 70% attendance
        bucket3_students = students[7:10]
        for student in bucket3_students:
            generator.create_attendance_records(
                [student], sessions, attendance_percentage=65
            )
        self.stdout.write(f"  ✓ Bucket 3 (LOW_ATTENDANCE_AT_RISK): {len(bucket3_students)} students")

        # Bucket 4: ASSESSMENT_SCORES_PARTIAL (3 students) - Quiz scores only
        bucket4_students = students[10:13]
        for student in bucket4_students:
            generator.create_attendance_records(
                [student], sessions, attendance_percentage=85
            )
        generator.create_assessment_scores(bucket4_students, sections, score_range=(70, 90))
        self.stdout.write(
            f"  ✓ Bucket 4 (ASSESSMENT_SCORES_PARTIAL): {len(bucket4_students)} students"
        )

        # Bucket 5: ASSESSMENT_COMPLETE_RESULTS_DRAFT (3 students)
        bucket5_students = students[13:16]
        for student in bucket5_students:
            generator.create_attendance_records(
                [student], sessions, attendance_percentage=90
            )
        generator.create_assessment_scores(bucket5_students, sections, score_range=(75, 95))
        generator.create_exam_and_results(
            bucket5_students,
            academic_period,
            departments[0],
            ResultHeader.STATUS_DRAFT,
        )
        self.stdout.write(
            f"  ✓ Bucket 5 (ASSESSMENT_COMPLETE_RESULTS_DRAFT): {len(bucket5_students)} students"
        )

        # Bucket 6: RESULTS_PUBLISHED (2 students)
        bucket6_students = students[16:18]
        for student in bucket6_students:
            generator.create_attendance_records(
                [student], sessions, attendance_percentage=92
            )
        generator.create_assessment_scores(bucket6_students, sections, score_range=(80, 95))
        generator.create_exam_and_results(
            bucket6_students,
            academic_period,
            departments[0],
            ResultHeader.STATUS_PUBLISHED,
        )
        self.stdout.write(
            f"  ✓ Bucket 6 (RESULTS_PUBLISHED): {len(bucket6_students)} students"
        )

        # Bucket 7: RESULTS_FROZEN (1 student)
        bucket7_students = students[18:19]
        for student in bucket7_students:
            generator.create_attendance_records(
                [student], sessions, attendance_percentage=95
            )
        generator.create_assessment_scores(bucket7_students, sections, score_range=(85, 98))
        generator.create_exam_and_results(
            bucket7_students,
            academic_period,
            departments[0],
            ResultHeader.STATUS_FROZEN,
        )
        self.stdout.write(
            f"  ✓ Bucket 7 (RESULTS_FROZEN): {len(bucket7_students)} students"
        )

        # Bucket 8: FEES_VOUCHER_GENERATED (1 student)
        bucket8_students = students[19:20]
        for student in bucket8_students:
            generator.create_attendance_records(
                [student], sessions, attendance_percentage=88
            )
        generator.create_assessment_scores(bucket8_students, sections, score_range=(75, 90))
        generator.create_exam_and_results(
            bucket8_students,
            academic_period,
            departments[0],
            ResultHeader.STATUS_PUBLISHED,
        )
        for student in bucket8_students:
            generator.create_fee_voucher(student, academic_period)
        self.stdout.write(
            f"  ✓ Bucket 8 (FEES_VOUCHER_GENERATED): {len(bucket8_students)} students"
        )

        # Print summary
        self._print_summary(
            program,
            academic_period,
            courses,
            sections,
            faculty_users,
            student_logins,
            bucket1_students,
            bucket2_students,
            bucket3_students,
            bucket4_students,
            bucket5_students,
            bucket6_students,
            bucket7_students,
            bucket8_students,
        )

    def _print_summary(
        self,
        program,
        term,
        courses,
        sections,
        faculty_users,
        student_logins,
        *buckets,
    ):
        """Print a formatted summary of created data"""
        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("✅ DEMO DATA SEEDING COMPLETE"))
        self.stdout.write("=" * 80)

        self.stdout.write("\n📊 SUMMARY:")
        self.stdout.write(f"  • Program: {program.name}")
        self.stdout.write(f"  • Term: {term.name}")
        self.stdout.write(f"  • Courses: {len(courses)}")
        self.stdout.write(f"  • Sections: {len(sections)}")
        self.stdout.write(f"  • Faculty: {len(faculty_users)}")
        self.stdout.write(f"  • Total Students: {len(student_logins)}")

        self.stdout.write("\n👨‍🏫 FACULTY CREDENTIALS:")
        for faculty in faculty_users:
            self.stdout.write(f"  • {faculty.username} / faculty123")

        self.stdout.write("\n👥 STUDENT DISTRIBUTION BY SCENARIO:")
        bucket_names = [
            "ENROLLED_ONLY",
            "ATTENDANCE_STARTED",
            "LOW_ATTENDANCE_AT_RISK",
            "ASSESSMENT_SCORES_PARTIAL",
            "ASSESSMENT_COMPLETE_RESULTS_DRAFT",
            "RESULTS_PUBLISHED",
            "RESULTS_FROZEN",
            "FEES_VOUCHER_GENERATED",
        ]

        for i, (bucket_name, bucket_students) in enumerate(zip(bucket_names, buckets), 1):
            self.stdout.write(f"\n  {i}. {bucket_name} ({len(bucket_students)} students):")
            for student in bucket_students:
                login = next(
                    (s for s in student_logins if s["reg_no"] == student.reg_no), None
                )
                if login:
                    self.stdout.write(
                        f"     • {student.reg_no} - {student.name} ({login['username']} / {login['password']})"
                    )

        self.stdout.write("\n" + "=" * 80)
        self.stdout.write(self.style.SUCCESS("🎉 Ready to debug and showcase!"))
        self.stdout.write("=" * 80)

        self.stdout.write("\n💡 QUICK START:")
        self.stdout.write("  • Admin: http://localhost:8010/admin")
        self.stdout.write("  • API: http://localhost:8010/api")
        self.stdout.write(
            "  • To reset: python manage.py seed_demo_scenarios --reset --students 20"
        )
        self.stdout.write("\n")
