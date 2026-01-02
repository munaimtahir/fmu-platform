
from django.contrib.auth.models import User, Group as AuthGroup
from rest_framework.test import APITestCase
from rest_framework import status
from sims_backend.academics.models import Program, Batch, Group, AcademicPeriod
from sims_backend.exams.models import Exam
from sims_backend.students.models import Student
from sims_backend.results.models import ResultHeader

class ResultHeaderViewSetTestCase(APITestCase):
    def setUp(self):
        # Create User Groups
        self.student_group, _ = AuthGroup.objects.get_or_create(name='STUDENT')
        self.admin_group, _ = AuthGroup.objects.get_or_create(name='ADMIN')

        # Create Users
        self.student_user = User.objects.create_user(username="student", password="password")
        self.student_user.groups.add(self.student_group)

        self.other_student_user = User.objects.create_user(username="other_student", password="password")
        self.other_student_user.groups.add(self.student_group)

        self.unlinked_student_user = User.objects.create_user(username="unlinked", password="password")
        self.unlinked_student_user.groups.add(self.student_group)

        self.admin_user = User.objects.create_user(username="admin", password="password")
        self.admin_user.groups.add(self.admin_group)

        # Create Academics
        self.program = Program.objects.create(name="Program 1")
        self.batch = Batch.objects.create(program=self.program, name="Batch 1", start_year=2024)
        self.group = Group.objects.create(batch=self.batch, name="Group 1")
        self.period = AcademicPeriod.objects.create(period_type="YEAR", name="Year 1")

        # Create Students
        self.student = Student.objects.create(
            user=self.student_user,
            reg_no="REG001",
            name="Student 1",
            program=self.program,
            batch=self.batch,
            group=self.group
        )

        self.other_student = Student.objects.create(
            user=self.other_student_user,
            reg_no="REG002",
            name="Student 2",
            program=self.program,
            batch=self.batch,
            group=self.group
        )

        # Create Exam
        self.exam = Exam.objects.create(academic_period=self.period, title="Exam 1")
        self.exam2 = Exam.objects.create(academic_period=self.period, title="Exam 2")

        # Create Results
        # 1. Student 1 - Published
        self.result1 = ResultHeader.objects.create(
            exam=self.exam,
            student=self.student,
            status=ResultHeader.STATUS_PUBLISHED,
            total_obtained=80,
            total_max=100
        )

        # 2. Student 1 - Draft
        self.result2 = ResultHeader.objects.create(
            exam=self.exam2,
            student=self.student,
            status=ResultHeader.STATUS_DRAFT,
            total_obtained=70,
            total_max=100
        )

        # 3. Student 2 - Published
        self.result3 = ResultHeader.objects.create(
            exam=self.exam,
            student=self.other_student,
            status=ResultHeader.STATUS_PUBLISHED,
            total_obtained=90,
            total_max=100
        )

        self.url = '/api/results/'

    def test_student_sees_only_own_published_results(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        results = response.data
        if 'results' in results:
            results = results['results']

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.result1.id)

    def test_unlinked_student_sees_no_results(self):
        self.client.force_authenticate(user=self.unlinked_student_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data
        if 'results' in results:
            results = results['results']

        self.assertEqual(len(results), 0)

    def test_admin_sees_all_results(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data
        if 'results' in results:
            results = results['results']

        # Admin should see all 3 results
        self.assertEqual(len(results), 3)
