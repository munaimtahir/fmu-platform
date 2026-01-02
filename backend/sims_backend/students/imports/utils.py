"""Utility functions for CSV parsing, normalization, and safe export"""
import csv
import io
from typing import Any, Dict, List, Optional


def parse_csv_file(file) -> List[Dict[str, str]]:
    """
    Parse CSV file safely, handling UTF-8, BOM, and common issues.
    Returns list of dictionaries with column names as keys.
    """
    # Handle BOM (Byte Order Mark) for UTF-8 files
    content = file.read()
    if content.startswith(b'\xef\xbb\xbf'):
        content = content[3:]  # Remove BOM
    
    # Decode as UTF-8
    try:
        text = content.decode('utf-8')
    except UnicodeDecodeError:
        # Fallback to latin-1 if UTF-8 fails
        text = content.decode('latin-1', errors='replace')
    
    # Parse CSV
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for row in reader:
        rows.append(row)
    
    return rows


def normalize_value(value: Optional[str]) -> Optional[str]:
    """Normalize a CSV cell value: trim whitespace, handle empty strings"""
    if value is None:
        return None
    value = str(value).strip()
    return value if value else None


def normalize_row(row: Dict[str, str]) -> Dict[str, str]:
    """Normalize all values in a row"""
    return {k: normalize_value(v) for k, v in row.items()}


def safe_csv_export(rows: List[Dict[str, Any]], fieldnames: List[str]) -> bytes:
    """
    Safely export rows to CSV, preventing CSV injection attacks.
    Escapes formulas and special characters.
    """
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for row in rows:
        safe_row = {}
        for field in fieldnames:
            value = row.get(field, '')
            # Prevent CSV injection by escaping formulas
            if isinstance(value, str) and value and value[0] in ['=', '+', '-', '@', '\t', '\r']:
                value = "'" + value
            safe_row[field] = value
        writer.writerow(safe_row)
    
    return output.getvalue().encode('utf-8')


def parse_date_strict(date_str: Optional[str]) -> Optional[str]:
    """
    Parse date string strictly in YYYY-MM-DD format.
    Returns the date string if valid, None otherwise.
    Does not return a date object to keep validation simple.
    """
    if not date_str:
        return None
    
    date_str = normalize_value(date_str)
    if not date_str:
        return None
    
    # Try to parse YYYY-MM-DD format
    parts = date_str.split('-')
    if len(parts) == 3:
        try:
            year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
            # Basic validation
            if 1900 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
                return f"{year:04d}-{month:02d}-{day:02d}"
        except (ValueError, IndexError):
            pass
    
    return None  # Invalid format
