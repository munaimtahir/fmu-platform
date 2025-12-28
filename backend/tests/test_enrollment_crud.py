from rest_framework import status

from sims_backend.admissions.models import Student


def test_enrollment_crud(api_client, admin_user, db):
    api_client.force_authenticate(admin_user)
    s = Student.objects.create(
        reg_no="STU-ENR-1", name="En R", program="BSc", status="active"
    )
    p = api_client.post("/api/programs/", {"name": "BBA"}, format="json").json()["id"]
    c = api_client.post(
        "/api/courses/",
        {"code": "BBA101", "title": "Intro Biz", "credits": 3, "program": p},
        format="json",
    ).json()["id"]
    sec = api_client.post(
        "/api/sections/",
        {"course": c, "term": "Fall-25", "teacher": None, "teacher_name": "Prof X"},
        format="json",
    ).json()["id"]
    resp = api_client.post(
        "/api/enrollments/",
        {"student": s.id, "section": sec, "status": "enrolled"},
        format="json",
    )
    assert resp.status_code == status.HTTP_201_CREATED
