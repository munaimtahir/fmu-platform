from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group as AuthGroup
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from sims_backend.academics.models import Batch, Program
from sims_backend.compliance.models import RequirementDefinition, RequirementInstance, RequirementScope
from sims_backend.people.models import Person
from sims_backend.students.imports.services import REDACTED, StudentImportService
from sims_backend.students.models import Student
from sims_backend.students.onboarding import ProvisioningData, provision_student, synchronize_requirements

User = get_user_model()


class StudentOnboardingWorkflowTests(TestCase):
    password = "Temp-Start-9482!"

    def setUp(self):
        self.program = Program.objects.create(name="MBBS")
        self.batch = Batch.objects.create(program=self.program, name="2031 Batch", start_year=2031)
        self.actor = User.objects.create_superuser(username="workflow-admin", password="Admin-Pass-9482!")

    def provisioning_data(self, registration_number=" mbbs-001 "):
        return ProvisioningData(
            registration_number=registration_number,
            first_name="Amina",
            last_name="Khan",
            initial_password=self.password,
            program=self.program,
            batch=self.batch,
            email="amina@example.edu",
        )

    def csv_file(self, registration_number=" mbbs-001 "):
        body = (
            "first_name,last_name,registration_number,program_id,batch_id,initial_password,email\n"
            f"Amina,Khan,{registration_number},{self.program.id},{self.batch.id},{self.password},amina@example.edu\n"
        )
        return SimpleUploadedFile("students.csv", body.encode(), content_type="text/csv")

    def test_provisioning_is_atomic_when_role_is_not_configured(self):
        AuthGroup.objects.filter(name="STUDENT").delete()
        with self.assertRaises(AuthGroup.DoesNotExist):
            provision_student(self.provisioning_data(), actor=self.actor)

        self.assertFalse(User.objects.filter(username="MBBS-001").exists())
        self.assertEqual(Person.objects.count(), 0)
        self.assertEqual(Student.objects.count(), 0)

    def test_preview_is_password_safe_and_commit_is_idempotent(self):
        AuthGroup.objects.get_or_create(name="STUDENT")
        source = self.csv_file()

        preview = StudentImportService.preview(source, self.actor)

        self.assertEqual(preview["preview_rows"][0]["action"], "CREATE")
        self.assertEqual(preview["preview_rows"][0]["data"]["initial_password"], REDACTED)
        self.assertEqual(Student.objects.count(), 0)
        self.assertEqual(Person.objects.count(), 0)
        self.assertFalse(User.objects.filter(username="MBBS-001").exists())

        committed = StudentImportService.commit(preview["import_job_id"], self.csv_file(), self.actor)
        retried = StudentImportService.commit(preview["import_job_id"], self.csv_file(), self.actor)

        self.assertEqual(committed, retried)
        self.assertEqual(committed["created_count"], 1)
        student = Student.objects.select_related("user", "person").get()
        self.assertEqual(student.reg_no, "MBBS-001")
        self.assertEqual(student.user.username, "MBBS-001")
        self.assertEqual(student.person.user, student.user)
        self.assertTrue(student.user.check_password(self.password))
        self.assertTrue(student.password_change_required)

    def test_scoped_requirements_are_synchronized(self):
        AuthGroup.objects.get_or_create(name="STUDENT")
        student = provision_student(self.provisioning_data(), actor=self.actor)
        definition = RequirementDefinition.objects.create(title="CNIC copy")
        scope = RequirementScope.objects.create(
            definition=definition,
            scope_type=RequirementScope.SCOPE_PROGRAM,
            program=self.program,
        )

        synchronize_requirements(student)
        instance = RequirementInstance.objects.get(student=student, definition=definition)
        self.assertTrue(instance.is_active)

        scope.is_active = False
        scope.save(update_fields=["is_active"])
        synchronize_requirements(student)
        instance.refresh_from_db()
        self.assertFalse(instance.is_active)

    def test_mandatory_password_change_blocks_api_and_rotates_tokens(self):
        AuthGroup.objects.get_or_create(name="STUDENT")
        student = provision_student(self.provisioning_data(), actor=self.actor)
        login = APIClient().post(
            "/api/auth/login/",
            {"identifier": " mbbs-001 ", "password": self.password},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        old_access = login.data["tokens"]["access"]
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {old_access}")

        blocked = client.get("/api/students/me/")
        self.assertEqual(blocked.status_code, 403)

        changed = client.post(
            "/api/auth/change-password/",
            {
                "old_password": self.password,
                "new_password": "New-Secure-7391!",
                "new_password_confirm": "New-Secure-7391!",
            },
            format="json",
        )
        self.assertEqual(changed.status_code, 200)
        student.refresh_from_db()
        self.assertFalse(student.password_change_required)
        self.assertEqual(student.credential_version, 2)

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {old_access}")
        self.assertEqual(client.get("/api/students/me/").status_code, 401)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {changed.data['tokens']['access']}")
        self.assertEqual(client.get("/api/students/me/").status_code, 200)

    def test_admin_reset_and_deactivation_update_student_security_state(self):
        AuthGroup.objects.get_or_create(name="STUDENT")
        student = provision_student(self.provisioning_data(), actor=self.actor)
        student.password_change_required = False
        student.save(update_fields=["password_change_required", "updated_at"])
        client = APIClient()
        client.force_authenticate(self.actor)

        reset = client.post(
            f"/api/admin/users/{student.user_id}/reset-password/",
            {
                "temporary_password": "Reset-Secure-7391!",
                "temporary_password_confirm": "Reset-Secure-7391!",
            },
            format="json",
        )
        self.assertEqual(reset.status_code, 200)
        self.assertNotContains(reset, "Reset-Secure-7391!", status_code=200)
        student.refresh_from_db()
        self.assertTrue(student.password_change_required)
        self.assertEqual(student.credential_version, 2)

        deactivated = client.post(f"/api/admin/users/{student.user_id}/deactivate/")
        self.assertEqual(deactivated.status_code, 200)
        student.refresh_from_db()
        student.user.refresh_from_db()
        self.assertFalse(student.user.is_active)
        self.assertEqual(student.status, Student.STATUS_INACTIVE)

    def test_admin_user_api_rejects_standalone_student_role(self):
        AuthGroup.objects.get_or_create(name="STUDENT")
        client = APIClient()
        client.force_authenticate(self.actor)

        response = client.post(
            "/api/admin/users/",
            {
                "username": "ORPHAN-STUDENT",
                "email": "orphan@example.edu",
                "password": "Temp-Start-9482!",
                "role": "STUDENT",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(username="ORPHAN-STUDENT").exists())
