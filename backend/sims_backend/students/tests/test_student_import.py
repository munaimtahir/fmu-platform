"""
Tests for Student CSV import functionality.

This test suite covers:
- CSV parsing and normalization
- Dry-run preview (no DB writes)
- FK resolution (Program/Batch/Group)
- Validation (required fields, duplicates, formats)
- Create-only mode
- Upsert mode
- Commit phase with transactions
- Error CSV generation
"""
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from sims_backend.academics.models import Batch, Group, Program
from sims_backend.students.imports.models import ImportJob
from sims_backend.students.imports.services import StudentImportService
from sims_backend.students.imports.utils import parse_csv_file, normalize_row
from sims_backend.students.models import Student

User = get_user_model()


class CSVParsingTests(TestCase):
    """Tests for CSV parsing and normalization utilities"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )

    def test_parse_csv_basic(self):
        """Test basic CSV parsing"""
        csv_content = b"reg_no,name,program_name,batch_name,group_name,status\nSTU001,John Doe,MBBS,2024 Batch,Group A,active"
        file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")
        
        rows = parse_csv_file(file)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["reg_no"], "STU001")
        self.assertEqual(rows[0]["name"], "John Doe")

    def test_normalize_row(self):
        """Test row normalization (trim whitespace)"""
        row = {"reg_no": "  STU001  ", "name": "  John Doe  "}
        normalized = normalize_row(row)
        self.assertEqual(normalized["reg_no"], "STU001")
        self.assertEqual(normalized["name"], "John Doe")


class StudentImportPreviewTests(TestCase):
    """Tests for preview phase (dry-run, no DB writes)"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        
        # Create test data
        self.program = Program.objects.create(name="MBBS")
        self.batch = Batch.objects.create(program=self.program, name="2024 Batch", start_year=2024)
        self.group = Group.objects.create(batch=self.batch, name="Group A")

    def test_preview_valid_row(self):
        """Test preview with valid row"""
        csv_content = b"reg_no,name,program_name,batch_name,group_name,status\nSTU001,John Doe,MBBS,2024 Batch,Group A,active"
        file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")
        
        result = StudentImportService.preview(file, self.user, ImportJob.MODE_CREATE_ONLY)
        
        self.assertEqual(result["total_rows"], 1)
        self.assertEqual(result["valid_rows"], 1)
        self.assertEqual(result["invalid_rows"], 0)
        self.assertEqual(result["preview_rows"][0]["action"], "CREATE")
        
        # Verify no students were created
        self.assertEqual(Student.objects.count(), 0)

    def test_preview_missing_required_field(self):
        """Test preview with missing required field"""
        csv_content = b"reg_no,name,program_name,batch_name,group_name,status\n,John Doe,MBBS,2024 Batch,Group A,active"
        file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")
        
        result = StudentImportService.preview(file, self.user, ImportJob.MODE_CREATE_ONLY)
        
        self.assertEqual(result["invalid_rows"], 1)
        self.assertEqual(result["preview_rows"][0]["action"], "SKIP")
        self.assertTrue(len(result["preview_rows"][0]["errors"]) > 0)

    def test_preview_duplicate_in_file(self):
        """Test preview detects duplicates within file"""
        csv_content = b"reg_no,name,program_name,batch_name,group_name,status\nSTU001,John Doe,MBBS,2024 Batch,Group A,active\nSTU001,Jane Doe,MBBS,2024 Batch,Group A,active"
        file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")
        
        result = StudentImportService.preview(file, self.user, ImportJob.MODE_CREATE_ONLY)
        
        self.assertEqual(result["invalid_rows"], 1)
        # Second row should have duplicate error
        self.assertTrue(any("Duplicate" in str(e) for e in result["preview_rows"][1]["errors"]))

    def test_preview_unknown_program(self):
        """Test preview with unknown program"""
        csv_content = b"reg_no,name,program_name,batch_name,group_name,status\nSTU001,John Doe,UNKNOWN,2024 Batch,Group A,active"
        file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")
        
        result = StudentImportService.preview(file, self.user, ImportJob.MODE_CREATE_ONLY)
        
        self.assertEqual(result["invalid_rows"], 1)
        self.assertTrue(any("Unknown program" in str(e) for e in result["preview_rows"][0]["errors"]))


class StudentImportCommitTests(TestCase):
    """Tests for commit phase (actual DB writes)"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        
        # Create test data
        self.program = Program.objects.create(name="MBBS")
        self.batch = Batch.objects.create(program=self.program, name="2024 Batch", start_year=2024)
        self.group = Group.objects.create(batch=self.batch, name="Group A")

    def test_commit_create_only(self):
        """Test commit in create-only mode"""
        csv_content = b"reg_no,name,program_name,batch_name,group_name,status\nSTU001,John Doe,MBBS,2024 Batch,Group A,active"
        file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")
        
        # Preview first
        preview_result = StudentImportService.preview(file, self.user, ImportJob.MODE_CREATE_ONLY)
        import_job_id = preview_result["import_job_id"]
        
        # Commit
        commit_result = StudentImportService.commit(import_job_id, self.user)
        
        self.assertEqual(commit_result["created_count"], 1)
        self.assertEqual(commit_result["updated_count"], 0)
        self.assertEqual(Student.objects.count(), 1)
        
        student = Student.objects.get(reg_no="STU001")
        self.assertEqual(student.name, "John Doe")
        self.assertEqual(student.program, self.program)

    def test_commit_upsert_updates_existing(self):
        """Test commit in upsert mode updates existing student"""
        # Create existing student
        existing_student = Student.objects.create(
            reg_no="STU001",
            name="Old Name",
            program=self.program,
            batch=self.batch,
            group=self.group,
            status=Student.STATUS_ACTIVE,
        )
        
        csv_content = b"reg_no,name,program_name,batch_name,group_name,status\nSTU001,New Name,MBBS,2024 Batch,Group A,active"
        file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")
        
        # Preview
        preview_result = StudentImportService.preview(file, self.user, ImportJob.MODE_UPSERT)
        import_job_id = preview_result["import_job_id"]
        
        # Commit
        commit_result = StudentImportService.commit(import_job_id, self.user)
        
        self.assertEqual(commit_result["created_count"], 0)
        self.assertEqual(commit_result["updated_count"], 1)
        self.assertEqual(Student.objects.count(), 1)
        
        existing_student.refresh_from_db()
        self.assertEqual(existing_student.name, "New Name")

    def test_commit_create_only_rejects_existing(self):
        """Test commit in create-only mode rejects existing students"""
        # Create existing student
        Student.objects.create(
            reg_no="STU001",
            name="Existing",
            program=self.program,
            batch=self.batch,
            group=self.group,
            status=Student.STATUS_ACTIVE,
        )
        
        csv_content = b"reg_no,name,program_name,batch_name,group_name,status\nSTU001,New Name,MBBS,2024 Batch,Group A,active"
        file = SimpleUploadedFile("test.csv", csv_content, content_type="text/csv")
        
        # Preview (should show error)
        preview_result = StudentImportService.preview(file, self.user, ImportJob.MODE_CREATE_ONLY)
        self.assertEqual(preview_result["invalid_rows"], 1)
        
        # Commit (should fail for that row)
        import_job_id = preview_result["import_job_id"]
        commit_result = StudentImportService.commit(import_job_id, self.user)
        
        self.assertEqual(commit_result["created_count"], 0)
        self.assertEqual(commit_result["failed_count"], 1)
