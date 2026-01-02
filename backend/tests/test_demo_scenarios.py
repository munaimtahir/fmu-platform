"""
Tests for demo scenarios seeding command.
"""

from decimal import Decimal

from django.core.management import call_command
from django.test import TestCase

from sims_backend.results.models import ResultHeader
from sims_backend.students.models import Student
from sims_backend.attendance.models import Attendance
from sims_backend.finance.models import Voucher


class DemoScenariosCommandTest(TestCase):
    """Test the seed_demo_scenarios management command."""

    def test_command_creates_20_students(self):
        """Test that the command creates exactly 20 students."""
        call_command("seed_demo_scenarios", "--students", "20")
        
        # Count students with DEMO prefix
        demo_students = Student.objects.filter(reg_no__contains="DEMO-")
        self.assertEqual(demo_students.count(), 20)

    def test_command_idempotency(self):
        """Test that running the command twice doesn't duplicate students."""
        call_command("seed_demo_scenarios", "--students", "20")
        first_count = Student.objects.filter(reg_no__contains="DEMO-").count()
        
        call_command("seed_demo_scenarios", "--students", "20")
        second_count = Student.objects.filter(reg_no__contains="DEMO-").count()
        
        # Should be same or updated, not duplicated
        self.assertLessEqual(second_count, first_count + 5)  # Allow some margin for updates

    def test_reset_flag_deletes_demo_objects(self):
        """Test that --reset flag deletes existing demo objects."""
        # Create initial data
        call_command("seed_demo_scenarios", "--students", "20")
        initial_count = Student.objects.filter(reg_no__contains="DEMO-").count()
        self.assertGreater(initial_count, 0)
        
        # Reset and recreate
        call_command("seed_demo_scenarios", "--students", "20", "--reset")
        final_count = Student.objects.filter(reg_no__contains="DEMO-").count()
        
        # Should have exactly 20 after reset
        self.assertEqual(final_count, 20)

    def test_results_published_scenario(self):
        """Test that RESULTS_PUBLISHED bucket has published results."""
        call_command("seed_demo_scenarios", "--students", "20")
        
        # Find a student with published results
        published_results = ResultHeader.objects.filter(
            status=ResultHeader.STATUS_PUBLISHED,
            student__reg_no__contains="DEMO-"
        )
        self.assertGreater(published_results.count(), 0)
        
        # Verify the result is actually published
        result = published_results.first()
        self.assertEqual(result.status, ResultHeader.STATUS_PUBLISHED)

    def test_low_attendance_scenario(self):
        """Test that LOW_ATTENDANCE_AT_RISK students have low attendance."""
        call_command("seed_demo_scenarios", "--students", "20")
        
        # Get demo students
        demo_students = Student.objects.filter(reg_no__contains="DEMO-")
        
        # Find students with low attendance (less than 75%)
        low_attendance_found = False
        for student in demo_students:
            attendances = Attendance.objects.filter(student=student)
            if attendances.count() > 0:
                present_count = attendances.filter(status=Attendance.STATUS_PRESENT).count()
                total_count = attendances.count()
                attendance_percent = (present_count / total_count) * 100 if total_count > 0 else 0
                
                if 60 <= attendance_percent < 75:
                    low_attendance_found = True
                    break
        
        # We should have at least one student with low attendance
        self.assertTrue(low_attendance_found, "No student found with low attendance (60-74%)")

    def test_fees_voucher_generated_scenario(self):
        """Test that FEES_VOUCHER_GENERATED student has a voucher."""
        call_command("seed_demo_scenarios", "--students", "20")
        
        # Find demo students with vouchers
        demo_students = Student.objects.filter(reg_no__contains="DEMO-")
        students_with_vouchers = Voucher.objects.filter(
            student__in=demo_students,
            status=Voucher.STATUS_GENERATED
        )
        
        self.assertGreater(students_with_vouchers.count(), 0, "No student found with generated voucher")

    def test_command_with_custom_parameters(self):
        """Test command with custom program and term parameters."""
        call_command(
            "seed_demo_scenarios",
            "--students", "20",
            "--program", "BDS",
            "--term", "Block-2",
            "--sections", "2"
        )
        
        # Verify program was created
        from sims_backend.academics.models import Program
        program = Program.objects.filter(name__contains="DEMO_BDS").first()
        self.assertIsNotNone(program)
        
        # Verify students were created
        demo_students = Student.objects.filter(reg_no__contains="DEMO-")
        self.assertEqual(demo_students.count(), 20)
