from django.contrib.auth.models import Group as AuthGroup
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from sims_backend.academics.models import AcademicPeriod, Batch, Department, Group, Program
from sims_backend.attendance.models import Attendance
from sims_backend.exams.models import Exam
from sims_backend.results.models import ResultHeader
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session

URL = "/api/mobile/student/home/"


class StudentHomeViewTestCase(APITestCase):
    def setUp(self):
        self.student_group, _ = AuthGroup.objects.get_or_create(name="STUDENT")

        self.student_user = User.objects.create_user(username="mobile_student", password="password")
        self.student_user.groups.add(self.student_group)

        self.other_student_user = User.objects.create_user(username="mobile_other_student", password="password")
        self.other_student_user.groups.add(self.student_group)

        self.staff_user = User.objects.create_user(username="mobile_staff", password="password", is_staff=True)

        self.program = Program.objects.create(name="MBBS")
        self.batch = Batch.objects.create(program=self.program, name="2026 Batch", start_year=2026)
        self.group = Group.objects.create(batch=self.batch, name="Group A")
        self.period = AcademicPeriod.objects.create(period_type="YEAR", name="Year 1")

        self.student = Student.objects.create(
            user=self.student_user,
            reg_no="MOB-001",
            name="Mobile Student",
            program=self.program,
            batch=self.batch,
            group=self.group,
        )
        self.other_student = Student.objects.create(
            user=self.other_student_user,
            reg_no="MOB-002",
            name="Other Mobile Student",
            program=self.program,
            batch=self.batch,
            group=self.group,
        )

        self.exam = Exam.objects.create(academic_period=self.period, title="Block 1 Exam")

        self.faculty_user = User.objects.create_user(username="mobile_faculty", password="password")
        self.department = Department.objects.create(name="Anatomy")
        self.session = Session.objects.create(
            academic_period=self.period,
            group=self.group,
            faculty=self.faculty_user,
            department=self.department,
            starts_at=timezone.now(),
            ends_at=timezone.now(),
        )

    def test_unauthenticated_denied(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_student_gets_404(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_gets_own_home_with_empty_data(self):
        """A student with no attendance/results yet still gets a valid, empty-safe payload."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["student"]["id"], self.student.id)
        self.assertEqual(data["student"]["reg_no"], "MOB-001")
        self.assertEqual(data["academic_placement"]["programme"], "MBBS")
        self.assertEqual(data["attendance_summary"]["total"], 0)
        self.assertEqual(data["attendance_summary"]["percentage"], 0.0)
        self.assertEqual(data["latest_results"], [])
        self.assertEqual(data["timetable"]["status"], "BLOCKED_BY_DATA_MODEL")

    def test_student_sees_only_own_published_and_frozen_results_not_draft(self):
        exam2 = Exam.objects.create(academic_period=self.period, title="Block 2 Exam")
        ResultHeader.objects.create(
            exam=self.exam, student=self.student, status=ResultHeader.STATUS_PUBLISHED, total_obtained=80, total_max=100
        )
        ResultHeader.objects.create(
            exam=exam2, student=self.student, status=ResultHeader.STATUS_DRAFT, total_obtained=10, total_max=100
        )
        ResultHeader.objects.create(
            exam=self.exam,
            student=self.other_student,
            status=ResultHeader.STATUS_PUBLISHED,
            total_obtained=95,
            total_max=100,
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["latest_results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], ResultHeader.STATUS_PUBLISHED)

    def test_student_sees_own_frozen_result(self):
        ResultHeader.objects.create(
            exam=self.exam, student=self.student, status=ResultHeader.STATUS_FROZEN, total_obtained=88, total_max=100
        )
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["latest_results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], ResultHeader.STATUS_FROZEN)

    def test_attendance_summary_is_scoped_to_own_records(self):
        session2 = Session.objects.create(
            academic_period=self.period,
            group=self.group,
            faculty=self.faculty_user,
            department=self.department,
            starts_at=timezone.now(),
            ends_at=timezone.now(),
        )
        Attendance.objects.create(session=self.session, student=self.student, status=Attendance.STATUS_PRESENT)
        Attendance.objects.create(session=session2, student=self.student, status=Attendance.STATUS_ABSENT)
        Attendance.objects.create(session=self.session, student=self.other_student, status=Attendance.STATUS_PRESENT)

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        summary = response.data["attendance_summary"]
        self.assertEqual(summary["total"], 2)
        self.assertEqual(summary["present"], 1)
        self.assertEqual(summary["absent"], 1)
        self.assertEqual(summary["percentage"], 50.0)

    def test_schema_generation_includes_endpoint(self):
        from drf_spectacular.generators import SchemaGenerator

        generator = SchemaGenerator()
        schema = generator.get_schema(request=None, public=True)
        self.assertIn("/api/mobile/student/home/", schema["paths"])
