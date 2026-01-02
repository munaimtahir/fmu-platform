"""
Helper functions for creating demo scenario data.

This module provides functions to create students in different workflow stages
for demonstration and debugging purposes.
"""

from decimal import Decimal
from datetime import date, datetime, timedelta
from typing import Dict, List, Tuple

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group as AuthGroup
from django.db import transaction
from django.utils import timezone

from sims_backend.academics.models import AcademicPeriod, Batch, Department, Group, Program
from sims_backend.attendance.models import Attendance
from sims_backend.exams.models import Exam, ExamComponent
from sims_backend.finance.models import Challan, Charge, StudentLedgerItem
from sims_backend.results.models import ResultComponentEntry, ResultHeader
from sims_backend.students.models import Student
from sims_backend.timetable.models import Session

User = get_user_model()

# Demo tag prefix for identifying demo-created objects
DEMO_TAG_PREFIX = "DEMO_"


def get_or_create_demo_program(name: str = "MBBS") -> Program:
    """Get or create a demo program."""
    program, _ = Program.objects.get_or_create(
        name=f"{DEMO_TAG_PREFIX}{name}",
        defaults={"description": f"Demo program: {name}", "is_active": True}
    )
    return program


def get_or_create_demo_batch(program: Program, name: str = None) -> Batch:
    """Get or create a demo batch."""
    if not name:
        current_year = date.today().year
        name = f"{current_year} Batch"
    
    batch, _ = Batch.objects.get_or_create(
        program=program,
        name=f"{DEMO_TAG_PREFIX}{name}",
        defaults={"start_year": date.today().year}
    )
    return batch


def get_or_create_demo_academic_period(name: str = "Block-1", period_type: str = None) -> AcademicPeriod:
    """Get or create a demo academic period."""
    if not period_type:
        period_type = AcademicPeriod.PERIOD_TYPE_BLOCK
    
    current_year = date.today().year
    period, _ = AcademicPeriod.objects.get_or_create(
        period_type=period_type,
        name=f"{DEMO_TAG_PREFIX}{name}",
        defaults={
            "start_date": date(current_year, 9, 1),
            "end_date": date(current_year, 12, 31),
        }
    )
    return period


def get_or_create_demo_departments() -> List[Department]:
    """Get or create demo departments."""
    dept_data = [
        {"name": "Anatomy", "code": "ANAT"},
        {"name": "Physiology", "code": "PHYS"},
        {"name": "Biochemistry", "code": "BIOCHEM"},
    ]
    
    departments = []
    for data in dept_data:
        dept, _ = Department.objects.get_or_create(
            code=data["code"],
            defaults={"name": f"{DEMO_TAG_PREFIX}{data['name']}", **data}
        )
        departments.append(dept)
    
    return departments


def get_or_create_demo_groups(batch: Batch, count: int = 3) -> List[Group]:
    """Get or create demo groups for a batch."""
    groups = []
    for i in range(1, count + 1):
        group, _ = Group.objects.get_or_create(
            batch=batch,
            name=f"{DEMO_TAG_PREFIX}Section {i}",
        )
        groups.append(group)
    return groups


def create_demo_student_with_user(
    reg_no: str,
    name: str,
    program: Program,
    batch: Batch,
    group: Group,
    email: str = None,
) -> Tuple[Student, User]:
    """Create a student record with associated user account."""
    if not email:
        email = f"student{reg_no.replace('-', '').lower()}@sims.edu"
    
    # Create or get user
    username = f"student{reg_no.replace('-', '').lower()}"
    password = f"student{reg_no.split('-')[0]}"
    
    user, user_created = User.objects.get_or_create(
        username=username,
        defaults={
            "email": email,
            "first_name": name.split()[0] if name.split() else "Student",
            "last_name": " ".join(name.split()[1:]) if len(name.split()) > 1 else "",
        }
    )
    if user_created:
        user.set_password(password)
        user.save()
        # Add to Student group
        student_group, _ = AuthGroup.objects.get_or_create(name="Student")
        user.groups.add(student_group)
    
    # Create or get student
    student, _ = Student.objects.get_or_create(
        reg_no=reg_no,
        defaults={
            "name": name,
            "program": program,
            "batch": batch,
            "group": group,
            "status": Student.STATUS_ACTIVE,
            "email": email,
        }
    )
    
    return student, user


def create_demo_sessions(
    academic_period: AcademicPeriod,
    groups: List[Group],
    departments: List[Department],
    faculty_users: List[User],
    count_per_group: int = 5,
) -> List[Session]:
    """Create demo timetable sessions for attendance tracking."""
    from datetime import time as time_class
    
    sessions = []
    current_date = academic_period.start_date or date.today()
    
    for group in groups:
        for day_offset in range(0, count_per_group * 2, 2):
            session_date = current_date + timedelta(days=day_offset)
            start_time = timezone.make_aware(
                datetime.combine(session_date, time_class(hour=9, minute=0))
            )
            end_time = timezone.make_aware(
                datetime.combine(session_date, time_class(hour=11, minute=0))
            )
            
            # Round-robin assignment
            faculty = faculty_users[day_offset % len(faculty_users)]
            department = departments[day_offset % len(departments)]
            
            session, created = Session.objects.get_or_create(
                academic_period=academic_period,
                group=group,
                faculty=faculty,
                department=department,
                starts_at=start_time,
                ends_at=end_time,
            )
            if created:
                sessions.append(session)
    
    return sessions


def create_demo_exam(
    academic_period: AcademicPeriod,
    department: Department,
    title: str = "Midterm Exam",
    exam_type: str = "Midterm",
) -> Exam:
    """Create a demo exam with components."""
    exam, _ = Exam.objects.get_or_create(
        academic_period=academic_period,
        department=department,
        title=f"{DEMO_TAG_PREFIX}{title}",
        defaults={
            "exam_type": exam_type,
            "passing_mode": Exam.PASSING_MODE_TOTAL_ONLY,
            "pass_total_percent": Decimal("50.00"),
            "published": True,
        }
    )
    
    # Create exam components if they don't exist
    if not exam.components.exists():
        components_data = [
            {"name": "Written", "max_marks": Decimal("70.00"), "pass_marks": Decimal("35.00")},
            {"name": "Practical", "max_marks": Decimal("30.00"), "pass_marks": Decimal("15.00")},
        ]
        
        for idx, comp_data in enumerate(components_data, 1):
            ExamComponent.objects.create(
                exam=exam,
                name=comp_data["name"],
                sequence=idx,
                max_marks=comp_data["max_marks"],
                pass_marks=comp_data["pass_marks"],
            )
    
    return exam


def create_attendance_for_student(
    student: Student,
    sessions: List[Session],
    present_count: int,
    total_sessions: int = None,
) -> List[Attendance]:
    """Create attendance records for a student."""
    if total_sessions is None:
        total_sessions = len(sessions)
    
    # Get sessions for student's group
    student_sessions = [s for s in sessions if s.group == student.group][:total_sessions]
    
    attendance_records = []
    for i, session in enumerate(student_sessions):
        status = Attendance.STATUS_PRESENT if i < present_count else Attendance.STATUS_ABSENT
        attendance, _ = Attendance.objects.get_or_create(
            session=session,
            student=student,
            defaults={
                "status": status,
                "marked_at": session.starts_at,
            }
        )
        attendance_records.append(attendance)
    
    return attendance_records


def create_result_for_student(
    student: Student,
    exam: Exam,
    status: str = ResultHeader.STATUS_DRAFT,
    marks_percentage: float = 75.0,
) -> ResultHeader:
    """Create a result header and component entries for a student."""
    # Calculate marks based on percentage
    total_max = sum(comp.max_marks for comp in exam.components.all())
    total_obtained = Decimal(str(marks_percentage / 100.0)) * total_max
    
    result_header, _ = ResultHeader.objects.get_or_create(
        exam=exam,
        student=student,
        defaults={
            "total_obtained": total_obtained,
            "total_max": total_max,
            "status": status,
            "final_outcome": ResultHeader.OUTCOME_PASS if marks_percentage >= 50 else ResultHeader.OUTCOME_FAIL,
        }
    )
    
    # Create component entries
    if not result_header.component_entries.exists():
        components = exam.components.all().order_by("sequence")
        for comp in components:
            comp_marks = (total_obtained / total_max) * comp.max_marks
            ResultComponentEntry.objects.create(
                result_header=result_header,
                exam_component=comp,
                marks_obtained=comp_marks,
                component_outcome=ResultComponentEntry.OUTCOME_PASS if comp_marks >= comp.pass_marks else ResultComponentEntry.OUTCOME_FAIL,
            )
    
    return result_header


def create_challan_for_student(
    student: Student,
    academic_period: AcademicPeriod,
    amount: Decimal = Decimal("50000.00"),
) -> Challan:
    """Create a fee challan for a student."""
    # Create charge if needed
    charge, _ = Charge.objects.get_or_create(
        title=f"{DEMO_TAG_PREFIX}Tuition Fee - {academic_period.name}",
        academic_period=academic_period,
        defaults={
            "amount": amount,
            "due_date": date.today() + timedelta(days=30),
        }
    )
    
    # Create ledger item
    ledger_item, _ = StudentLedgerItem.objects.get_or_create(
        student=student,
        charge=charge,
        defaults={"status": StudentLedgerItem.STATUS_PENDING}
    )
    
    # Check if challan already exists for this ledger item
    challan = Challan.objects.filter(ledger_item=ledger_item).first()
    if challan:
        return challan
    
    # Create new challan
    from sims_backend.finance.services import generate_challan_number
    challan_no = generate_challan_number()
    
    challan = Challan.objects.create(
        challan_no=challan_no,
        student=student,
        ledger_item=ledger_item,
        amount_total=amount,
        status=Challan.STATUS_PENDING,
    )
    
    return challan


def delete_demo_objects():
    """Delete all objects tagged with DEMO_ prefix."""
    # Delete in reverse dependency order
    # Challan numbers are generated and might not have DEMO_ prefix, so we filter by student ledger item charge
    Challan.objects.filter(ledger_item__charge__title__startswith=DEMO_TAG_PREFIX).delete()
    StudentLedgerItem.objects.filter(charge__title__startswith=DEMO_TAG_PREFIX).delete()
    Charge.objects.filter(title__startswith=DEMO_TAG_PREFIX).delete()
    
    ResultComponentEntry.objects.filter(result_header__exam__title__startswith=DEMO_TAG_PREFIX).delete()
    ResultHeader.objects.filter(exam__title__startswith=DEMO_TAG_PREFIX).delete()
    
    ExamComponent.objects.filter(exam__title__startswith=DEMO_TAG_PREFIX).delete()
    Exam.objects.filter(title__startswith=DEMO_TAG_PREFIX).delete()
    
    Attendance.objects.filter(session__academic_period__name__startswith=DEMO_TAG_PREFIX).delete()
    Session.objects.filter(academic_period__name__startswith=DEMO_TAG_PREFIX).delete()
    
    Student.objects.filter(reg_no__contains=DEMO_TAG_PREFIX).delete()
    Group.objects.filter(name__startswith=DEMO_TAG_PREFIX).delete()
    Batch.objects.filter(name__startswith=DEMO_TAG_PREFIX).delete()
    AcademicPeriod.objects.filter(name__startswith=DEMO_TAG_PREFIX).delete()
    Program.objects.filter(name__startswith=DEMO_TAG_PREFIX).delete()
    
    # Note: We don't delete users as they might be reused
