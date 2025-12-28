from rest_framework import status


def test_unauthenticated_401(api_client):
    resp = api_client.get("/api/students/")
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


def test_admin_can_list_students(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    resp = api_client.get("/api/students/")
    assert resp.status_code == status.HTTP_200_OK
