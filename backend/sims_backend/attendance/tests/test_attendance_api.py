"""
Tests for Attendance API
"""
import pytest
from datetime import date
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient

from sims_backend.academics.models import Batch, Program, AcademicPeriod, Department, Group
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session
from sims_backend.attendance.models import Attendance


@pytest.fixture
def faculty_user(db):
    """Create a faculty user"""
    return User.objects.create_user(username='faculty', password='test123')


@pytest.fixture
def api_client(faculty_user):
    """Create API client with faculty authentication"""
    client = APIClient()
    client.force_authenticate(user=faculty_user)
    return client


@pytest.fixture
def academic_setup(db, faculty_user):
    """Create academic structure for tests"""
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(name="2024", program=program, start_year=2024)
    group = Group.objects.create(name="Group A", batch=batch)
    department = Department.objects.create(name="Anatomy")
    period = AcademicPeriod.objects.create(name="Fall 2024", start_date=date.today())
    
    session = Session.objects.create(
        academic_period=period,
        group=group,
        faculty=faculty_user,
        department=department,
        starts_at="2024-01-01 09:00:00",
        ends_at="2024-01-01 10:00:00"
    )
    
    student = Student.objects.create(
        reg_no="2024-001",
        name="John Doe",
        program=program,
        batch=batch,
        group=group
    )
    
    return {"session": session, "student": student}


@pytest.mark.django_db
class TestAttendanceAPI:
    """Tests for attendance marking and retrieval"""

    def test_mark_session_attendance(self, api_client, academic_setup):
        """Faculty can mark attendance for their session"""
        session = academic_setup["session"]
        student = academic_setup["student"]
        
        data = {
            "date": str(date.today()),
            "attendance": [
                {"student_id": student.id, "status": "PRESENT"}
            ]
        }
        
        response = api_client.post(f'/api/attendance/sessions/{session.id}/mark', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['created'] == 1
        
        # Verify in database
        attendance = Attendance.objects.get(session=session, student=student)
        assert attendance.status == "PRESENT"

    def test_update_existing_attendance(self, api_client, academic_setup):
        """Marking attendance again updates existing record"""
        session = academic_setup["session"]
        student = academic_setup["student"]
        
        # Create initial attendance
        Attendance.objects.create(
            session=session,
            student=student,
            status="PRESENT",
            marked_by=api_client.handler._force_user
        )
        
        # Update to ABSENT
        data = {
            "date": str(date.today()),
            "attendance": [
                {"student_id": student.id, "status": "ABSENT"}
            ]
        }
        
        response = api_client.post(f'/api/attendance/sessions/{session.id}/mark', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['updated'] == 1
        
        # Verify update
        attendance = Attendance.objects.get(session=session, student=student)
        assert attendance.status == "ABSENT"

    def test_attendance_summary(self, api_client, academic_setup):
        """Summary endpoint returns correct statistics"""
        session = academic_setup["session"]
        student = academic_setup["student"]
        
        # Create attendance records
        for i in range(10):
            Attendance.objects.create(
                session=session,
                student=student,
                status="PRESENT" if i < 7 else "ABSENT",
                marked_by=api_client.handler._force_user
            )
        
        response = api_client.get(f'/api/attendance/summary/?student={student.id}')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total'] == 10
        assert response.data['present'] == 7
        assert response.data['absent'] == 3
        assert response.data['percentage'] == 70.0
