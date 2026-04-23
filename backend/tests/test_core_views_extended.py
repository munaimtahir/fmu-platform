import pytest
from rest_framework import status
from django.contrib.auth.models import Group, User
from sims_backend.students.models import Student
from sims_backend.academics.models import Program, Batch, Group as AcadGroup

@pytest.mark.django_db
class TestCoreViewsExtended:
    def test_unified_login_email(self, api_client):
        User.objects.create_user(username="testuser", email="test@sims.edu", password="password123")
        url = "/api/auth/login/"
        # Test email login
        response = api_client.post(url, {"identifier": "test@sims.edu", "password": "password123"}, format="json")
        assert response.status_code == 200
        assert "tokens" in response.data
        assert response.data["user"]["username"] == "testuser"

    def test_unified_login_username(self, api_client):
        User.objects.create_user(username="testuser", email="test@sims.edu", password="password123")
        url = "/api/auth/login/"
        # Test username login
        response = api_client.post(url, {"identifier": "testuser", "password": "password123"}, format="json")
        assert response.status_code == 200
        assert response.data["user"]["email"] == "test@sims.edu"

    def test_unified_login_invalid(self, api_client):
        url = "/api/auth/login/"
        response = api_client.post(url, {"identifier": "wrong", "password": "wrong"}, format="json")
        assert response.status_code == 401
        assert "error" in response.data

    def test_logout(self, api_client):
        user = User.objects.create_user(username="logoutuser", password="pass")
        api_client.force_authenticate(user=user)
        response = api_client.post("/api/auth/logout/", {"refresh": "invalid_or_not_provided_is_fine"})
        assert response.status_code == 200
        assert response.data["success"] is True

    def test_dashboard_stats_faculty(self, api_client):
        faculty_user = User.objects.create_user(username="fac1", password="pass")
        faculty_group, _ = Group.objects.get_or_create(name="FACULTY")
        faculty_user.groups.add(faculty_group)
        
        api_client.force_authenticate(user=faculty_user)
        response = api_client.get("/api/dashboard/stats/")
        assert response.status_code == 200
        assert "my_sessions" in response.data

    def test_dashboard_stats_student(self, api_client):
        program = Program.objects.create(name="MBBS")
        batch = Batch.objects.create(program=program, name="2024", start_year=2024)
        group = AcadGroup.objects.create(batch=batch, name="A")
        
        student_user = User.objects.create_user(username="stu1", password="pass")
        student_group, _ = Group.objects.get_or_create(name="STUDENT")
        student_user.groups.add(student_group)
        Student.objects.create(user=student_user, reg_no="S1", name="Stu", program=program, batch=batch, group=group)
        
        api_client.force_authenticate(user=student_user)
        response = api_client.get("/api/dashboard/stats/")
        assert response.status_code == 200
        assert "attendance_percentage" in response.data

    def test_dashboard_stats_finance(self, api_client):
        fin_user = User.objects.create_user(username="fin1", password="pass")
        fin_group, _ = Group.objects.get_or_create(name="FINANCE")
        fin_user.groups.add(fin_group)
        
        api_client.force_authenticate(user=fin_user)
        response = api_client.get("/api/dashboard/stats/")
        assert response.status_code == 200
        assert "total_vouchers" in response.data

    def test_dashboard_stats_unlinked_student(self, api_client):
        student_user = User.objects.create_user(username="stu_no_link", password="pass")
        student_group, _ = Group.objects.get_or_create(name="STUDENT")
        student_user.groups.add(student_group)
        
        api_client.force_authenticate(user=student_user)
        response = api_client.get("/api/dashboard/stats/")
        assert response.status_code == 200
        assert "message" in response.data
        assert "No student record linked" in response.data["message"]
