"""CSV template generation based on Student model mapping"""
import csv
import io
from typing import List

from sims_backend.students.models import Student


def generate_csv_template() -> bytes:
    """
    Generate CSV template with headers and one example row.
    Headers are derived from Student model mapping.
    """
    # Define column mapping based on Student model
    # Required fields
    headers = [
        "reg_no",  # Unique key, required
        "name",  # Required
        "program_name",  # FK to Program (by name)
        "batch_name",  # FK to Batch (by name, scoped to program)
        "group_name",  # FK to Group (by name, scoped to batch)
        "status",  # Required, choices: active, inactive, graduated, suspended
    ]
    
    # Optional fields
    optional_headers = [
        "email",
        "phone",
        "date_of_birth",  # Format: YYYY-MM-DD
    ]
    
    headers.extend(optional_headers)
    
    # Create example row (dummy data)
    # Note: batch_name represents graduation year, not intake year
    # Students enrolling in 2026 for 5-year MBBS program would graduate in 2031
    example_row = {
        "reg_no": "2026-MBBS-001",
        "name": "John Doe",
        "program_name": "MBBS",
        "batch_name": "2031 Batch",  # Graduation year
        "group_name": "Group A",
        "status": "active",
        "email": "john.doe.b31@pmc.edu.pk",  # Auto-generated if not provided
        "phone": "+923001234567",
        "date_of_birth": "2000-01-15",
    }
    
    # Generate CSV
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    writer.writerow(example_row)
    
    return output.getvalue().encode('utf-8')


def get_expected_columns() -> List[str]:
    """Get list of expected column names for validation"""
    return [
        "reg_no",
        "name",
        "program_name",
        "batch_name",
        "group_name",
        "status",
        "email",
        "phone",
        "date_of_birth",
    ]
