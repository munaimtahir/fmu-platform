"""Faculty CSV import service - core business logic"""
import csv
import io
import re
from typing import Any, Dict, List, Optional, Tuple

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction
from django.utils import timezone

from core.models import FacultyProfile
from sims_backend.academics.models import Department
from sims_backend.faculty.imports.models import FacultyImportJob
from sims_backend.faculty.imports.templates import get_expected_columns
from sims_backend.faculty.imports.utils import (
    normalize_row,
    parse_csv_file,
    safe_csv_export,
)
from sims_backend.students.imports.validators import (
    validate_email_format,
    validate_field_lengths,
)

User = get_user_model()


def resolve_department(department_name: Optional[str], row_num: int) -> Tuple[Optional[Department], List[Dict[str, str]]]:
    """
    Resolve department by name (case-insensitive).
    Returns (department_object, errors_list)
    """
    errors = []
    if not department_name:
        errors.append({
            "column": "department_name",
            "message": "Department name is required"
        })
        return None, errors
    
    department_name = department_name.strip()
    department = Department.objects.filter(name__iexact=department_name).first()
    
    if not department:
        errors.append({
            "column": "department_name",
            "message": f"Department '{department_name}' not found. Please create it first."
        })
    
    return department, errors


def validate_required_fields(row: Dict[str, str], row_num: int) -> List[Dict[str, str]]:
    """Validate that all required fields are present and non-empty."""
    errors = []
    required_fields = ["name", "department_name"]
    
    for field in required_fields:
        value = row.get(field)
        if not value or not str(value).strip():
            errors.append({
                "column": field,
                "message": f"Required field '{field}' is missing or empty"
            })
    
    return errors


def check_existing_faculty(email: str, mode: str) -> Tuple[bool, Optional[FacultyProfile]]:
    """
    Check if faculty already exists by email.
    Returns (exists, faculty_profile)
    """
    if not email:
        return False, None
    
    try:
        user = User.objects.get(email__iexact=email)
        if hasattr(user, 'faculty_profile'):
            return True, user.faculty_profile
    except User.DoesNotExist:
        pass
    
    return False, None


def check_duplicate_in_file(email: str, row_index: int, seen_emails: Dict[str, int]) -> List[Dict[str, str]]:
    """Check for duplicate emails within the file."""
    errors = []
    if email:
        email_lower = email.lower()
        if email_lower in seen_emails:
            errors.append({
                "column": "email",
                "message": f"Duplicate email '{email}' found in row {seen_emails[email_lower]}"
            })
        else:
            seen_emails[email_lower] = row_index + 2  # +2 for header and 0-index
    return errors


class FacultyImportService:
    """Service for handling Faculty CSV imports"""

    @staticmethod
    def _extract_name_parts(name: str) -> Tuple[str, str]:
        """Extract first name and last name from full name."""
        parts = name.strip().split()
        if not parts:
            return 'faculty', 'user'
        first_name = parts[0].lower()
        last_name = ' '.join(parts[1:]).lower() if len(parts) > 1 else 'user'
        return first_name, last_name

    @staticmethod
    def _generate_username(name: str) -> str:
        """
        Generate username in format: firstname.lastname
        Example: 'john.smith' for John Smith
        """
        first_name, last_name = FacultyImportService._extract_name_parts(name)
        # Remove special characters and spaces, keep only alphanumeric
        first_name_clean = re.sub(r'[^a-zA-Z0-9]', '', first_name)
        last_name_clean = re.sub(r'[^a-zA-Z0-9]', '', last_name.replace(' ', ''))
        return f"{first_name_clean}.{last_name_clean}"

    @staticmethod
    def _generate_email(name: str, provided_email: Optional[str] = None) -> str:
        """
        Generate email in format: firstname.lastname@pmc.edu.pk
        Example: 'john.smith@pmc.edu.pk' for John Smith
        """
        if provided_email:
            return provided_email.strip()
        
        first_name, last_name = FacultyImportService._extract_name_parts(name)
        # Remove special characters and spaces, keep only alphanumeric
        first_name_clean = re.sub(r'[^a-zA-Z0-9]', '', first_name)
        last_name_clean = re.sub(r'[^a-zA-Z0-9]', '', last_name.replace(' ', ''))
        return f"{first_name_clean}.{last_name_clean}@pmc.edu.pk"

    @staticmethod
    def _generate_password() -> str:
        """Generate a default password for faculty account."""
        return "faculty123"

    @staticmethod
    def _create_faculty_user(
        name: str,
        email: str,
        department: Optional[Department] = None
    ) -> Tuple[User, bool]:
        """
        Create a user account for a faculty member.
        
        Args:
            name: Full name of faculty
            email: Email address
            department: Department object (optional)
        
        Returns:
            Tuple[User, bool]: (user_object, created_flag)
        """
        # Extract name parts for username/email generation
        first_name, last_name = FacultyImportService._extract_name_parts(name)
        
        # Generate username: firstname.lastname
        username = FacultyImportService._generate_username(name)
        
        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Generate password
        password = FacultyImportService._generate_password()
        
        # Check if user already exists by email
        user = None
        created = False
        try:
            user = User.objects.get(email__iexact=email)
            # User exists, update username if different
            if user.username != username:
                # Check if new username is available
                if not User.objects.filter(username=username).exists():
                    user.username = username
                    user.save(update_fields=['username'])
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name.capitalize(),
                last_name=last_name.title(),
            )
            created = True
        
        # Ensure user is in Faculty group
        faculty_group, _ = Group.objects.get_or_create(name="FACULTY")
        user.groups.add(faculty_group)
        
        # Create or update FacultyProfile
        faculty_profile, profile_created = FacultyProfile.objects.get_or_create(
            user=user,
            defaults={'department': department}
        )
        
        # Update department if provided and different
        if department and faculty_profile.department != department:
            faculty_profile.department = department
            faculty_profile.save(update_fields=['department'])
        
        return user, created

    @staticmethod
    def preview(file, user, mode: str = FacultyImportJob.MODE_CREATE_ONLY) -> Dict[str, Any]:
        """
        Phase 1: Parse and validate CSV file without writing to database.
        Returns preview results with validation summary.
        """
        # Create FacultyImportJob
        import_job = FacultyImportJob.objects.create(
            created_by=user,
            mode=mode,
            original_filename=file.name,
            status=FacultyImportJob.STATUS_PENDING,
        )
        
        # Compute file hash
        file_hash = FacultyImportJob.compute_file_hash(file)
        import_job.file_hash = file_hash
        
        # Check for duplicate file hash (warn but don't block)
        duplicate_job = FacultyImportJob.objects.filter(
            file_hash=file_hash,
            mode=mode,
            status=FacultyImportJob.STATUS_COMMITTED
        ).exclude(id=import_job.id).first()
        
        # Save file
        import_job.file.save(file.name, file, save=True)
        
        # Parse CSV
        try:
            rows = parse_csv_file(import_job.file)
        except Exception as e:
            import_job.status = FacultyImportJob.STATUS_FAILED
            import_job.save()
            raise ValueError(f"Failed to parse CSV file: {str(e)}")
        
        # Validate rows
        preview_rows = []
        seen_emails = {}
        total_rows = len(rows)
        valid_count = 0
        invalid_count = 0
        
        for idx, row in enumerate(rows):
            row_num = idx + 2  # +2 because row 1 is header, and we're 0-indexed
            normalized_row = normalize_row(row)
            
            # Collect all errors for this row
            errors = []
            
            # Validate required fields
            errors.extend(validate_required_fields(normalized_row, row_num))
            
            # If required fields are missing, skip other validations
            if errors:
                invalid_count += 1
                preview_rows.append({
                    "row_number": row_num,
                    "action": "SKIP",
                    "errors": errors,
                    "data": normalized_row,
                })
                continue
            
            name = normalized_row.get("name", "").strip()
            email = normalized_row.get("email") or ""
            if not email:
                email = FacultyImportService._generate_email(name)
            
            # Check duplicates in file
            errors.extend(check_duplicate_in_file(email, idx, seen_emails))
            
            # Resolve FK relationships
            department, department_errors = resolve_department(normalized_row.get("department_name"), row_num)
            errors.extend(department_errors)
            
            # Validate field lengths
            errors.extend(validate_field_lengths(normalized_row, row_num))
            
            # Validate email format
            errors.extend(validate_email_format(email, row_num))
            
            # Check existing in DB (for create_only mode)
            if mode == FacultyImportJob.MODE_CREATE_ONLY:
                exists, existing_faculty = check_existing_faculty(email, mode)
                if exists:
                    errors.append({
                        "column": "email",
                        "message": f"Faculty with email '{email}' already exists. Use UPSERT mode to update."
                    })
            
            # Determine action
            if errors:
                invalid_count += 1
                action = "SKIP"
            else:
                valid_count += 1
                # Check if will be created or updated
                exists, existing_faculty = check_existing_faculty(email, mode)
                if exists and mode == FacultyImportJob.MODE_UPSERT:
                    action = "UPDATE"
                else:
                    action = "CREATE"
            
            preview_rows.append({
                "row_number": row_num,
                "action": action,
                "errors": errors,
                "data": normalized_row,
            })
        
        # Update FacultyImportJob with preview results
        import_job.total_rows = total_rows
        import_job.valid_rows = valid_count
        import_job.invalid_rows = invalid_count
        import_job.status = FacultyImportJob.STATUS_PREVIEWED
        import_job.save()
        
        # Prepare response
        response = {
            "import_job_id": str(import_job.id),
            "total_rows": total_rows,
            "valid_rows": valid_count,
            "invalid_rows": invalid_count,
            "duplicate_file_warning": duplicate_job is not None,
            "preview_rows": preview_rows[:50],  # First 50 rows for preview
            "summary": {
                "create_count": sum(1 for r in preview_rows if r["action"] == "CREATE"),
                "update_count": sum(1 for r in preview_rows if r["action"] == "UPDATE"),
                "skip_count": sum(1 for r in preview_rows if r["action"] == "SKIP"),
            }
        }
        
        return response

    @staticmethod
    @transaction.atomic
    def commit(import_job_id: str, user) -> Dict[str, Any]:
        """
        Phase 2: Commit validated rows to database.
        Only processes rows that were marked as valid in preview.
        """
        try:
            import_job = FacultyImportJob.objects.get(id=import_job_id)
        except FacultyImportJob.DoesNotExist:
            raise ValueError(f"FacultyImportJob {import_job_id} not found")
        
        # Ensure job is in PREVIEWED status
        if import_job.status != FacultyImportJob.STATUS_PREVIEWED:
            raise ValueError(f"FacultyImportJob must be in PREVIEWED status. Current status: {import_job.status}")
        
        # Re-parse and re-validate (for safety)
        rows = parse_csv_file(import_job.file)
        
        created_count = 0
        updated_count = 0
        failed_count = 0
        error_rows = []
        seen_emails = {}
        
        for idx, row in enumerate(rows):
            row_num = idx + 2
            normalized_row = normalize_row(row)
            
            # Quick validation (same as preview)
            errors = []
            errors.extend(validate_required_fields(normalized_row, row_num))
            
            if errors:
                failed_count += 1
                error_rows.append({
                    **normalized_row,
                    "error_message": "; ".join([e["message"] for e in errors]),
                })
                continue
            
            name = normalized_row.get("name", "").strip()
            email = normalized_row.get("email") or ""
            if not email:
                email = FacultyImportService._generate_email(name)
            
            errors.extend(check_duplicate_in_file(email, idx, seen_emails))
            
            # Resolve FKs
            department, department_errors = resolve_department(normalized_row.get("department_name"), row_num)
            errors.extend(department_errors)
            
            # Additional validations
            errors.extend(validate_field_lengths(normalized_row, row_num))
            errors.extend(validate_email_format(email, row_num))
            
            if errors:
                failed_count += 1
                error_rows.append({
                    **normalized_row,
                    "error_message": "; ".join([e["message"] for e in errors]),
                })
                continue
            
            # Create or update Faculty
            try:
                exists, existing_faculty = check_existing_faculty(email, import_job.mode)
                
                if exists and import_job.mode == FacultyImportJob.MODE_UPSERT:
                    # Update existing
                    if existing_faculty:
                        if department:
                            existing_faculty.department = department
                            existing_faculty.save(update_fields=['department'])
                    updated_count += 1
                elif not exists:
                    # Create new
                    user_obj, user_created = FacultyImportService._create_faculty_user(
                        name=name,
                        email=email,
                        department=department
                    )
                    created_count += 1
                else:
                    # CREATE_ONLY mode but faculty exists
                    failed_count += 1
                    error_rows.append({
                        **normalized_row,
                        "error_message": f"Faculty with email '{email}' already exists. Use UPSERT mode to update.",
                    })
                else:
                    # CREATE_ONLY mode but faculty exists
                    failed_count += 1
                    error_rows.append({
                        **normalized_row,
                        "error_message": f"Faculty with email '{email}' already exists. Use UPSERT mode to update.",
                    })
            except Exception as e:
                failed_count += 1
                error_rows.append({
                    **normalized_row,
                    "error_message": f"Database error: {str(e)}",
                })
        
        # Generate error CSV if there are errors
        error_report_file = None
        if error_rows:
            error_fieldnames = get_expected_columns() + ["error_message"]
            error_csv_content = safe_csv_export(error_rows, error_fieldnames)
            error_filename = f"errors_{import_job.id}.csv"
            error_report_file = io.BytesIO(error_csv_content)
            import_job.error_report_file.save(error_filename, error_report_file, save=False)
        
        # Update FacultyImportJob
        import_job.created_count = created_count
        import_job.updated_count = updated_count
        import_job.failed_count = failed_count
        import_job.status = FacultyImportJob.STATUS_COMMITTED
        import_job.finished_at = timezone.now()
        import_job.summary = {
            "created": created_count,
            "updated": updated_count,
            "failed": failed_count,
            "total_processed": created_count + updated_count + failed_count,
        }
        import_job.save()
        
        return {
            "import_job_id": str(import_job.id),
            "status": import_job.status,
            "created_count": created_count,
            "updated_count": updated_count,
            "failed_count": failed_count,
            "has_error_report": error_report_file is not None,
        }
