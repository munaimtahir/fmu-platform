"""Integration coverage for the canonical onboarding contract."""

import pytest
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from rest_framework_simplejwt.tokens import RefreshToken

from sims_backend.academics.models import Batch, Program
from sims_backend.compliance.models import RequirementDefinition, RequirementInstance, RequirementScope
from sims_backend.students.imports.services import StudentImportService
from sims_backend.students.models import Student
from sims_backend.students.onboarding import filter_onboarding_state, onboarding_status, synchronize_requirements
from sims_backend.students.test_factories import make_student

pytestmark = pytest.mark.django_db


@pytest.fixture
def world():
    program = Program.objects.create(name="Onboarding MBBS")
    batch = Batch.objects.create(program=program, name="2026", start_year=2026)
    return make_student(reg_no="ONB-001", program=program, batch=batch)


def test_duplicate_csv_headers_rejected(world, admin_user):
    source = SimpleUploadedFile("students.csv", b"first_name,first_name\nA,B")
    with pytest.raises(ValidationError, match="Duplicate columns"):
        StudentImportService.preview(source, admin_user)


@pytest.mark.parametrize(
    "route,payload",
    [
        ("/api/students/{student}/", {"reg_no": "CHANGED"}),
        ("/api/admin/users/{user}/", {"role": "Registrar"}),
        ("/api/admin/users/{user}/", {"first_name": "CHANGED"}),
        ("/api/people/persons/{person}/", {"first_name": "CHANGED"}),
    ],
)
def test_alternate_identity_writes_rejected(world, admin_client, route, payload):
    Group.objects.get_or_create(name="REGISTRAR")
    response = admin_client.patch(
        route.format(student=world.pk, user=world.user_id, person=world.person_id), payload, format="json"
    )
    assert response.status_code in (400, 405), response.data
    world.refresh_from_db()
    assert world.reg_no == world.user.username == "ONB-001"


def test_student_token_without_version_is_rejected(world, api_client):
    refresh = RefreshToken.for_user(world.user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    assert api_client.get("/api/students/me/").status_code == 401
    api_client.credentials()
    assert api_client.post("/api/auth/refresh/", {"refresh": str(refresh)}, format="json").status_code == 401


def test_scopes_preserve_manual_assignments_and_archive_history(world, admin_client):
    manual = RequirementInstance.objects.create(
        student=world, definition=RequirementDefinition.objects.create(title="Manual")
    )
    definition = RequirementDefinition.objects.create(title="Identity")
    RequirementScope.objects.create(definition=definition, scope_type="global")
    synchronize_requirements(world)
    automatic = RequirementInstance.objects.get(student=world, definition=definition)
    assert automatic.assignment_source == "onboarding_scope"
    assert admin_client.delete(f"/api/compliance/definitions/{definition.pk}/").status_code == 204
    automatic.refresh_from_db()
    manual.refresh_from_db()
    assert not automatic.is_active
    assert manual.is_active
    assert RequirementDefinition.objects.filter(pk=definition.pk).exists()


def test_manual_assignment_matching_scope_counts_toward_onboarding(world):
    definition = RequirementDefinition.objects.create(title="Scoped manual proof")
    instance = RequirementInstance.objects.create(student=world, definition=definition)
    scope = RequirementScope.objects.create(definition=definition, scope_type="global")
    synchronize_requirements(world)
    assert onboarding_status(world)["missing_documents"][0]["requirement_id"] == instance.pk
    assert filter_onboarding_state(Student.objects.all(), "documents_pending").filter(pk=world.pk).exists()
    scope.is_active = False
    scope.save()
    synchronize_requirements(world)
    instance.refresh_from_db()
    assert instance.is_active and instance.assignment_source == "manual"
    assert onboarding_status(world)["missing_documents"] == []
    assert not filter_onboarding_state(Student.objects.all(), "documents_pending").filter(pk=world.pk).exists()


def test_obsolete_submitted_requirement_preserves_history_without_blocking(world, admin_client):
    definition = RequirementDefinition.objects.create(title="Obsolete proof")
    scope = RequirementScope.objects.create(definition=definition, scope_type="global")
    synchronize_requirements(world)
    instance = RequirementInstance.objects.get(student=world, definition=definition)
    instance.status = "submitted"
    instance.save()
    assert admin_client.delete(f"/api/compliance/requirement-scopes/{scope.pk}/").status_code == 204
    instance.refresh_from_db()
    assert not instance.is_active
    assert instance.status == "submitted"
    assert admin_client.delete(f"/api/compliance/admin-compliance/{instance.pk}/").status_code == 405
    assert (
        admin_client.patch(
            f"/api/compliance/admin-compliance/{instance.pk}/", {"status": "verified"}, format="json"
        ).status_code
        == 405
    )
    assert RequirementInstance.objects.filter(pk=instance.pk).exists()


def test_expired_preview_is_persistently_failed(world, admin_user):
    from datetime import timedelta

    from django.utils import timezone

    from sims_backend.students.imports.models import ImportJob

    job = ImportJob.objects.create(
        created_by=admin_user,
        expires_at=timezone.now() - timedelta(seconds=1),
        status="PREVIEWED",
        original_filename="students.csv",
        file_hash="a" * 64,
    )
    with pytest.raises(ValidationError):
        StudentImportService.commit(str(job.pk), SimpleUploadedFile("students.csv", b""), admin_user)
    job.refresh_from_db()
    assert job.status == "FAILED"
    assert job.summary == {"error": "Preview expired"}


def test_scope_constraints_are_database_enforced(world):
    definition = RequirementDefinition.objects.create(title="Proof")
    RequirementScope.objects.create(definition=definition, scope_type="global")
    with pytest.raises(IntegrityError), transaction.atomic():
        RequirementScope.objects.create(definition=definition, scope_type="global")
    with pytest.raises(IntegrityError), transaction.atomic():
        RequirementScope.objects.create(definition=definition, scope_type="batch")


def test_document_download_and_cross_student_access(world, api_client, admin_client):
    definition = RequirementDefinition.objects.create(title="Identity")
    RequirementScope.objects.create(definition=definition, scope_type="global")
    synchronize_requirements(world)
    requirement = world.compliance_requirements.get()
    api_client.force_authenticate(world.user)
    upload = SimpleUploadedFile("identity.pdf", b"%PDF-1.4\n%%EOF", content_type="application/pdf")
    response = api_client.post(
        f"/api/students/me/onboarding/documents/{requirement.pk}/submit/", {"file": upload}, format="multipart"
    )
    assert response.status_code == 201, response.data
    submission = requirement.submissions.get()
    assert response.data["onboarding"]["documents_status"] == "complete"
    assert response.data["onboarding"]["documents"][0]["submissions"][0]["file_name"] == "identity.pdf"
    path = f"/api/compliance/my-compliance/{requirement.pk}/submissions/{submission.pk}/download/"
    downloaded = api_client.get(path)
    assert downloaded.status_code == 200
    assert b"%PDF" in b"".join(downloaded.streaming_content)
    other = make_student(reg_no="ONB-002", program=world.program, batch=world.batch)
    api_client.force_authenticate(other.user)
    assert api_client.get(path).status_code == 404
    response = admin_client.get(path.replace("my-compliance", "admin-compliance"))
    assert response.status_code == 200
    response.close()
    with pytest.raises(ValueError):
        _ = submission.file.url


def test_partial_profile_saves_and_database_filter_agree(world, api_client):
    api_client.force_authenticate(world.user)
    assert (
        api_client.patch(
            "/api/students/me/onboarding/profile/", {"email": "student@example.edu"}, format="json"
        ).status_code
        == 200
    )
    assert (
        api_client.patch(
            "/api/students/me/onboarding/profile/", {"emergency_contact_name": "Guardian"}, format="json"
        ).status_code
        == 200
    )
    world.refresh_from_db()
    assert world.person.contact_info.get(type="email").value == "student@example.edu"
    assert filter_onboarding_state(Student.objects.all(), "profile_incomplete").filter(pk=world.pk).exists()
    assert not filter_onboarding_state(Student.objects.all(), "profile_complete").filter(pk=world.pk).exists()


def test_placement_rejects_inactive_batch_without_changing_student(world, admin_client):
    world.batch.is_active = False
    world.batch.save()
    response = admin_client.patch(f"/api/students/{world.pk}/placement/", {
        "program": world.program_id, "batch": world.batch_id, "group": None,
    }, format="json")
    assert response.status_code == 400
    world.refresh_from_db()
    assert world.group_id is None


def test_complete_profile_matches_directory_filter(world, api_client):
    api_client.force_authenticate(world.user)
    response = api_client.patch(
        "/api/students/me/onboarding/profile/",
        {
            "date_of_birth": "2002-01-01",
            "gender": "female",
            "email": "student@example.edu",
            "mobile_number": "+923001234567",
            "residential_address": {"street": "1 College Road", "city": "Lahore", "country": "Pakistan"},
            "emergency_contact_name": "Guardian",
            "emergency_contact_phone": "+923001234568",
        },
        format="json",
    )
    assert response.status_code == 200, response.data
    assert response.data["onboarding"]["primary_state"] == "complete"
    assert response.data["onboarding"]["profile_completion_percentage"] == 100
    world.user.refresh_from_db()
    assert world.user.email == "student@example.edu"
    assert filter_onboarding_state(Student.objects.all(), "complete").filter(pk=world.pk).exists()
    forbidden = api_client.patch("/api/students/me/onboarding/profile/", {"first_name": "Changed"}, format="json")
    assert forbidden.status_code == 400


def test_import_retention_removes_only_expired_error_files(admin_user):
    from datetime import timedelta

    from django.core.management import call_command
    from django.utils import timezone

    from sims_backend.students.imports.models import ImportJob

    now = timezone.now()
    jobs = []
    for days in (31, 1):
        jobs.append(
            ImportJob.objects.create(
                created_by=admin_user,
                expires_at=now,
                status="COMMITTED",
                original_filename="students.csv",
                file_hash="b" * 64,
                finished_at=now - timedelta(days=days),
                error_report_file=SimpleUploadedFile("errors.csv", b"row,error\n2,invalid"),
            )
        )
    storage, expired_name = jobs[0].error_report_file.storage, jobs[0].error_report_file.name
    call_command("purge_student_import_artifacts")
    for job in jobs:
        job.refresh_from_db()
    assert not jobs[0].error_report_file
    assert not storage.exists(expired_name)
    assert jobs[1].error_report_file.storage.exists(jobs[1].error_report_file.name)
    assert ImportJob.objects.filter(pk__in=[job.pk for job in jobs]).count() == 2
