"""
Tests for Timetable API (publish with exactly 3 periods validation)
"""
import pytest
from datetime import date, timedelta
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import Batch, Program, AcademicPeriod
from sims_backend.timetable.models import WeeklyTimetable, TimetableCell


@pytest.fixture
def admin_user(db):
    """Create an admin user"""
    user = User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='testpass123'
    )
    user.is_staff = True
    user.is_superuser = True
    user.save()
    return user


@pytest.fixture
def api_client(admin_user):
    """Create API client with admin authentication"""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def academic_structure(db, admin_user):
    """Create academic structure for tests"""
    program = Program.objects.create(name="MBBS", description="Bachelor of Medicine")
    batch = Batch.objects.create(name="2024 Batch", program=program, start_year=2024)
    period = AcademicPeriod.objects.create(
        name="Fall 2024",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=90)
    )
    
    # Create a weekly timetable
    monday = date.today() - timedelta(days=date.today().weekday())  # Get this week's Monday
    timetable = WeeklyTimetable.objects.create(
        academic_period=period,
        batch=batch,
        week_start_date=monday,
        status='draft',
        created_by=admin_user
    )
    
    return {
        "program": program,
        "batch": batch,
        "period": period,
        "timetable": timetable
    }


@pytest.mark.django_db
class TestTimetablePublish:
    """Tests for timetable publish with exactly 3 periods constraint"""

    def test_publish_with_exactly_3_periods_per_day(self, api_client, academic_structure):
        """Timetable with exactly 3 periods per day can be published"""
        timetable = academic_structure["timetable"]
        
        # Create exactly 3 periods for each day (Monday-Saturday)
        for day in range(6):
            for i in range(3):
                TimetableCell.objects.create(
                    weekly_timetable=timetable,
                    day_of_week=day,
                    time_slot=f"0{8+i}:00-0{9+i}:00",
                    line1=f"Period {i+1}",
                    line2=f"Room {100+i}",
                    line3=f"Faculty {i+1}"
                )
        
        response = api_client.post(f'/api/timetable/weekly-timetables/{timetable.id}/publish/')
        assert response.status_code == status.HTTP_200_OK
        
        timetable.refresh_from_db()
        assert timetable.status == 'published'

    def test_publish_fails_with_less_than_3_periods(self, api_client, academic_structure):
        """Timetable with less than 3 periods per day cannot be published"""
        timetable = academic_structure["timetable"]
        
        # Create only 2 periods for Monday, 3 for others
        for day in range(6):
            periods_count = 2 if day == 0 else 3
            for i in range(periods_count):
                TimetableCell.objects.create(
                    weekly_timetable=timetable,
                    day_of_week=day,
                    time_slot=f"0{8+i}:00-0{9+i}:00",
                    line1=f"Period {i+1}",
                    line2=f"Room {100+i}",
                    line3=f"Faculty {i+1}"
                )
        
        response = api_client.post(f'/api/timetable/weekly-timetables/{timetable.id}/publish/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'INVALID_PERIOD_COUNT' in response.data.get('error', {}).get('code', '')
        assert 'Monday (2 periods)' in str(response.data)

    def test_publish_fails_with_more_than_3_periods(self, api_client, academic_structure):
        """Timetable with more than 3 periods per day cannot be published"""
        timetable = academic_structure["timetable"]
        
        # Create 4 periods for Monday, 3 for others
        for day in range(6):
            periods_count = 4 if day == 0 else 3
            for i in range(periods_count):
                TimetableCell.objects.create(
                    weekly_timetable=timetable,
                    day_of_week=day,
                    time_slot=f"0{8+i}:00-0{9+i}:00",
                    line1=f"Period {i+1}",
                    line2=f"Room {100+i}",
                    line3=f"Faculty {i+1}"
                )
        
        response = api_client.post(f'/api/timetable/weekly-timetables/{timetable.id}/publish/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'INVALID_PERIOD_COUNT' in response.data.get('error', {}).get('code', '')
        assert 'Monday (4 periods)' in str(response.data)

    def test_publish_already_published_timetable(self, api_client, academic_structure):
        """Publishing an already published timetable returns error"""
        timetable = academic_structure["timetable"]
        timetable.status = 'published'
        timetable.save()
        
        response = api_client.post(f'/api/timetable/weekly-timetables/{timetable.id}/publish/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already published' in response.data['detail'].lower()

    def test_empty_line1_not_counted_as_period(self, api_client, academic_structure):
        """Cells with empty line1 are not counted as periods"""
        timetable = academic_structure["timetable"]
        
        # Create 3 filled periods + 1 empty cell (line1 empty) per day
        for day in range(6):
            for i in range(4):
                TimetableCell.objects.create(
                    weekly_timetable=timetable,
                    day_of_week=day,
                    time_slot=f"0{8+i}:00-0{9+i}:00",
                    line1=f"Period {i+1}" if i < 3 else "",  # 4th cell has empty line1
                    line2=f"Room {100+i}",
                    line3=f"Faculty {i+1}"
                )
        
        response = api_client.post(f'/api/timetable/weekly-timetables/{timetable.id}/publish/')
        assert response.status_code == status.HTTP_200_OK
        
        timetable.refresh_from_db()
        assert timetable.status == 'published'
