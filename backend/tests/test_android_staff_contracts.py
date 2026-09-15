import pytest
from django.contrib.auth.models import Group, User
from rest_framework.test import APIClient

from core.permissions import has_permission_task
from sims_backend.academics.models import AcademicPeriod, Batch, Course, Department, Program, Section
from sims_backend.academics.models import Group as AcademicGroup
from sims_backend.admin.serializers import AdminUserCreateSerializer, AdminUserSerializer
from sims_backend.exams.models import Exam, ExamComponent
from sims_backend.students.models import Student


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role,task",
    [
        ("REGISTRAR", "students.students.create"),
        ("REGISTRAR", "people.persons.update"),
        ("REGISTRAR", "academics.programs.manage"),
        ("COORDINATOR", "students.students.manage_placement"),
        ("EXAMCELL", "exams.exams.publish"),
        ("EXAMCELL", "results.result_components.create"),
        ("EXAMCELL", "results.result_corrections.apply"),
        ("FINANCE", "finance.payments.reverse"),
        ("FACULTY", "results.result_headers.create"),
        ("FACULTY", "results.result_components.update"),
    ],
)
def test_phase_3_to_5_builtin_role_contract(role, task):
    user = User.objects.create_user(username=f"android_{role.lower()}")
    group, _ = Group.objects.get_or_create(name=role)
    user.groups.add(group)
    assert has_permission_task(user, task)


@pytest.mark.django_db
@pytest.mark.parametrize(
    "group_name,expected", [("COORDINATOR", "Coordinator"), ("OFFICE_ASSISTANT", "OfficeAssistant")]
)
def test_admin_serializer_exposes_all_managed_roles(group_name, expected):
    user = User.objects.create_user(username=f"managed_{group_name.lower()}")
    group, _ = Group.objects.get_or_create(name=group_name)
    user.groups.add(group)
    assert AdminUserSerializer(user).data["role"] == expected


@pytest.mark.django_db
def test_admin_user_create_rejects_unknown_role_without_creating_user():
    serializer = AdminUserCreateSerializer(data={"username": "bad_role", "password": "strong-pass", "role": "ROOT"})
    assert not serializer.is_valid()
    assert "role" in serializer.errors
    assert not User.objects.filter(username="bad_role").exists()


@pytest.mark.django_db
def test_exam_write_is_denied_without_exam_task():
    user = User.objects.create_user(username="unprivileged_android")
    client = APIClient()
    client.force_authenticate(user=user)
    response = client.post("/api/exams/", {}, format="json")
    assert response.status_code == 403


@pytest.fixture
def faculty_gradebook_contract(db):
    faculty = User.objects.create_user(username="android_faculty_gradebook")
    faculty.groups.add(Group.objects.get(name="FACULTY"))
    other_faculty = User.objects.create_user(username="android_other_faculty")
    other_faculty.groups.add(Group.objects.get(name="FACULTY"))
    department = Department.objects.create(name="Android Medicine", code="ANDMED")
    program = Program.objects.create(name="Android MBBS")
    batch = Batch.objects.create(name="Android Batch", program=program, start_year=2031)
    taught_group = AcademicGroup.objects.create(name="Android A", batch=batch)
    other_group = AcademicGroup.objects.create(name="Android B", batch=batch)
    period = AcademicPeriod.objects.create(period_type="YEAR", name="Android Year")
    other_period = AcademicPeriod.objects.create(period_type="YEAR", name="Other Android Year")
    course = Course.objects.create(
        code="AND-101", name="Android Medicine", department=department, academic_period=period
    )
    other_course = Course.objects.create(
        code="AND-102", name="Other Android Medicine", department=department, academic_period=other_period
    )
    section = Section.objects.create(
        course=course, name="Android Section", academic_period=period, faculty=faculty, group=taught_group
    )
    other_section = Section.objects.create(
        course=other_course,
        name="Other Android Section",
        academic_period=other_period,
        faculty=other_faculty,
        group=other_group,
    )
    taught_student = Student.objects.create(
        reg_no="ANDROID-001", name="Taught Student", program=program, batch=batch, group=taught_group
    )
    other_student = Student.objects.create(
        reg_no="ANDROID-002", name="Other Student", program=program, batch=batch, group=other_group
    )
    exam = Exam.objects.create(title="Android Midterm", academic_period=period, department=department)
    other_exam = Exam.objects.create(title="Other Midterm", academic_period=other_period, department=department)
    component = ExamComponent.objects.create(exam=exam, name="Written", sequence=1, max_marks=100)
    return {
        "faculty": faculty,
        "section": section,
        "other_section": other_section,
        "student": taught_student,
        "other_student": other_student,
        "exam": exam,
        "other_exam": other_exam,
        "component": component,
    }


@pytest.mark.django_db
def test_faculty_gradebook_is_scoped_and_allows_draft_marks_only(faculty_gradebook_contract):
    data = faculty_gradebook_contract
    client = APIClient()
    client.force_authenticate(user=data["faculty"])

    students = client.get("/api/students/").json()["results"]
    exams = client.get("/api/exams/").json()["results"]
    assert [row["id"] for row in students] == [data["student"].id]
    assert [row["id"] for row in exams] == [data["exam"].id]

    denied = client.post(
        "/api/results/",
        {
            "exam": data["other_exam"].id,
            "student": data["other_student"].id,
            "total_obtained": "1",
            "total_max": "10",
            "status": "DRAFT",
        },
        format="json",
    )
    assert denied.status_code == 403

    created = client.post(
        "/api/results/",
        {
            "exam": data["exam"].id,
            "student": data["student"].id,
            "total_obtained": "70",
            "total_max": "100",
            "status": "DRAFT",
        },
        format="json",
    )
    assert created.status_code == 201
    result_id = created.json()["id"]
    marks = client.post(
        "/api/result-components/",
        {"result_header": result_id, "exam_component": data["component"].id, "marks_obtained": "70"},
        format="json",
    )
    assert marks.status_code == 201
    updated = client.patch(f"/api/result-components/{marks.json()['id']}/", {"marks_obtained": "72"}, format="json")
    assert updated.status_code == 200
    assert updated.json()["marks_obtained"] == "72.00"
    assert client.post(f"/api/results/{result_id}/publish/").status_code == 403


@pytest.mark.django_db
def test_faculty_material_upload_scope_and_lifecycle(faculty_gradebook_contract):
    data = faculty_gradebook_contract
    client = APIClient()
    client.force_authenticate(user=data["faculty"])
    created = client.post(
        "/api/learning/materials/",
        {"title": "Android notes", "description": "Demo", "kind": "LINK", "url": "https://example.edu/notes"},
        format="json",
    )
    assert created.status_code == 201
    material_id = created.json()["id"]
    denied = client.post(
        f"/api/learning/materials/{material_id}/audiences/",
        {"section": data["other_section"].id},
        format="json",
    )
    assert denied.status_code == 403
    audience = client.post(
        f"/api/learning/materials/{material_id}/audiences/",
        {"section": data["section"].id},
        format="json",
    )
    assert audience.status_code == 201
    assert client.post(f"/api/learning/materials/{material_id}/publish/", {}, format="json").status_code == 200
    assert client.post(f"/api/learning/materials/{material_id}/archive/", {}, format="json").status_code == 200
