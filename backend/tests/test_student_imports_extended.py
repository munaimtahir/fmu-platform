import pytest
from sims_backend.students.imports.services import StudentImportService

def test_extract_name_parts():
    # Regular name
    assert StudentImportService._extract_name_parts("John Doe") == ("john", "doe")
    # Single name
    assert StudentImportService._extract_name_parts("John") == ("john", "user")
    # Multiple parts
    assert StudentImportService._extract_name_parts("John Quincy Adams") == ("john", "quincy adams")
    # Empty
    assert StudentImportService._extract_name_parts(" ") == ("student", "user")

def test_format_batch_year():
    assert StudentImportService._format_batch_year(2031) == "b31"
    assert StudentImportService._format_batch_year(2024) == "b24"
    assert StudentImportService._format_batch_year(None) == "b00"

def test_generate_username():
    assert StudentImportService._generate_username("John Doe", 2031) == "john.b31"
    assert StudentImportService._generate_username("O'Connor", 2024) == "oconnor.b24"

def test_generate_email():
    assert StudentImportService._generate_email("John Doe", 2031) == "john.doe.b31@pmc.edu.pk"
    # Provided email should override
    assert StudentImportService._generate_email("John Doe", 2031, "custom@test.com") == "custom@test.com"

def test_generate_password():
    assert StudentImportService._generate_password(2031) == "student2031"
    assert StudentImportService._generate_password(None) == "student123"

@pytest.mark.django_db
def test_create_student_user(db):
    from sims_backend.students.models import Student
    from sims_backend.academics.models import Program, Batch, Group as AcadGroup
    program = Program.objects.create(name="MBBS")
    batch = Batch.objects.create(program=program, name="2031", start_year=2031) # start_year is grad year here
    group = AcadGroup.objects.create(batch=batch, name="A")
    
    student = Student.objects.create(reg_no="REG-123", name="John Doe", program=program, batch=batch, group=group)
    
    user, created = StudentImportService._create_student_user(student, graduation_year=2031)
    assert created is True
    assert user.username == "john.b31"
    assert user.email == "john.doe.b31@pmc.edu.pk"
    assert user.groups.filter(name="STUDENT").exists()
    assert student.user == user
