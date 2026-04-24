import pytest
from django.contrib.auth.models import Group, User
from rest_framework.test import APIClient


@pytest.fixture(scope="session", autouse=True)
def ensure_roles(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        for name in (
            "ADMIN",
            "REGISTRAR",
            "EXAMCELL",
            "COORDINATOR",
            "FACULTY",
            "FINANCE",
            "STUDENT",
            "OFFICE_ASSISTANT",
        ):
            Group.objects.get_or_create(name=name)
    yield


@pytest.fixture()
def api_client():
    return APIClient()


@pytest.fixture()
def admin_user(db):
    user = User.objects.create_user(username="admin1", password="pass")
    user.is_superuser = True
    user.is_staff = True
    user.save()
    return user


@pytest.fixture()
def admin_client(admin_user):
    """API client authenticated as superuser."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture()
def registrar_user(db):
    user = User.objects.create_user(username="registrar1", password="pass")
    group, _ = Group.objects.get_or_create(name="REGISTRAR")
    user.groups.add(group)
    user.is_staff = True
    user.save()
    return user


@pytest.fixture()
def registrar_client(registrar_user):
    """API client authenticated as registrar."""
    client = APIClient()
    client.force_authenticate(user=registrar_user)
    return client


@pytest.fixture()
def faculty_user(db):
    user = User.objects.create_user(username="faculty1", password="pass")
    group, _ = Group.objects.get_or_create(name="FACULTY")
    user.groups.add(group)
    user.is_staff = True
    user.save()
    return user


@pytest.fixture()
def faculty_client(faculty_user):
    """API client authenticated as faculty."""
    client = APIClient()
    client.force_authenticate(user=faculty_user)
    return client


@pytest.fixture()
def student_user(db):
    user = User.objects.create_user(username="STU-0001", password="pass")
    # MVP roles use uppercase "STUDENT"
    user.groups.add(Group.objects.get(name="STUDENT"))
    user.save()
    return user


@pytest.fixture()
def student_client(student_user):
    """API client authenticated as student."""
    client = APIClient()
    client.force_authenticate(user=student_user)
    return client


@pytest.fixture()
def finance_user(db):
    """Create a finance officer user."""
    user = User.objects.create_user(username="finance1", password="pass")
    group, _ = Group.objects.get_or_create(name="FINANCE")
    user.groups.add(group)
    user.is_staff = True
    user.save()
    return user


@pytest.fixture()
def finance_client(finance_user):
    """API client authenticated as finance officer."""
    client = APIClient()
    client.force_authenticate(user=finance_user)
    return client


@pytest.fixture()
def unauthenticated_client():
    """API client without authentication."""
    return APIClient()


@pytest.fixture()
def examcell_user(db):
    """Create an examcell user."""
    user = User.objects.create_user(username="examcell1", password="pass")
    group, _ = Group.objects.get_or_create(name="EXAMCELL")
    user.groups.add(group)
    user.is_staff = True
    user.save()
    return user


@pytest.fixture()
def examcell_client(examcell_user):
    """API client authenticated as examcell."""
    client = APIClient()
    client.force_authenticate(user=examcell_user)
    return client


@pytest.fixture()
def coordinator_user(db):
    """Create a coordinator user."""
    user = User.objects.create_user(username="coordinator1", password="pass")
    group, _ = Group.objects.get_or_create(name="COORDINATOR")
    user.groups.add(group)
    user.is_staff = True
    user.save()
    return user


@pytest.fixture()
def coordinator_client(coordinator_user):
    """API client authenticated as coordinator."""
    client = APIClient()
    client.force_authenticate(user=coordinator_user)
    return client


@pytest.fixture()
def office_assistant_user(db):
    """Create an office assistant user."""
    user = User.objects.create_user(username="office1", password="pass")
    group, _ = Group.objects.get_or_create(name="OFFICE_ASSISTANT")
    user.groups.add(group)
    user.is_staff = True
    user.save()
    return user


@pytest.fixture()
def office_assistant_client(office_assistant_user):
    """API client authenticated as office assistant."""
    client = APIClient()
    client.force_authenticate(user=office_assistant_user)
    return client



# ============================================================================
# Academic Structure Factories
# ============================================================================


@pytest.fixture()
def program(db):
    """Create a test program (e.g., MBBS)."""
    from sims_backend.academics.models import Program

    return Program.objects.create(
        name="MBBS",
        code="MBBS",
        duration_years=5,
        is_active=True,
    )


@pytest.fixture()
def batch(db, program):
    """Create a test batch (cohort) for a program."""
    from sims_backend.academics.models import Batch

    return Batch.objects.create(
        program=program,
        batch_number="2023",
        start_year=2023,
        is_active=True,
    )


@pytest.fixture()
def academic_period(db):
    """Create a test academic period (semester)."""
    from sims_backend.academics.models import AcademicPeriod

    return AcademicPeriod.objects.create(
        year=2024,
        semester=1,
        start_date="2024-01-01",
        end_date="2024-06-30",
        is_active=True,
    )


@pytest.fixture()
def department(db):
    """Create a test department."""
    from sims_backend.academics.models import Department

    return Department.objects.create(
        name="Internal Medicine",
        code="IM",
        is_active=True,
    )


@pytest.fixture()
def course(db, department):
    """Create a test course."""
    from sims_backend.academics.models import Course

    return Course.objects.create(
        name="Pharmacology I",
        code="PHARM101",
        department=department,
        credit_hours=3,
        is_active=True,
    )


@pytest.fixture()
def course_section(db, course, academic_period):
    """Create a test course section (offering)."""
    from sims_backend.academics.models import CourseSection

    return CourseSection.objects.create(
        course=course,
        academic_period=academic_period,
        section_number=1,
        capacity=30,
        instructor_name="Dr. Test",
        is_active=True,
    )


# ============================================================================
# Student Fixtures
# ============================================================================


@pytest.fixture()
def student(db, student_user, program, batch):
    """Create a test student with associated user."""
    from sims_backend.students.models import Student

    return Student.objects.create(
        user=student_user,
        student_id="STU-2023-001",
        program=program,
        batch=batch,
        registration_number="REG-2023-001",
        is_active=True,
    )


@pytest.fixture()
def another_student(db, program, batch):
    """Create another test student (for permission tests)."""
    from sims_backend.students.models import Student

    user = User.objects.create_user(username="STU-0002", password="pass")
    user.groups.add(Group.objects.get(name="STUDENT"))
    user.save()

    return Student.objects.create(
        user=user,
        student_id="STU-2023-002",
        program=program,
        batch=batch,
        registration_number="REG-2023-002",
        is_active=True,
    )


# ============================================================================
# Finance Fixtures
# ============================================================================


@pytest.fixture()
def voucher(db, student, academic_period):
    """Create a test voucher (fee demand)."""
    from sims_backend.finance.models import Voucher

    return Voucher.objects.create(
        student=student,
        academic_period=academic_period,
        amount=100000.00,
        due_date="2024-02-01",
        status="issued",
    )


@pytest.fixture()
def payment(db, voucher):
    """Create a test payment against a voucher."""
    from sims_backend.finance.models import Payment

    return Payment.objects.create(
        voucher=voucher,
        amount=50000.00,
        payment_date="2024-01-15",
        method="bank_transfer",
        status="completed",
    )


@pytest.fixture()
def multi_year_student_data(db):
    """Create a student with multi-year vouchers and payments for edge-case testing."""
    from sims_backend.academics.models import AcademicPeriod, Batch, Program
    from sims_backend.finance.models import Payment, Voucher
    from sims_backend.students.models import Student

    # Create user and student
    user = User.objects.create_user(
        username="multi_year_student",
        email="multiyear@test.local",
        password="test_password_123",
    )
    program = Program.objects.create(
        name="MBBS Extended",
        code="MBBS_EXT",
        duration_years=5,
        is_active=True,
    )
    batch = Batch.objects.create(
        program=program,
        batch_number="2022",
        start_year=2022,
        is_active=True,
    )
    student = Student.objects.create(
        user=user,
        student_id="STU-2022-MULTI",
        program=program,
        batch=batch,
        registration_number="REG-2022-MULTI",
        is_active=True,
    )

    # Create vouchers and payments across multiple years
    years_data = {}
    for year in [2023, 2024, 2025]:
        academic_period = AcademicPeriod.objects.create(
            year=year,
            semester=1,
            start_date=f"{year}-01-01",
            end_date=f"{year}-06-30",
            is_active=True,
        )

        # Create voucher for the year
        voucher = Voucher.objects.create(
            student=student,
            academic_period=academic_period,
            amount=100000.00,
            due_date=f"{year}-02-01",
            status="issued",
        )

        # Create partial payment (not full payment)
        payment = Payment.objects.create(
            voucher=voucher,
            amount=60000.00,
            payment_date=f"{year}-01-15",
            method="bank_transfer",
            status="completed",
        )

        years_data[year] = {
            "academic_period": academic_period,
            "voucher": voucher,
            "payment": payment,
            "remaining_balance": 40000.00,
        }

    return {
        "student": student,
        "user": user,
        "years_data": years_data,
    }


# ============================================================================
# Attendance Fixtures
# ============================================================================


@pytest.fixture()
def attendance(db, student, course_section):
    """Create a test attendance record."""
    from sims_backend.attendance.models import Attendance

    return Attendance.objects.create(
        student=student,
        course_section=course_section,
        date="2024-01-15",
        status="present",
    )


# ============================================================================
# Results Fixtures
# ============================================================================


@pytest.fixture()
def exam(db, course, academic_period):
    """Create a test exam."""
    from sims_backend.results.models import Exam

    return Exam.objects.create(
        course=course,
        academic_period=academic_period,
        exam_date="2024-06-01",
        max_marks=100,
        total_questions=50,
        is_active=True,
    )


@pytest.fixture()
def exam_result(db, exam, student):
    """Create a test exam result."""
    from sims_backend.results.models import ExamResult

    return ExamResult.objects.create(
        exam=exam,
        student=student,
        marks_obtained=85,
        status="draft",
    )


# ============================================================================
# Bulk Data Fixtures (for complex scenario tests)
# ============================================================================


@pytest.fixture()
def populated_academic_structure(db):
    """Create a full academic structure for integration tests."""
    from sims_backend.academics.models import (
        AcademicPeriod,
        Batch,
        Course,
        Department,
        Program,
    )

    program = Program.objects.create(
        name="MBBS",
        code="MBBS",
        duration_years=5,
        is_active=True,
    )

    batches = [
        Batch.objects.create(
            program=program,
            batch_number=str(year),
            start_year=year,
            is_active=True,
        )
        for year in range(2021, 2025)
    ]

    departments = [
        Department.objects.create(name="Internal Medicine", code="IM", is_active=True),
        Department.objects.create(name="Surgery", code="SUR", is_active=True),
        Department.objects.create(name="Pharmacology", code="PHARM", is_active=True),
    ]

    courses = []
    for dept in departments:
        for i in range(1, 4):
            course = Course.objects.create(
                name=f"Course {i} - {dept.name}",
                code=f"{dept.code}{i}01",
                department=dept,
                credit_hours=3,
                is_active=True,
            )
            courses.append(course)

    academic_periods = [
        AcademicPeriod.objects.create(
            year=year,
            semester=sem,
            start_date=f"{year}-{1 if sem == 1 else 7}-01",
            end_date=f"{year}-{6 if sem == 1 else 12}-30",
            is_active=True,
        )
        for year in range(2023, 2026)
        for sem in [1, 2]
    ]

    return {
        "program": program,
        "batches": batches,
        "departments": departments,
        "courses": courses,
        "academic_periods": academic_periods,
    }


@pytest.fixture()
def populated_students(db, populated_academic_structure):
    """Create multiple students linked to the academic structure."""
    from sims_backend.students.models import Student

    students = []
    for i in range(1, 11):
        user = User.objects.create_user(
            username=f"student_{i}",
            email=f"student_{i}@test.local",
            password="test_password_123",
        )
        user.groups.add(Group.objects.get(name="STUDENT"))
        user.save()

        student = Student.objects.create(
            user=user,
            student_id=f"STU-2023-{i:03d}",
            program=populated_academic_structure["program"],
            batch=populated_academic_structure["batches"][0],
            registration_number=f"REG-2023-{i:03d}",
            is_active=True,
        )
        students.append(student)

    return students

