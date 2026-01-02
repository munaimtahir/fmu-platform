
import pytest
from rest_framework.test import APIClient
from django.contrib.auth.models import User, Group
from sims_backend.students.models import Student
from sims_backend.attendance.models import Attendance
from sims_backend.timetable.models import Session
from sims_backend.academics.models import Department, Program, Batch, Group as AcadGroup, AcademicPeriod
from rest_framework import status
import datetime
from django.utils import timezone

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def setup_data(db):
    # Create groups
    student_group, _ = Group.objects.get_or_create(name='STUDENT')
    admin_group, _ = Group.objects.get_or_create(name='ADMIN')

    # Create users
    student_user = User.objects.create_user(username='student', password='password')
    student_user.groups.add(student_group)

    other_student_user = User.objects.create_user(username='other_student', password='password')
    other_student_user.groups.add(student_group)

    admin_user = User.objects.create_user(username='admin', password='password')
    admin_user.groups.add(admin_group)

    # Create academic structure
    dept = Department.objects.create(name='CS', code='CS')
    prog = Program.objects.create(name='BSCS')
    batch = Batch.objects.create(name='2024', program=prog, start_year=2024)
    group = AcadGroup.objects.create(name='A', batch=batch)

    academic_period = AcademicPeriod.objects.create(
        period_type=AcademicPeriod.PERIOD_TYPE_YEAR,
        name='2024-2025'
    )

    # Create students
    student1 = Student.objects.create(
        user=student_user, reg_no='S1', name='Student 1',
        program=prog, batch=batch, group=group
    )
    student2 = Student.objects.create(
        user=other_student_user, reg_no='S2', name='Student 2',
        program=prog, batch=batch, group=group
    )

    # Create session
    now = timezone.now()
    session = Session.objects.create(
        academic_period=academic_period,
        group=group,
        faculty=admin_user,
        department=dept,
        starts_at=now,
        ends_at=now + datetime.timedelta(hours=1)
    )

    # Create attendance
    att1 = Attendance.objects.create(session=session, student=student1, status='PRESENT', marked_by=admin_user, marked_at=now)
    att2 = Attendance.objects.create(session=session, student=student2, status='ABSENT', marked_by=admin_user, marked_at=now)

    return {
        'student_user': student_user,
        'other_student_user': other_student_user,
        'admin_user': admin_user,
        'att1': att1,
        'att2': att2
    }

@pytest.mark.django_db
def test_student_sees_only_own_attendance(api_client, setup_data):
    api_client.force_authenticate(user=setup_data['student_user'])

    response = api_client.get('/api/attendance/')

    assert response.status_code == status.HTTP_200_OK
    data = response.data
    # Pagination might be in place
    results = data['results'] if 'results' in data else data

    # Should see only 1 record (their own)
    assert len(results) == 1
    assert results[0]['id'] == setup_data['att1'].id

@pytest.mark.django_db
def test_student_without_link_sees_nothing(api_client, setup_data):
    # Create a user in STUDENT group but no student link
    unlinked_user = User.objects.create_user(username='unlinked', password='password')
    student_group = Group.objects.get(name='STUDENT')
    unlinked_user.groups.add(student_group)

    api_client.force_authenticate(user=unlinked_user)

    response = api_client.get('/api/attendance/')
    assert response.status_code == status.HTTP_200_OK
    data = response.data
    results = data['results'] if 'results' in data else data

    assert len(results) == 0

@pytest.mark.django_db
def test_student_cannot_edit_attendance(api_client, setup_data):
    api_client.force_authenticate(user=setup_data['student_user'])
    att = setup_data['att1']

    # Try to update status using valid choice
    response = api_client.patch(f'/api/attendance/{att.id}/', {'status': 'ABSENT'})

    # Expect 403 Forbidden
    assert response.status_code == status.HTTP_403_FORBIDDEN
