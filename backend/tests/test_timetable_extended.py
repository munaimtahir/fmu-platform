import pytest
from datetime import date, timedelta
from rest_framework import status
from django.contrib.auth.models import Group, User
from sims_backend.academics.models import AcademicPeriod, Batch, Program
from sims_backend.timetable.models import WeeklyTimetable, TimetableCell

@pytest.fixture
def timetable_setup(db):
    admin_user = User.objects.create_superuser(username="admin_tt", password="pass")
    faculty_user = User.objects.create_user(username="fac_tt", password="pass")
    fac_group, _ = Group.objects.get_or_create(name="FACULTY")
    faculty_user.groups.add(fac_group)
    
    student_user = User.objects.create_user(username="stu_tt", password="pass")
    stu_group, _ = Group.objects.get_or_create(name="STUDENT")
    student_user.groups.add(stu_group)
    
    program = Program.objects.create(name="TT Program")
    batch = Batch.objects.create(program=program, name="2024", start_year=2024)
    period = AcademicPeriod.objects.create(
        name="TT Period", 
        start_date=date(2024, 1, 1), 
        end_date=date(2024, 3, 31),
        period_type="YEAR"
    )
    
    timetable = WeeklyTimetable.objects.create(
        batch=batch, academic_period=period, 
        week_start_date=date(2024, 1, 1),
        created_by=faculty_user, status="draft"
    )
    
    return {
        "admin": admin_user,
        "faculty": faculty_user,
        "student": student_user,
        "program": program,
        "batch": batch,
        "period": period,
        "timetable": timetable
    }

@pytest.mark.django_db
class TestWeeklyTimetableActions:
    def test_publish_validation_fails_without_3_periods(self, api_client, timetable_setup):
        tt = timetable_setup["timetable"]
        api_client.force_authenticate(user=timetable_setup["faculty"])
        
        # Create only 1 cell for Monday
        TimetableCell.objects.create(weekly_timetable=tt, day_of_week=0, time_slot=1, line1="Class 1")
        
        url = f"/api/timetable/weekly-timetables/{tt.id}/publish/"
        response = api_client.post(url)
        assert response.status_code == 400
        assert response.data["error"]["code"] == "INVALID_PERIOD_COUNT"

    def test_publish_success_with_3_periods(self, api_client, timetable_setup):
        tt = timetable_setup["timetable"]
        api_client.force_authenticate(user=timetable_setup["faculty"])
        
        # Create 3 cells for EVERY day (0-5)
        for day in range(6):
            for slot in range(1, 4):
                TimetableCell.objects.create(
                    weekly_timetable=tt, day_of_week=day, time_slot=slot, line1=f"Class {day}-{slot}"
                )
        
        url = f"/api/timetable/weekly-timetables/{tt.id}/publish/"
        response = api_client.post(url)
        assert response.status_code == 200
        tt.refresh_from_db()
        assert tt.status == "published"

    def test_unpublish_admin_only(self, api_client, timetable_setup):
        tt = timetable_setup["timetable"]
        tt.status = "published"
        tt.save()
        
        # Faculty cannot unpublish
        api_client.force_authenticate(user=timetable_setup["faculty"])
        url = f"/api/timetable/weekly-timetables/{tt.id}/unpublish/"
        response = api_client.post(url)
        assert response.status_code == 403
        
        # Admin can
        api_client.force_authenticate(user=timetable_setup["admin"])
        response = api_client.post(url)
        assert response.status_code == 200
        tt.refresh_from_db()
        assert tt.status == "draft"

    def test_generate_templates(self, api_client, timetable_setup):
        api_client.force_authenticate(user=timetable_setup["admin"])
        url = "/api/timetable/weekly-timetables/generate_weekly_templates/"
        data = {
            "batch": timetable_setup["batch"].id,
            "academic_period": timetable_setup["period"].id
        }
        response = api_client.post(url, data, format="json")
        assert response.status_code == 201
        # Period is Jan to March (~13 weeks)
        assert response.data["total_weeks"] >= 12

@pytest.mark.django_db
class TestTimetableCellPermissions:
    def test_cannot_add_cell_to_published(self, api_client, timetable_setup):
        tt = timetable_setup["timetable"]
        tt.status = "published"
        tt.save()
        
        api_client.force_authenticate(user=timetable_setup["admin"])
        url = "/api/timetable/timetable-cells/"
        data = {"weekly_timetable": tt.id, "day_of_week": 0, "time_slot": 1, "line1": "Err"}
        response = api_client.post(url, data, format="json")
        assert response.status_code == 400
        assert "published" in str(response.data)

    def test_faculty_can_only_modify_own_draft(self, api_client, timetable_setup):
        other_fac = User.objects.create_user(username="other_fac", password="pass")
        fac_group = Group.objects.get(name="FACULTY")
        other_fac.groups.add(fac_group)
        
        tt = timetable_setup["timetable"] # created by fac_tt
        
        api_client.force_authenticate(user=other_fac)
        url = "/api/timetable/timetable-cells/"
        data = {"weekly_timetable": tt.id, "day_of_week": 0, "time_slot": 1, "line1": "Err"}
        response = api_client.post(url, data, format="json")
        assert response.status_code == 403
