import pytest
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError

from sims_backend.academics.models import Batch, Program
from sims_backend.academics.models import Group as AcadGroup
from sims_backend.compliance.models import RequirementDefinition, RequirementInstance, RequirementSubmission
from sims_backend.compliance.serializers import RequirementScopeSerializer
from sims_backend.compliance.views import submission_download, validate_document_upload
from sims_backend.students.models import Student


@pytest.fixture
def compliance_setup(db):
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    group = AcadGroup.objects.create(batch=batch, name="A")

    student_user = User.objects.create_user(username="stu_comp", password="pass")
    student = make_student(user=student_user, reg_no="C1", name="Stu", program=program, batch=batch, group=group)

    admin_user = User.objects.create_superuser(username="admin_comp", password="pass")

    definition = RequirementDefinition.objects.create(
        title="B-Form",
        requirement_type="document"
    )

    instance = RequirementInstance.objects.create(
        student=student,
        definition=definition,
        status=RequirementInstance.STATUS_PENDING
    )

    return {
        "student_user": student_user,
        "student": student,
        "admin_user": admin_user,
        "definition": definition,
        "instance": instance
    }

@pytest.mark.django_db
class TestStudentCompliance:
    def test_student_without_profile_sees_no_requirements(self, api_client):
        user = User.objects.create_user(username="no_student", password="pass")
        api_client.force_authenticate(user=user)
        response = api_client.get("/api/compliance/my-compliance/")
        assert response.status_code == 200
        assert response.data["results"] == []

    def test_submit_requirement_value(self, api_client, compliance_setup):
        definition = compliance_setup["definition"]
        definition.requirement_type = "profile_field"
        definition.save()
        api_client.force_authenticate(user=compliance_setup["student_user"])
        instance = compliance_setup["instance"]
        url = f"/api/compliance/my-compliance/{instance.id}/submit/"
        data = {"value": "Submitted value"}
        response = api_client.post(url, data, format="json")

        assert response.status_code == 200
        instance.refresh_from_db()
        assert instance.status == RequirementInstance.STATUS_SUBMITTED
        assert RequirementSubmission.objects.filter(instance=instance).exists()

    def test_submit_locked_fails(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["student_user"])
        instance = compliance_setup["instance"]
        from datetime import timedelta

        from django.utils import timezone
        # set due date to 1 hour from now (locks if < 72h)
        instance.due_at = timezone.now() + timedelta(hours=1)
        instance.save()

        url = f"/api/compliance/my-compliance/{instance.id}/submit/"
        response = api_client.post(url, {"value": "x"}, format="json")
        assert response.status_code == 403

    def test_submit_requires_value_or_file(self, api_client, compliance_setup):
        definition = compliance_setup["definition"]
        definition.requirement_type = "profile_field"
        definition.save()
        api_client.force_authenticate(user=compliance_setup["student_user"])
        response = api_client.post(f"/api/compliance/my-compliance/{compliance_setup['instance'].id}/submit/", {}, format="json")
        assert response.status_code == 400
        assert "No file" in response.data["error"]

    def test_document_submission_requires_file(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["student_user"])
        response = api_client.post(
            f"/api/compliance/my-compliance/{compliance_setup['instance'].id}/submit/", {"value": "ignored"}, format="json"
        )
        assert response.status_code == 400
        assert "document file" in response.data["error"]

    def test_document_upload_rejects_bad_content_and_accepts_pdf(self):
        bad = SimpleUploadedFile("proof.pdf", b"not-a-pdf", content_type="application/pdf")
        assert "content does not match" in validate_document_upload(bad)
        good = SimpleUploadedFile("proof.pdf", b"%PDF-1.7 test", content_type="application/pdf")
        assert validate_document_upload(good) is None

    def test_document_upload_rejects_size_and_type(self):
        too_large = SimpleUploadedFile("proof.pdf", b"x", content_type="application/pdf")
        too_large.size = 10 * 1024 * 1024 + 1
        assert "10 MB" in validate_document_upload(too_large)
        wrong_type = SimpleUploadedFile("proof.exe", b"MZ", content_type="application/octet-stream")
        assert "Only PDF" in validate_document_upload(wrong_type)

    def test_archived_and_verified_requirements_cannot_be_submitted(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["student_user"])
        instance = compliance_setup["instance"]
        instance.definition.is_active = False
        instance.definition.save()
        url = f"/api/compliance/my-compliance/{instance.id}/submit/"
        assert api_client.post(url, {"value": "x"}, format="json").status_code == 400
        instance.definition.is_active = True
        instance.definition.save()
        instance.status = RequirementInstance.STATUS_VERIFIED
        instance.save()
        assert api_client.post(url, {"value": "x"}, format="json").status_code == 400

    def test_submission_download_without_file_is_404(self, compliance_setup):
        submission = RequirementSubmission.objects.create(instance=compliance_setup["instance"], value="text")
        response = submission_download(submission)
        assert response.status_code == 404

    def test_download_missing_submission_returns_404(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["student_user"])
        response = api_client.get(f"/api/compliance/my-compliance/{compliance_setup['instance'].id}/submissions/999/download/")
        assert response.status_code == 404

@pytest.mark.django_db
class TestAdminCompliance:
    def test_review_queue_and_filters(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        instance = compliance_setup["instance"]
        instance.status = RequirementInstance.STATUS_SUBMITTED
        instance.save()
        response = api_client.get("/api/compliance/admin-compliance/review_queue/")
        assert response.status_code == 200
        assert any(row["id"] == instance.id for row in response.data)
        filtered = api_client.get(f"/api/compliance/admin-compliance/?status=submitted&student_id={instance.student_id}")
        assert filtered.status_code == 200
        assert len(filtered.data["results"]) == 1

    def test_mutating_admin_viewset_methods_are_rejected(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        url = f"/api/compliance/admin-compliance/{compliance_setup['instance'].id}/"
        assert api_client.post("/api/compliance/admin-compliance/", {}, format="json").status_code == 405
        assert api_client.put(url, {}, format="json").status_code == 405
        assert api_client.patch(url, {}, format="json").status_code == 405
        assert api_client.delete(url).status_code == 405

    def test_assign_missing_records_returns_404(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        response = api_client.post("/api/compliance/admin-compliance/assign_to_student/", {"student_id": 999, "definition_id": 999}, format="json")
        assert response.status_code == 404
    def test_verify_requirement(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        instance = compliance_setup["instance"]
        instance.status = RequirementInstance.STATUS_SUBMITTED
        instance.save()

        url = f"/api/compliance/admin-compliance/{instance.id}/verify/"
        response = api_client.post(url, {"notes": "All good"}, format="json")

        assert response.status_code == 200
        instance.refresh_from_db()
        assert instance.status == RequirementInstance.STATUS_VERIFIED

    def test_reject_requirement(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        instance = compliance_setup["instance"]
        instance.status = RequirementInstance.STATUS_SUBMITTED
        instance.save()
        url = f"/api/compliance/admin-compliance/{instance.id}/reject/"
        response = api_client.post(url, {"notes": "Incorrect"}, format="json")

        assert response.status_code == 200
        instance.refresh_from_db()
        assert instance.status == RequirementInstance.STATUS_REJECTED

    def test_assign_to_student(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        new_def = RequirementDefinition.objects.create(title="New Def")
        url = "/api/compliance/admin-compliance/assign_to_student/"
        data = {
            "student_id": compliance_setup["student"].id,
            "definition_id": new_def.id
        }
        response = api_client.post(url, data, format="json")
        assert response.status_code == 201
        assert RequirementInstance.objects.filter(student=compliance_setup["student"], definition=new_def).exists()

    def test_assign_existing_instance_with_due_date(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        url = "/api/compliance/admin-compliance/assign_to_student/"
        response = api_client.post(
            url,
            {"student_id": compliance_setup["student"].id, "definition_id": compliance_setup["definition"].id, "due_at": "2030-01-01T00:00:00Z"},
            format="json",
        )
        assert response.status_code == 201
        assert response.data["due_at"].startswith("2030-01-01")

    def test_admin_download_missing_submission_returns_404(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        response = api_client.get(f"/api/compliance/admin-compliance/{compliance_setup['instance'].id}/submissions/999/download/")
        assert response.status_code == 404

    def test_verify_and_reject_require_submitted_state(self, api_client, compliance_setup):
        api_client.force_authenticate(user=compliance_setup["admin_user"])
        url = f"/api/compliance/admin-compliance/{compliance_setup['instance'].id}/verify/"
        assert api_client.post(url, {}, format="json").status_code == 400
        url = f"/api/compliance/admin-compliance/{compliance_setup['instance'].id}/reject/"
        assert api_client.post(url, {}, format="json").status_code == 400


@pytest.mark.django_db
class TestComplianceScopeSerializer:
    def test_scope_serializer_rejects_invalid_definition_and_shape(self, compliance_setup):
        definition = compliance_setup["definition"]
        definition.requirement_type = "profile_field"
        definition.save()
        serializer = RequirementScopeSerializer(data={"definition": definition.id, "scope_type": "global", "program": None, "batch": None})
        assert not serializer.is_valid()
        assert "active onboarding document" in str(serializer.errors)

    def test_scope_serializer_accepts_active_global_scope(self, compliance_setup):
        definition = compliance_setup["definition"]
        serializer = RequirementScopeSerializer(data={"definition": definition.id, "scope_type": "global", "program": None, "batch": None})
        assert serializer.is_valid(), serializer.errors

from sims_backend.students.test_factories import make_student
