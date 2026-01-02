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


def resolve_program(program_name: Optional[str], row_num: int) -> Tuple[Optional[Program], List[Dict[str, str]]]:
    """
    Resolve Program by name (case-insensitive).
    Returns (Program instance or None, list of errors)
    """
    errors = []
    if not program_name:
        return None, errors
    
    program_name = program_name.strip()
    program = Program.objects.filter(name__iexact=program_name).first()
    
    if not program:
        errors.append({
            "column": "program_name",
            "message": f"Unknown program '{program_name}'. Program not found."
        })
    
    return program, errors


def resolve_batch(batch_name: Optional[str], program: Optional[Program], row_num: int) -> Tuple[Optional[Batch], List[Dict[str, str]]]:
    """
    Resolve Batch by name, scoped to Program (case-insensitive).
    Returns (Batch instance or None, list of errors)
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
        errors.append({
            "column": "batch_name",
            "message": f"Batch '{batch_name}' not found under Program '{program.name}'"
        })
    
    return batch, errors


def resolve_group(group_name: Optional[str], batch: Optional[Batch], row_num: int) -> Tuple[Optional[Group], List[Dict[str, str]]]:
    """
    Resolve Group by name, scoped to Batch (case-insensitive).
    Returns (Group instance or None, list of errors)
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
        errors.append({
            "column": "group_name",
            "message": f"Group '{group_name}' not found under Batch '{batch.name}'"
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
    """Validate date format (YYYY-MM-DD) if provided"""
    errors = []
    if date_str:
        from sims_backend.students.imports.utils import parse_date_strict
        parsed = parse_date_strict(date_str)
        if not parsed:
            errors.append({
                "column": "date_of_birth",
                "message": f"Invalid date format: '{date_str}'. Expected YYYY-MM-DD"
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
