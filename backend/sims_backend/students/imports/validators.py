"""Row validation helpers for Student CSV import"""
from typing import Dict, List, Optional, Tuple

from sims_backend.academics.models import Batch, Group, Program
from sims_backend.students.models import Student


class RowValidationError(Exception):
    """Custom exception for row validation errors"""
    pass


def validate_required_fields(row: Dict[str, str], row_num: int) -> List[Dict[str, str]]:
    """
    Validate that all required fields are present and non-empty.
    Returns list of errors: [{"column": "...", "message": "..."}]
    """
    errors = []
    required_fields = ["reg_no", "name", "program_name", "batch_name", "group_name", "status"]
    
    for field in required_fields:
        value = row.get(field)
        if not value or not str(value).strip():
            errors.append({
                "column": field,
                "message": f"Required field '{field}' is missing or empty"
            })
    
    return errors


def validate_status_choice(status: Optional[str], row_num: int) -> List[Dict[str, str]]:
    """Validate status field against allowed choices (case-insensitive)"""
    errors = []
    if status:
        status_lower = status.lower()
        valid_statuses = [choice[0] for choice in Student.STATUS_CHOICES]
        valid_statuses_lower = [s.lower() for s in valid_statuses]
        if status_lower not in valid_statuses_lower:
            errors.append({
                "column": "status",
                "message": f"Invalid status '{status}'. Must be one of: {', '.join(valid_statuses)}"
            })
    return errors


def normalize_status(status: Optional[str]) -> Optional[str]:
    """
    Normalize status to exact choice value (case-insensitive match).
    Returns the exact choice value or None if invalid.
    """
    if not status:
        return None
    
    status_lower = status.lower().strip()
    valid_statuses = [choice[0] for choice in Student.STATUS_CHOICES]
    
    for valid_status in valid_statuses:
        if valid_status.lower() == status_lower:
            return valid_status
    
    return None


def resolve_program(program_name: Optional[str], row_num: int, auto_create: bool = False) -> Tuple[Optional[Program], List[Dict[str, str]]]:
    """
    Resolve Program by name (case-insensitive).
    If auto_create=True and program doesn't exist, creates it automatically.
    Returns (Program instance or None, list of errors/warnings)
    """
    errors = []
    if not program_name:
        return None, errors
    
    program_name = program_name.strip()
    program = Program.objects.filter(name__iexact=program_name).first()
    
    if not program:
        if auto_create:
            # Auto-create program
            try:
                program = Program.objects.create(
                    name=program_name,
                    is_active=True,
                    structure_type=Program.STRUCTURE_TYPE_YEARLY,
                )
                errors.append({
                    "column": "program_name",
                    "message": f"Program '{program_name}' was automatically created."
                })
            except Exception as e:
                errors.append({
                    "column": "program_name",
                    "message": f"Failed to auto-create program '{program_name}': {str(e)}"
                })
        else:
            errors.append({
                "column": "program_name",
                "message": f"Unknown program '{program_name}'. Program not found."
            })
    
    return program, errors


def extract_graduation_year_from_batch_name(batch_name: str) -> Optional[int]:
    """
    Extract graduation year from batch name.
    Examples:
        "2029 Batch" -> 2029
        "2024 Batch" -> 2024
        "Fall 2024" -> 2024
        "Batch 2031" -> 2031
        "2029" -> 2029
        "Class of 2029" -> 2029
    """
    import re
    if not batch_name:
        return None
    
    # Try to find 4-digit year (2000-2099)
    year_match = re.search(r'\b(20\d{2})\b', batch_name)
    if year_match:
        try:
            year = int(year_match.group(1))
            # Validate it's a reasonable year (2000-2099)
            if 2000 <= year <= 2099:
                return year
        except ValueError:
            pass
    
    # Try to find 2-digit year and assume 20xx
    year_match_2digit = re.search(r'\b([0-9]{2})\b', batch_name)
    if year_match_2digit:
        try:
            year_2digit = int(year_match_2digit.group(1))
            # If it's 00-99, assume 2000-2099
            if 0 <= year_2digit <= 99:
                return 2000 + year_2digit
        except ValueError:
            pass
    
    return None


def get_program_duration_years(program: Optional['Program']) -> int:
    """
    Get typical program duration in years based on program name.
    Returns default duration if program is None or name doesn't match known programs.
    """
    if not program:
        return 5  # Default to 5 years
    
    program_name_upper = program.name.upper()
    
    # Common program durations
    # MBBS (Bachelor of Medicine, Bachelor of Surgery) - typically 5 years
    if 'MBBS' in program_name_upper:
        return 5
    # BDS (Bachelor of Dental Surgery) - typically 4-5 years
    elif 'BDS' in program_name_upper:
        return 5
    # MD (Doctor of Medicine) - typically 4-5 years
    elif program_name_upper.startswith('MD'):
        return 5
    # BSc programs - typically 4 years
    elif 'BSC' in program_name_upper or 'BACHELOR' in program_name_upper:
        return 4
    # MSc programs - typically 2 years
    elif 'MSC' in program_name_upper or 'MASTER' in program_name_upper:
        return 2
    # PhD programs - typically 3-5 years
    elif 'PHD' in program_name_upper or 'DOCTORATE' in program_name_upper:
        return 4
    
    # Default to 5 years for unknown programs
    return 5


def resolve_batch(batch_name: Optional[str], program: Optional[Program], row_num: int, auto_create: bool = False) -> Tuple[Optional[Batch], List[Dict[str, str]]]:
    """
    Resolve Batch by name, scoped to Program (case-insensitive).
    If auto_create=True and batch doesn't exist, creates it automatically.
    Returns (Batch instance or None, list of errors/warnings)
    """
    errors = []
    if not batch_name:
        return None, errors
    
    if not program:
        errors.append({
            "column": "batch_name",
            "message": "Cannot resolve batch: program must be resolved first"
        })
        return None, errors
    
    batch_name = batch_name.strip()
    batch = Batch.objects.filter(program=program, name__iexact=batch_name).first()
    
    if not batch:
        if auto_create:
            # Try to extract graduation year from batch name
            graduation_year = extract_graduation_year_from_batch_name(batch_name)
            
            if not graduation_year:
                # If we can't extract the year, try to infer it
                from datetime import date
                current_year = date.today().year
                program_duration = get_program_duration_years(program)
                
                # Check if batch name indicates a year level (e.g., "Year 1", "1st Year")
                batch_name_lower = batch_name.lower()
                if any(term in batch_name_lower for term in ["year 1", "1st year", "first year", "year one"]):
                    # If it's Year 1, calculate graduation year: current_year + (duration - 1)
                    graduation_year = current_year + (program_duration - 1)
                elif any(term in batch_name_lower for term in ["year 2", "2nd year", "second year"]):
                    graduation_year = current_year + (program_duration - 2)
                elif any(term in batch_name_lower for term in ["year 3", "3rd year", "third year"]):
                    graduation_year = current_year + (program_duration - 3)
                elif any(term in batch_name_lower for term in ["year 4", "4th year", "fourth year"]):
                    graduation_year = current_year + (program_duration - 4)
                elif any(term in batch_name_lower for term in ["year 5", "5th year", "fifth year"]):
                    graduation_year = current_year + (program_duration - 5)
                else:
                    # Default: assume students are in their first year
                    # Graduation year = current year + (program duration - 1)
                    graduation_year = current_year + (program_duration - 1)
            
            try:
                batch = Batch.objects.create(
                    program=program,
                    name=batch_name,
                    start_year=graduation_year,
                    is_active=True,
                )
                errors.append({
                    "column": "batch_name",
                    "message": f"Batch '{batch_name}' was automatically created with graduation year {graduation_year}."
                })
            except Exception as e:
                errors.append({
                    "column": "batch_name",
                    "message": f"Failed to auto-create batch '{batch_name}': {str(e)}"
                })
        else:
            errors.append({
                "column": "batch_name",
                "message": f"Batch '{batch_name}' not found under Program '{program.name}'. Enable 'Auto-create missing Programs, Batches, and Groups' to create it automatically."
            })
    
    return batch, errors


def resolve_group(group_name: Optional[str], batch: Optional[Batch], row_num: int, auto_create: bool = False) -> Tuple[Optional[Group], List[Dict[str, str]]]:
    """
    Resolve Group by name, scoped to Batch (case-insensitive).
    If auto_create=True and group doesn't exist, creates it automatically using get_or_create for idempotency.
    Returns (Group instance or None, list of errors/warnings)
    """
    errors = []
    if not group_name:
        return None, errors
    
    if not batch:
        errors.append({
            "column": "group_name",
            "message": "Cannot resolve group: batch must be resolved first"
        })
        return None, errors
    
    group_name = group_name.strip()
    group = Group.objects.filter(batch=batch, name__iexact=group_name).first()
    
    if not group:
        if auto_create:
            try:
                # Use get_or_create for idempotency - prevents duplicates in concurrent imports
                group, created = Group.objects.get_or_create(
                    batch=batch,
                    name=group_name,  # Use exact name provided, not lowercased
                )
                if created:
                    errors.append({
                        "column": "group_name",
                        "message": f"Group '{group_name}' was automatically created."
                    })
            except Exception as e:
                errors.append({
                    "column": "group_name",
                    "message": f"Failed to auto-create group '{group_name}': {str(e)}"
                })
        else:
            errors.append({
                "column": "group_name",
                "message": f"Group '{group_name}' not found under Batch '{batch.name}'. Enable 'Auto-create missing Programs, Batches, and Groups' to create it automatically."
            })
    
    return group, errors


def validate_field_lengths(row: Dict[str, str], row_num: int) -> List[Dict[str, str]]:
    """Validate field lengths against model constraints"""
    errors = []
    
    # reg_no: max_length=32
    if row.get("reg_no") and len(row["reg_no"]) > 32:
        errors.append({
            "column": "reg_no",
            "message": f"reg_no exceeds maximum length of 32 characters"
        })
    
    # name: max_length=255
    if row.get("name") and len(row["name"]) > 255:
        errors.append({
            "column": "name",
            "message": f"name exceeds maximum length of 255 characters"
        })
    
    # phone: max_length=20
    if row.get("phone") and len(row["phone"]) > 20:
        errors.append({
            "column": "phone",
            "message": f"phone exceeds maximum length of 20 characters"
        })
    
    return errors


def validate_email_format(email: Optional[str], row_num: int) -> List[Dict[str, str]]:
    """Validate email format if provided"""
    errors = []
    if email:
        email = email.strip()
        # Basic email validation
        if '@' not in email or '.' not in email.split('@')[1]:
            errors.append({
                "column": "email",
                "message": f"Invalid email format: '{email}'"
            })
    return errors


def validate_date_format(date_str: Optional[str], row_num: int) -> List[Dict[str, str]]:
    """Validate date format (supports multiple formats) if provided"""
    errors = []
    if date_str:
        from sims_backend.students.imports.utils import parse_date_strict
        parsed = parse_date_strict(date_str)
        if not parsed:
            errors.append({
                "column": "date_of_birth",
                "message": f"Invalid date format: '{date_str}'. Supported formats: YYYY-MM-DD, DD/MM/YYYY, DD/MM/YY, MM/DD/YYYY, Excel serial"
            })
    return errors


def check_duplicate_in_file(reg_no: str, row_index: int, seen_reg_nos: Dict[str, int]) -> List[Dict[str, str]]:
    """Check if reg_no appears multiple times in the file"""
    errors = []
    if reg_no in seen_reg_nos:
        errors.append({
            "column": "reg_no",
            "message": f"Duplicate reg_no '{reg_no}' found in file (first seen at row {seen_reg_nos[reg_no] + 1})"
        })
    else:
        seen_reg_nos[reg_no] = row_index
    return errors


def check_existing_in_db(reg_no: str, mode: str) -> Tuple[bool, Optional[Student]]:
    """
    Check if student with reg_no already exists in database.
    Returns (exists, Student instance or None)
    """
    student = Student.objects.filter(reg_no=reg_no).first()
    exists = student is not None
    
    if mode == "CREATE_ONLY" and exists:
        return True, student
    return exists, student
