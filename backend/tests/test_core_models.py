import time

import pytest
from django.utils import timezone

from sims_backend.academics.models import Program
from sims_backend.admissions.models import Student


@pytest.mark.django_db
class TestTimeStampedModel:
    def test_student_has_timestamp_fields(self):
        student = Student.objects.create(
            reg_no="REG-001",
            name="Test Student",
            program="BSc Computer Science",
            status="active",
        )

        assert student.created_at is not None
        assert student.updated_at is not None
        assert student.created_at <= timezone.now()
        assert student.updated_at <= timezone.now()

    def test_updated_at_changes_on_save(self):
        student = Student.objects.create(
            reg_no="REG-002",
            name="Another Student",
            program="BSc Information Technology",
            status="active",
        )

        original_updated = student.updated_at
        time.sleep(0.1)
        student.status = "inactive"
        student.save()
        student.refresh_from_db()

        assert student.updated_at > original_updated

        second_checkpoint = student.updated_at
        time.sleep(0.1)
        student.touch()
        student.refresh_from_db()

        assert student.updated_at > second_checkpoint

    def test_program_has_timestamp_fields(self):
        """Test that Program model inherits timestamp fields from TimeStampedModel."""
        program = Program.objects.create(name="BSc Computer Science")

        assert program.created_at is not None
        assert program.updated_at is not None
        assert program.created_at <= timezone.now()
        assert program.updated_at <= timezone.now()

    def test_program_updated_at_changes_on_save(self):
        """Test that Program model's updated_at changes when saved."""
        program = Program.objects.create(name="BSc Information Technology")

        original_updated = program.updated_at
        time.sleep(0.1)
        program.name = "BSc IT (Updated)"
        program.save()
        program.refresh_from_db()

        assert program.updated_at > original_updated
