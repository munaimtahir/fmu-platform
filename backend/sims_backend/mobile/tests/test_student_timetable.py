from datetime import date, time, timedelta

from django.contrib.auth.models import Group as AuthGroup
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Group, Program, Section
from sims_backend.students.models import Student
from sims_backend.timetable.models import TimetableEntry, WeeklyTimetable

URL = "/api/mobile/student/timetable/"


class StudentTimetableViewTestCase(APITestCase):
    def setUp(self):
        student_group, _ = AuthGroup.objects.get_or_create(name="STUDENT")

        self.student_user = User.objects.create_user(username="tt_student", password="password")
        self.student_user.groups.add(student_group)

        self.other_student_user = User.objects.create_user(username="tt_other_student", password="password")
        self.other_student_user.groups.add(student_group)

        self.staff_user = User.objects.create_user(username="tt_staff", password="password", is_staff=True)
        self.faculty_user = User.objects.create_user(username="tt_faculty", password="password")

        self.program = Program.objects.create(name="MBBS")
        self.batch = Batch.objects.create(program=self.program, name="2026 Batch", start_year=2026)
        self.group_a = Group.objects.create(batch=self.batch, name="Group A")
        self.group_b = Group.objects.create(batch=self.batch, name="Group B")
        self.period = AcademicPeriod.objects.create(period_type="YEAR", name="Year 1")
        self.department = Department.objects.create(name="Anatomy")
        self.course = Course.objects.create(code="ANAT-101", name="Human Anatomy", department=self.department)

        self.student = Student.objects.create(
            user=self.student_user,
            reg_no="TT-001",
            name="TT Student",
            program=self.program,
            batch=self.batch,
            group=self.group_a,
        )
        self.other_student = Student.objects.create(
            user=self.other_student_user,
            reg_no="TT-002",
            name="TT Other Student",
            program=self.program,
            batch=self.batch,
            group=self.group_b,
        )

        self.monday = date.today() - timedelta(days=date.today().weekday())
        self.weekly_timetable = WeeklyTimetable.objects.create(
            academic_period=self.period,
            batch=self.batch,
            week_start_date=self.monday,
            status="published",
            created_by=self.faculty_user,
        )
        self.section_a = Section.objects.create(
            course=self.course, name="Section A", academic_period=self.period, faculty=self.faculty_user, group=self.group_a
        )
        self.section_b = Section.objects.create(
            course=self.course, name="Section B", academic_period=self.period, faculty=self.faculty_user, group=self.group_b
        )

    def test_unauthenticated_denied(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_student_gets_404(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_sees_only_own_group_entries(self):
        TimetableEntry.objects.create(
            weekly_timetable=self.weekly_timetable,
            section=self.section_a,
            group=self.group_a,
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(10, 0),
            created_by=self.faculty_user,
        )
        TimetableEntry.objects.create(
            weekly_timetable=self.weekly_timetable,
            section=self.section_b,
            group=self.group_b,
            day_of_week=0,
            start_time=time(10, 0),
            end_time=time(11, 0),
            created_by=self.faculty_user,
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entries = response.data["entries"]
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["start_time"], "09:00")

    def test_batch_wide_entry_with_no_group_is_visible_to_all_students(self):
        TimetableEntry.objects.create(
            weekly_timetable=self.weekly_timetable,
            section=self.section_a,
            group=None,
            day_of_week=1,
            start_time=time(11, 0),
            end_time=time(12, 0),
            created_by=self.faculty_user,
        )

        self.client.force_authenticate(user=self.other_student_user)
        response = self.client.get(URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entries = response.data["entries"]
        self.assertEqual(len(entries), 1)

    def test_unpublished_timetable_is_not_visible(self):
        self.weekly_timetable.status = "draft"
        self.weekly_timetable.save()
        TimetableEntry.objects.create(
            weekly_timetable=self.weekly_timetable,
            section=self.section_a,
            group=self.group_a,
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(10, 0),
            created_by=self.faculty_user,
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["entries"], [])

    def test_week_start_date_query_param_selects_a_different_week(self):
        next_monday = self.monday + timedelta(days=7)
        next_week_tt = WeeklyTimetable.objects.create(
            academic_period=self.period,
            batch=self.batch,
            week_start_date=next_monday,
            status="published",
            created_by=self.faculty_user,
        )
        TimetableEntry.objects.create(
            weekly_timetable=next_week_tt,
            section=self.section_a,
            group=self.group_a,
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(10, 0),
            created_by=self.faculty_user,
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(URL, {"week_start_date": next_monday.isoformat()})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["week_start_date"], next_monday.isoformat())
        self.assertEqual(len(response.data["entries"]), 1)

    def test_invalid_week_start_date_returns_400(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(URL, {"week_start_date": "not-a-date"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "INVALID_DATE")

    def test_a_student_cannot_see_another_students_group_only_entries(self):
        """Ownership isolation: group A's entry must never leak to a group B student."""
        TimetableEntry.objects.create(
            weekly_timetable=self.weekly_timetable,
            section=self.section_a,
            group=self.group_a,
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(10, 0),
            created_by=self.faculty_user,
        )

        self.client.force_authenticate(user=self.other_student_user)
        response = self.client.get(URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["entries"], [])

    def test_falls_back_to_legacy_cells_when_no_entries_exist(self):
        from sims_backend.timetable.models import TimetableCell

        TimetableCell.objects.create(
            weekly_timetable=self.weekly_timetable,
            day_of_week=2,
            time_slot="09:00-10:00",
            line1="Physiology Lecture",
            line2="Room 204",
            line3="Dr. Faculty",
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["source"], "legacy_cell")
        entries = response.data["entries"]
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["course_name"], "Physiology Lecture")

    def test_schema_generation_includes_endpoint(self):
        from drf_spectacular.generators import SchemaGenerator

        generator = SchemaGenerator()
        schema = generator.get_schema(request=None, public=True)
        self.assertIn("/api/mobile/student/timetable/", schema["paths"])
