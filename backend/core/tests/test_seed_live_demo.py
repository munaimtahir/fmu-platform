from io import StringIO
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from sims_backend.attendance.models import Attendance, AttendanceInputJob
from sims_backend.finance.models import Voucher
from sims_backend.learning.models import LearningMaterial
from sims_backend.notifications.models import Notification
from sims_backend.results.models import ResultHeader
from sims_backend.students.models import Student
from sims_backend.timetable.models import WeeklyTimetable


class SeedLiveDemoTests(TestCase):
    def run_seed(self):
        call_command("seed_live_demo", stdout=StringIO())

    def test_requires_explicit_confirmation_before_reset(self):
        with self.assertRaises(CommandError):
            call_command("seed_live_demo", "--reset", stdout=StringIO())

    def test_creates_repeatable_cross_workflow_baseline(self):
        self.run_seed()
        self.run_seed()

        self.assertEqual(Student.objects.count(), 20)
        self.assertTrue(Student.objects.get(reg_no="STUDENT").user.check_password("student123"))
        self.assertEqual(Student.objects.filter(password_change_required=True).count(), 5)
        self.assertGreaterEqual(WeeklyTimetable.objects.count(), 5)
        self.assertGreaterEqual(AttendanceInputJob.objects.count(), 5)
        self.assertGreaterEqual(Attendance.objects.count(), 20)
        self.assertGreaterEqual(LearningMaterial.objects.count(), 5)
        self.assertGreaterEqual(ResultHeader.objects.count(), 20)
        self.assertGreaterEqual(Voucher.objects.count(), 5)
        self.assertGreaterEqual(Notification.objects.count(), 5)
