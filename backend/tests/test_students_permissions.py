from rest_framework import status

from sims_backend.admissions.models import Student


def test_student_can_read_own_only(api_client, student_user):
    Student.objects.create(
        reg_no="STU-0001", name="Own", program="BSc", status="active"
    )
    Student.objects.create(
        reg_no="STU-9999", name="Other", program="BSc", status="active"
    )

    api_client.force_authenticate(student_user)
    resp = api_client.get("/api/students/")

    assert resp.status_code == status.HTTP_200_OK
    assert len(resp.json()["results"]) == 1
    assert resp.json()["results"][0]["reg_no"] == "STU-0001"
