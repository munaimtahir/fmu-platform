from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group as AuthGroup
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from sims_backend.academics.models import Batch, Program
from sims_backend.people.models import Person
from sims_backend.students.models import Student
from sims_backend.students.onboarding import ProvisioningData, normalize_registration_number, provision_student

User = get_user_model()


class StudentRegistrationNumberTests(TestCase):
    def setUp(self):
        AuthGroup.objects.get_or_create(name="STUDENT")
        self.program = Program.objects.create(name="MBBS")
        self.batch = Batch.objects.create(program=self.program, name="2031", start_year=2031)
        self.admin = User.objects.create_superuser(username="admin", password="Admin-Pass-9482!")

    def data(self, registration_number):
        return ProvisioningData(
            registration_number=registration_number,
            first_name="Amina",
            last_name="Khan",
            initial_password="Temp-Start-9482!",
            program=self.program,
            batch=self.batch,
        )

    def test_registration_number_is_normalized_and_shared_with_username(self):
        student = provision_student(self.data("  mbbs-001  "), actor=self.admin)

        self.assertEqual(normalize_registration_number("  mbbs-001  "), "MBBS-001")
        self.assertEqual(student.reg_no, "MBBS-001")
        self.assertEqual(student.user.username, "MBBS-001")

    def test_case_insensitive_database_uniqueness(self):
        first = provision_student(self.data("MBBS-001"), actor=self.admin)
        second_user = User.objects.create_user(username="SECOND")
        second_person = Person.objects.create(user=second_user, first_name="Second", last_name="Student")

        with self.assertRaises(IntegrityError), transaction.atomic():
            Student.objects.create(
                user=second_user,
                person=second_person,
                reg_no=first.reg_no.lower(),
                program=self.program,
                batch=self.batch,
            )

    def test_direct_student_api_creation_is_disabled(self):
        client = APIClient()
        client.force_authenticate(self.admin)
        response = client.post("/api/students/", {"registration_number": "MBBS-001"}, format="json")
        self.assertEqual(response.status_code, 405)
