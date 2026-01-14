"""Student CSV import service - core business logic"""
import csv
import io
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction
from django.utils import timezone

from sims_backend.students.imports.models import ImportJob
from sims_backend.students.imports.templates import get_expected_columns
from sims_backend.students.imports.utils import (
    normalize_row,
    parse_csv_file,
    parse_date_strict,
    safe_csv_export,
)
from sims_backend.students.imports.validators import (
    check_duplicate_in_file,
    check_existing_in_db,
    normalize_status,
    resolve_batch,
    resolve_group,
    resolve_program,
    validate_date_format,
    validate_email_format,
    validate_field_lengths,
    validate_required_fields,
    validate_status_choice,
)
from sims_backend.students.models import Student

User = get_user_model()


class StudentImportService:
    """Service for handling Student CSV imports"""

    @staticmethod
    def _extract_name_parts(name: str) -> Tuple[str, str]:
        """Extract first name and last name from full name."""
        parts = name.strip().split()
        if not parts:
            return 'student', 'user'
        first_name = parts[0].lower()
        last_name = ' '.join(parts[1:]).lower() if len(parts) > 1 else 'user'
        return first_name, last_name

    @staticmethod
    def _format_batch_year(graduation_year: Optional[int]) -> str:
        """Format graduation year as 2-digit batch code (e.g., 2031 -> 'b31')."""
        if not graduation_year:
            return 'b00'
        # Get last 2 digits of year
        year_2_digits = str(graduation_year)[-2:]
        return f"b{year_2_digits}"

    @staticmethod
    def _generate_username(name: str, graduation_year: Optional[int] = None) -> str:
        """
        Generate username in format: firstname.b{year}
        Example: 'john.b31' for John graduating in 2031
        """
        first_name, _ = StudentImportService._extract_name_parts(name)
        # Remove special characters and spaces, keep only alphanumeric
        first_name_clean = re.sub(r'[^a-zA-Z0-9]', '', first_name)
        batch_code = StudentImportService._format_batch_year(graduation_year)
        return f"{first_name_clean}.{batch_code}"

    @staticmethod
    def _generate_email(name: str, graduation_year: Optional[int] = None, provided_email: Optional[str] = None) -> str:
        """
        Generate email in format: firstname.lastname.b{year}@pmc.edu.pk
        Example: 'john.doe.b31@pmc.edu.pk' for John Doe graduating in 2031
        """
        if provided_email:
            return provided_email.strip()
        
        first_name, last_name = StudentImportService._extract_name_parts(name)
        # Remove special characters and spaces, keep only alphanumeric
        first_name_clean = re.sub(r'[^a-zA-Z0-9]', '', first_name)
        last_name_clean = re.sub(r'[^a-zA-Z0-9]', '', last_name.replace(' ', ''))
        batch_code = StudentImportService._format_batch_year(graduation_year)
        return f"{first_name_clean}.{last_name_clean}.{batch_code}@pmc.edu.pk"

    @staticmethod
    def _generate_password(graduation_year: Optional[int] = None) -> str:
        """
        Generate a default password for student account.
        Format: student{graduation_year} (e.g., student2031)
        """
        if graduation_year:
            return f"student{graduation_year}"
        # Fallback: generic password
        return "student123"

    @staticmethod
    def _create_student_user(
        student: Student,
        graduation_year: Optional[int] = None
    ) -> Tuple[User, bool]:
        """
        Create a user account for a student.
        
        Args:
            student: Student record
            graduation_year: Graduation year (from batch.start_year, which represents graduation year)
        
        Returns:
            Tuple[User, bool]: (user_object, created_flag)
        """
        # Extract name parts for username/email generation
        first_name, last_name = StudentImportService._extract_name_parts(student.name)
        
        # Generate username: firstname.b{year}
        username = StudentImportService._generate_username(student.name, graduation_year)
        
        # Generate email: firstname.lastname.b{year}@pmc.edu.pk
        email = StudentImportService._generate_email(student.name, graduation_year, student.email)
        
        # Generate password: student{graduation_year}
        password = StudentImportService._generate_password(graduation_year)
        
        # Check if user already exists
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': first_name.capitalize(),
                'last_name': last_name.title(),
            }
        )
        
        # Set password if user was just created
        if created:
            user.set_password(password)
            user.save()
        else:
            # Update email if it changed
            if user.email != email:
                user.email = email
                user.save(update_fields=['email'])
        
        # Ensure user is in Student group
        student_group, _ = Group.objects.get_or_create(name="STUDENT")
        user.groups.add(student_group)
        
        # Link user to student if not already linked
        if not student.user:
            student.user = user
            student.save(update_fields=['user'])
        
        # Update student email if it was auto-generated
        if not student.email or student.email.endswith('@sims.edu'):
            student.email = email
            student.save(update_fields=['email'])
        
        return user, created

    @staticmethod
    def preview(file, user, mode: str = ImportJob.MODE_CREATE_ONLY) -> Dict[str, Any]:
        """
        Phase 1: Parse and validate CSV file without writing to database.
        Returns preview results with validation summary.
        """
        # Create ImportJob
        import_job = ImportJob.objects.create(
            created_by=user,
            mode=mode,
            original_filename=file.name,
            status=ImportJob.STATUS_PENDING,
        )
        
        # Compute file hash
        file_hash = ImportJob.compute_file_hash(file)
        import_job.file_hash = file_hash
        
        # Check for duplicate file hash (warn but don't block)
        duplicate_job = ImportJob.objects.filter(
            file_hash=file_hash,
            mode=mode,
            status=ImportJob.STATUS_COMMITTED
        ).exclude(id=import_job.id).first()
        
        # Save file
        import_job.file.save(file.name, file, save=True)
        
        # Parse CSV
        try:
            rows = parse_csv_file(import_job.file)
        except Exception as e:
            import_job.status = ImportJob.STATUS_FAILED
            import_job.save()
            raise ValueError(f"Failed to parse CSV file: {str(e)}")
        
        # Validate rows
        preview_rows = []
        seen_reg_nos = {}
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
            
            reg_no = normalized_row.get("reg_no", "").strip()
            
            # Check duplicates in file
            errors.extend(check_duplicate_in_file(reg_no, idx, seen_reg_nos))
            
            # Validate status choice
            status_raw = normalized_row.get("status", "").strip()
            errors.extend(validate_status_choice(status_raw, row_num))
            
            # Resolve FK relationships
            program, program_errors = resolve_program(normalized_row.get("program_name"), row_num)
            errors.extend(program_errors)
            
            batch, batch_errors = resolve_batch(
                normalized_row.get("batch_name"),
                program,
                row_num
            )
            errors.extend(batch_errors)
            
            group, group_errors = resolve_group(
                normalized_row.get("group_name"),
                batch,
                row_num
            )
            errors.extend(group_errors)
            
            # Validate field lengths
            errors.extend(validate_field_lengths(normalized_row, row_num))
            
            # Validate email format
            errors.extend(validate_email_format(normalized_row.get("email"), row_num))
            
            # Validate date format
            errors.extend(validate_date_format(normalized_row.get("date_of_birth"), row_num))
            
            # Check existing in DB (for create_only mode)
            if mode == ImportJob.MODE_CREATE_ONLY:
                exists, existing_student = check_existing_in_db(reg_no, mode)
                if exists:
                    errors.append({
                        "column": "reg_no",
                        "message": f"Student with reg_no '{reg_no}' already exists. Use UPSERT mode to update."
                    })
            
            # Determine action
            if errors:
                invalid_count += 1
                action = "SKIP"
            else:
                valid_count += 1
                # Check if will be created or updated
                exists, existing_student = check_existing_in_db(reg_no, mode)
                if exists and mode == ImportJob.MODE_UPSERT:
                    action = "UPDATE"
                else:
                    action = "CREATE"
            
            preview_rows.append({
                "row_number": row_num,
                "action": action,
                "errors": errors,
                "data": normalized_row,
            })
        
        # Update ImportJob with preview results
        import_job.total_rows = total_rows
        import_job.valid_rows = valid_count
        import_job.invalid_rows = invalid_count
        import_job.status = ImportJob.STATUS_PREVIEWED
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
            import_job = ImportJob.objects.get(id=import_job_id)
        except ImportJob.DoesNotExist:
            raise ValueError(f"ImportJob {import_job_id} not found")
        
        # Ensure job is in PREVIEWED status
        if import_job.status != ImportJob.STATUS_PREVIEWED:
            raise ValueError(f"ImportJob must be in PREVIEWED status. Current status: {import_job.status}")
        
        # Re-parse and re-validate (for safety)
        rows = parse_csv_file(import_job.file)
        
        created_count = 0
        updated_count = 0
        failed_count = 0
        error_rows = []
        seen_reg_nos = {}
        
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
            
            reg_no = normalized_row.get("reg_no", "").strip()
            errors.extend(check_duplicate_in_file(reg_no, idx, seen_reg_nos))
            
            # Resolve FKs
            program, program_errors = resolve_program(normalized_row.get("program_name"), row_num)
            errors.extend(program_errors)
            
            batch, batch_errors = resolve_batch(
                normalized_row.get("batch_name"),
                program,
                row_num
            )
            errors.extend(batch_errors)
            
            group, group_errors = resolve_group(
                normalized_row.get("group_name"),
                batch,
                row_num
            )
            errors.extend(group_errors)
            
            # Additional validations
            status_raw = normalized_row.get("status", "").strip()
            errors.extend(validate_status_choice(status_raw, row_num))
            status = normalize_status(status_raw)  # Normalize to exact choice value
            # Safety: use default if status is None (shouldn't happen if validation passed)
            if not status:
                status = Student.STATUS_ACTIVE
            errors.extend(validate_field_lengths(normalized_row, row_num))
            errors.extend(validate_email_format(normalized_row.get("email"), row_num))
            
            # Parse date
            date_of_birth = None
            if normalized_row.get("date_of_birth"):
                date_of_birth_str = parse_date_strict(normalized_row.get("date_of_birth"))
                if date_of_birth_str:
                    try:
                        date_of_birth = datetime.strptime(date_of_birth_str, "%Y-%m-%d").date()
                    except ValueError:
                        errors.append({
                            "column": "date_of_birth",
                            "message": "Invalid date format"
                        })
            
            if errors:
                failed_count += 1
                error_rows.append({
                    **normalized_row,
                    "error_message": "; ".join([e["message"] for e in errors]),
                })
                continue
            
            # Create or update Student
            try:
                exists, existing_student = check_existing_in_db(reg_no, import_job.mode)
                
                if exists and import_job.mode == ImportJob.MODE_UPSERT:
                    # Update existing
                    existing_student.name = normalized_row.get("name")
                    existing_student.program = program
                    existing_student.batch = batch
                    existing_student.group = group
                    existing_student.status = status
                    if normalized_row.get("email"):
                        existing_student.email = normalized_row.get("email")
                    if normalized_row.get("phone"):
                        existing_student.phone = normalized_row.get("phone")
                    if date_of_birth:
                        existing_student.date_of_birth = date_of_birth
                    existing_student.save()
                    
                    # Create user account if it doesn't exist
                    if not existing_student.user:
                        try:
                            # batch.start_year represents graduation year
                            graduation_year = batch.start_year if hasattr(batch, 'start_year') else None
                            StudentImportService._create_student_user(
                                student=existing_student,
                                graduation_year=graduation_year
                            )
                        except Exception as user_error:
                            import logging
                            logger = logging.getLogger(__name__)
                            logger.warning(
                                f"Failed to create user account for existing student {reg_no}: {str(user_error)}"
                            )
                    
                    updated_count += 1
                elif not exists:
                    # Create new
                    # Use provided email or it will be auto-generated in _create_student_user
                    student_email = normalized_row.get("email") or ""
                    
                    student = Student.objects.create(
                        reg_no=reg_no,
                        name=normalized_row.get("name"),
                        program=program,
                        batch=batch,
                        group=group,
                        status=status,
                        email=student_email,
                        phone=normalized_row.get("phone") or "",
                        date_of_birth=date_of_birth,
                    )
                    
                    # Create user account for the student
                    try:
                        # batch.start_year represents graduation year
                        graduation_year = batch.start_year if hasattr(batch, 'start_year') else None
                        user, user_created = StudentImportService._create_student_user(
                            student=student,
                            graduation_year=graduation_year
                        )
                    except Exception as user_error:
                        # Log error but don't fail the import
                        # Student record is created, user can be created later
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.warning(
                            f"Failed to create user account for student {reg_no}: {str(user_error)}"
                        )
                    
                    created_count += 1
                else:
                    # CREATE_ONLY mode but student exists
                    failed_count += 1
                    error_rows.append({
                        **normalized_row,
                        "error_message": f"Student with reg_no '{reg_no}' already exists. Use UPSERT mode to update.",
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
        
        # Update ImportJob
        import_job.created_count = created_count
        import_job.updated_count = updated_count
        import_job.failed_count = failed_count
        import_job.status = ImportJob.STATUS_COMMITTED
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
