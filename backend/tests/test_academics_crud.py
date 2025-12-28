from rest_framework import status


def test_program_course_section_crud(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    pid = api_client.post("/api/programs/", {"name": "BSc CS"}, format="json").json()[
        "id"
    ]
    cid = api_client.post(
        "/api/courses/",
        {"code": "CS101", "title": "Intro CS", "credits": 3, "program": pid},
        format="json",
    ).json()["id"]
    # teacher field expects a User ID (ForeignKey) or null, not a string
    # Since teacher is nullable, we can create section without a teacher
    resp = api_client.post(
        "/api/sections/",
        {"course": cid, "term": "Fall-25", "teacher": None},
        format="json",
    )
    assert resp.status_code == status.HTTP_201_CREATED
