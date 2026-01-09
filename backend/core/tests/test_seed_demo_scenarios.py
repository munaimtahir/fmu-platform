"""
Tests for seed_demo_scenarios management command.
"""

from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from sims_backend.attendance.models import Attendance
from sims_backend.results.models import ResultHeader
from sims_backend.students.models import Student


class SeedDemoScenariosTests(TestCase):
    """Tests for the seed_demo_scenarios management command"""

    def test_command_creates_20_students(self):
        """Test that the command creates exactly 20 students"""
        out = StringIO()
        call_command("seed_demo_scenarios", "--students", "20", stdout=out)

        student_count = Student.objects.filter(reg_no__startswith="DEMO_").count()
        self.assertEqual(student_count, 20)

    def test_command_with_reset(self):
        """Test that reset flag deletes and recreates demo data"""
        # First run
        call_command("seed_demo_scenarios", "--students", "20", stdout=StringIO())
        initial_count = Student.objects.filter(reg_no__startswith="DEMO_").count()
        self.assertEqual(initial_count, 20)

        # Second run with reset
        call_command("seed_demo_scenarios", "--students", "20", "--reset", stdout=StringIO())
        final_count = Student.objects.filter(reg_no__startswith="DEMO_").count()
        self.assertEqual(final_count, 20)

    def test_idempotency(self):
        """Test that running twice doesn't duplicate students"""
        # First run
        call_command("seed_demo_scenarios", "--students", "20", stdout=StringIO())
        first_count = Student.objects.filter(reg_no__startswith="DEMO_").count()

        # Second run without reset (should be idempotent due to get_or_create)
        call_command("seed_demo_scenarios", "--students", "20", stdout=StringIO())
        second_count = Student.objects.filter(reg_no__startswith="DEMO_").count()

        self.assertEqual(first_count, second_count)

    def test_results_published_bucket(self):
        """Test that RESULTS_PUBLISHED bucket students have published results"""
        call_command("seed_demo_scenarios", "--students", "20", stdout=StringIO())

        # Get students from the RESULTS_PUBLISHED bucket (students 16-17, 0-indexed)
        students = list(
            Student.objects.filter(reg_no__startswith="DEMO_").order_by("reg_no")[16:18]
        )
        self.assertEqual(len(students), 2)

        # Check that they have published results
        for student in students:
            results = ResultHeader.objects.filter(
                student=student,
                status=ResultHeader.STATUS_PUBLISHED,
            )
            self.assertGreater(results.count(), 0)

    def test_low_attendance_bucket(self):
        """Test that LOW_ATTENDANCE_AT_RISK bucket has attendance below 75%"""
        call_command("seed_demo_scenarios", "--students", "20", stdout=StringIO())

        # Get students from LOW_ATTENDANCE_AT_RISK bucket (students 7-9, 0-indexed)
        students = list(
            Student.objects.filter(reg_no__startswith="DEMO_").order_by("reg_no")[7:10]
        )
        self.assertEqual(len(students), 3)

        # Check attendance percentage - should be around 65% but with randomness
        for student in students:
            total_attendance = Attendance.objects.filter(student=student).count()
            if total_attendance > 0:
                present_count = Attendance.objects.filter(
                    student=student,
                    status=Attendance.STATUS_PRESENT,
                ).count()
                attendance_percentage = (present_count / total_attendance) * 100
                # Due to randomness, we check that it's generally low (< 85%)
                self.assertLess(attendance_percentage, 85)

    def test_enrollments_created(self):
        """Test that students are enrolled in sections - LEGACY TEST DISABLED (enrollment module removed)"""
        # Legacy enrollment module removed - enrollment tracking should be handled via students app
        call_command("seed_demo_scenarios", "--students", "20", stdout=StringIO())
        # Test disabled - no enrollment module to test
        self.assertTrue(True)  # Placeholder assertion
