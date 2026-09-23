from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group as AuthGroup
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from sims_backend.academics.models import Batch, Program
from sims_backend.people.models import Person
from sims_backend.students.imports.services import REDACTED, StudentImportService
from sims_backend.students.models import Student

User = get_user_model()


class StudentImportContractTests(TestCase):
    def setUp(self):
        AuthGroup.objects.get_or_create(name="STUDENT")
        self.admin = User.objects.create_superuser(username="admin", password="Admin-Pass-9482!")
        self.program = Program.objects.create(name="MBBS")
        self.batch = Batch.objects.create(program=self.program, name="2031", start_year=2031)

    def upload(self, registration_number="REG-001"):
        content = (
            "first_name,last_name,registration_number,program_id,batch_id,initial_password\n"
            f"Amina,Khan,{registration_number},{self.program.id},{self.batch.id},Temp-Start-9482!\n"
        )
        return SimpleUploadedFile("students.csv", content.encode(), content_type="text/csv")

    def test_preview_is_read_only_and_redacts_password(self):
        result = StudentImportService.preview(self.upload(), self.admin)

        self.assertEqual(result["summary"], {"create_count": 1, "unchanged_count": 0, "reject_count": 0})
        self.assertEqual(result["preview_rows"][0]["data"]["initial_password"], REDACTED)
        self.assertEqual(Student.objects.count(), 0)
        self.assertEqual(Person.objects.count(), 0)

    def test_commit_requires_the_previewed_file(self):
        preview = StudentImportService.preview(self.upload(), self.admin)

        with self.assertRaisesMessage(Exception, "does not match"):
            StudentImportService.commit(preview["import_job_id"], self.upload("REG-002"), self.admin)

        self.assertEqual(Student.objects.count(), 0)

    def test_commit_creates_only_once(self):
        preview = StudentImportService.preview(self.upload(), self.admin)

        first = StudentImportService.commit(preview["import_job_id"], self.upload(), self.admin)
        second = StudentImportService.commit(preview["import_job_id"], self.upload(), self.admin)

        self.assertEqual(first, second)
        self.assertEqual(first["created_count"], 1)
        self.assertEqual(Student.objects.count(), 1)
