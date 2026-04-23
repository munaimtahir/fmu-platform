import pytest
from datetime import date, timedelta
from django.utils import timezone
from django.contrib.auth.models import User, Group
from sims_backend.attendance.models import Attendance
from sims_backend.attendance.services.input_methods import parse_status_value, _validate_date, bulk_upsert_attendance_for_session
from sims_backend.academics.models import Program, Batch, Group as AcadGroup, AcademicPeriod, Department
from sims_backend.timetable.models import Session

def test_parse_status_value():
    assert parse_status_value("p") == Attendance.STATUS_PRESENT
    assert parse_status_value("PRESENT") == Attendance.STATUS_PRESENT
    assert parse_status_value("1") == Attendance.STATUS_PRESENT
    assert parse_status_value("a") == Attendance.STATUS_ABSENT
    assert parse_status_value("0") == Attendance.STATUS_ABSENT
    assert parse_status_value("unknown") == Attendance.STATUS_PRESENT # default
    assert parse_status_value(None, default=Attendance.STATUS_ABSENT) == Attendance.STATUS_ABSENT

@pytest.mark.django_db
def test_validate_date_rules():
    admin = User.objects.create_superuser(username="a_tt", password="p")
    faculty = User.objects.create_user(username="f_tt", password="p")
    
    period = AcademicPeriod.objects.create(name="P", period_type="YEAR")
    dept = Department.objects.create(name="D")
    program = Program.objects.create(name="Pr")
    batch = Batch.objects.create(program=program, name="B", start_year=2024)
    group = AcadGroup.objects.create(batch=batch, name="G")
    
    today = timezone.localdate()
    session = Session.objects.create(
        academic_period=period, department=dept, group=group, faculty=admin,
        starts_at=timezone.now(), ends_at=timezone.now() + timedelta(hours=1)
    )
    
    # Admin can do anything
    _validate_date(session, today - timedelta(days=10), admin)
    
    # Faculty cannot edit past dates
    with pytest.raises(ValueError, match="admin privileges"):
        _validate_date(session, today - timedelta(days=1), faculty)
        
    # Faculty cannot edit wrong session date
    with pytest.raises(ValueError, match="schedule"):
        _validate_date(session, today + timedelta(days=1), faculty)

@pytest.mark.django_db
def test_bulk_upsert_logic(db):
    admin = User.objects.create_superuser(username="a_bu", password="p")
    program = Program.objects.create(name="Pr")
    batch = Batch.objects.create(program=program, name="B", start_year=2024)
    group = AcadGroup.objects.create(batch=batch, name="G")
    period = AcademicPeriod.objects.create(name="P", period_type="YEAR")
    dept = Department.objects.create(name="D")
    
    from sims_backend.students.models import Student
    s1 = Student.objects.create(reg_no="S1", name="Stu 1", program=program, batch=batch, group=group)
    s2 = Student.objects.create(reg_no="S2", name="Stu 2", program=program, batch=batch, group=group)
    
    session = Session.objects.create(
        academic_period=period, department=dept, group=group, faculty=admin,
        starts_at=timezone.now(), ends_at=timezone.now() + timedelta(hours=1)
    )
    
    records = [
        {"student_id": s1.id, "status": "PRESENT"},
        {"reg_no": "S2", "status": "ABSENT"}
    ]
    
    res = bulk_upsert_attendance_for_session(
        session=session, records=records, default_status="PRESENT", actor=admin
    )
    assert res["created"] == 2
    assert Attendance.objects.filter(session=session, student=s1, status="PRESENT").exists()
    assert Attendance.objects.filter(session=session, student=s2, status="ABSENT").exists()
    
    # Update
    records2 = [{"reg_no": "S1", "status": "ABSENT"}]
    res2 = bulk_upsert_attendance_for_session(
        session=session, records=records2, default_status="PRESENT", actor=admin
    )
    assert res2["updated"] == 2 # S1 updated, S2 kept default (PRESENT because it wasn't in records2?)
    # Wait, statuses are initialized with default_status for ALL students in group.
    # So if s2 is in group, but not in records2, it gets default_status (PRESENT).
    # Since it was ABSENT before, it counts as updated to PRESENT.
    assert Attendance.objects.get(session=session, student=s1).status == "ABSENT"
    assert Attendance.objects.get(session=session, student=s2).status == "PRESENT"
