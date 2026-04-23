import pytest
from django.contrib.auth.models import Group, User
from rest_framework import status

from core.serializers import UserSerializer
from sims_backend.academics.models import AcademicPeriod, Batch, Department, Program
from sims_backend.academics.models import Group as StudentGroup
from sims_backend.admin.serializers import AdminUserSerializer
from sims_backend.exams.models import Exam
from sims_backend.results.models import ResultHeader
from sims_backend.students.models import Student
from sims_backend.transcripts.views import generate_qr_token


@pytest.fixture
def academic_structure(db):
    department = Department.objects.create(name="Medicine", code="MED")
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(name="Batch 2026", program=program, start_year=2026)
    group = StudentGroup.objects.create(name="Group A", batch=batch)
    period = AcademicPeriod.objects.create(name="Year 1", period_type=AcademicPeriod.PERIOD_TYPE_YEAR)
    return {
        "department": department,
        "program": program,
        "batch": batch,
        "group": group,
        "period": period,
    }


@pytest.fixture
def student_with_result(db, academic_structure):
    user = User.objects.create_user(username="student_result", password="pass")
    user.groups.add(Group.objects.get(name="STUDENT"))
    student = Student.objects.create(
        user=user,
        reg_no="MBBS2601",
        name="Student Result",
        program=academic_structure["program"],
        batch=academic_structure["batch"],
        group=academic_structure["group"],
    )
    exam = Exam.objects.create(
        title="Midterm",
        academic_period=academic_structure["period"],
        department=academic_structure["department"],
    )
    result = ResultHeader.objects.create(
        exam=exam,
        student=student,
        status=ResultHeader.STATUS_DRAFT,
        total_obtained=75,
        total_max=100,
    )
    return user, student, result


@pytest.mark.django_db
def test_transcript_verify_is_public(api_client, student_with_result):
    _user, student, _result = student_with_result
    token = generate_qr_token(student.id)

    response = api_client.get(f"/api/transcripts/verify/{token}/")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["valid"] is True
    assert response.json()["student_id"] == student.id


@pytest.mark.django_db
def test_transcript_verify_invalid_token_returns_valid_false(api_client):
    response = api_client.get("/api/transcripts/verify/not-a-real-token/")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["valid"] is False


@pytest.mark.django_db
def test_examcell_can_publish_and_freeze_result(api_client, student_with_result):
    _student_user, _student, result = student_with_result
    examcell = User.objects.create_user(username="examcell_contract", password="pass")
    examcell.groups.add(Group.objects.get(name="EXAMCELL"))
    api_client.force_authenticate(user=examcell)

    publish_response = api_client.post(f"/api/results/{result.id}/publish/")
    assert publish_response.status_code == status.HTTP_200_OK
    assert publish_response.json()["status"] == ResultHeader.STATUS_PUBLISHED

    freeze_response = api_client.post(f"/api/results/{result.id}/freeze/")
    assert freeze_response.status_code == status.HTTP_200_OK
    assert freeze_response.json()["status"] == ResultHeader.STATUS_FROZEN


@pytest.mark.django_db
def test_collection_publish_route_is_not_canonical(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)

    response = api_client.post("/api/results/publish/", {"section_id": 1}, format="json")

    assert response.status_code in {status.HTTP_404_NOT_FOUND, status.HTTP_405_METHOD_NOT_ALLOWED}


@pytest.mark.django_db
def test_registrar_with_legacy_admin_group_serializes_as_registrar():
    user = User.objects.create_user(username="registrar_contract", password="pass")
    user.groups.add(Group.objects.get(name="REGISTRAR"), Group.objects.get(name="ADMIN"))

    assert UserSerializer(user).data["role"] == "Registrar"
    assert AdminUserSerializer(user).data["role"] == "Registrar"
