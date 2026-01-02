import io
from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from sims_backend.academics.models import AcademicPeriod, Batch, Department, Group, Program
from sims_backend.attendance.models import Attendance
from sims_backend.timetable.models import Session
from sims_backend.students.models import Student


@pytest.fixture()
def session_with_students(db, admin_user):
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    group = Group.objects.create(batch=batch, name="Group A")
    department = Department.objects.create(name="Anatomy", code="ANAT")
    period = AcademicPeriod.objects.create(period_type="YEAR", name="Year 1")
    faculty = User.objects.create_user(username="faculty1", password="pass")
    faculty.groups.add(*[])

    session = Session.objects.create(
        academic_period=period,
        group=group,
        faculty=faculty,
        department=department,
        starts_at=timezone.now() + timedelta(hours=1),
        ends_at=timezone.now() + timedelta(hours=2),
    )

    students = [
        Student.objects.create(
            reg_no="REG-001",
            name="Alice",
            program=program,
            batch=batch,
            group=group,
        ),
        Student.objects.create(
            reg_no="REG-002",
            name="Bob",
            program=program,
            batch=batch,
            group=group,
        ),
    ]
    return session, students


def test_live_roster_returns_students(api_client, admin_user, session_with_students):
    session, students = session_with_students
    api_client.force_authenticate(user=admin_user)

    response = api_client.get("/api/attendance-input/live/roster/", {"session_id": session.id})
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["students"]) == len(students)
    assert payload["students"][0]["status"] is None


def test_live_submit_marks_absent_and_present(api_client, admin_user, session_with_students):
    session, students = session_with_students
    api_client.force_authenticate(user=admin_user)
    payload = {
        "session_id": session.id,
        "date": session.starts_at.date().isoformat(),
        "default_status": "P",
        "records": [{"student_id": students[1].id, "status": "A"}],
    }
    response = api_client.post("/api/attendance-input/live/submit/", payload, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2

    statuses = list(Attendance.objects.order_by("student__reg_no").values_list("status", flat=True))
    assert statuses == [Attendance.STATUS_PRESENT, Attendance.STATUS_ABSENT]


def test_csv_dry_run_flags_unknown_student(api_client, admin_user, session_with_students):
    session, students = session_with_students
    api_client.force_authenticate(user=admin_user)
    csv_content = "reg_no,status\nREG-001,P\nREG-404,A\n"
    upload = SimpleUploadedFile("attendance.csv", csv_content.encode("utf-8"), content_type="text/csv")

    response = api_client.post(
        "/api/attendance-input/csv/dry-run/",
        {"session_id": session.id, "date": session.starts_at.date().isoformat(), "file": upload},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["matched"] == 1
    assert body["errors"]
    assert body["job_id"]


def test_sheet_dry_run_returns_unknown_records(api_client, admin_user, session_with_students):
    session, students = session_with_students
    api_client.force_authenticate(user=admin_user)
    dummy = SimpleUploadedFile("sheet.png", b"image-bytes", content_type="image/png")
    response = api_client.post(
        "/api/attendance-input/sheet/dry-run/",
        {"session_id": session.id, "file": dummy},
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["results"]) == len(students)
    assert payload["results"][0]["detected_status"] == "UNKNOWN"
