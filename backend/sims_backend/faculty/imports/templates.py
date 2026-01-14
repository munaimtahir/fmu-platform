"""CSV template generation for Faculty import"""
import csv
import io
from typing import List


def generate_csv_template() -> bytes:
    """
    Generate CSV template with headers and one example row for Faculty import.
    """
    # Required fields
    headers = [
        "name",  # Required - Full name
        "department_name",  # Required - FK to Department (by name)
    ]
    
    # Optional fields
    optional_headers = [
        "email",  # Optional - will be auto-generated if not provided
        "phone",  # Optional
    ]
    
    headers.extend(optional_headers)
    
    # Create example row (dummy data)
    example_row = {
        "name": "Dr. John Smith",
        "department_name": "Anatomy",
        "email": "john.smith@pmc.edu.pk",
        "phone": "+923001234567",
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
        "name",
        "department_name",
        "email",
        "phone",
    ]
