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
    Parse date string in multiple common formats and return YYYY-MM-DD format.
    Supported formats:
    - YYYY-MM-DD (ISO format)
    - DD/MM/YYYY (European format)
    - DD/MM/YY (2-digit year)
    - MM/DD/YYYY (US format)
    - YYYY/MM/DD
    - DD-MM-YYYY
    - Numeric Excel serial date (e.g. 44927)
    
    Returns the date string in YYYY-MM-DD if valid, None otherwise.
    """
    if not date_str:
        return None
    
    date_str = normalize_value(date_str)
    if not date_str:
        return None
    
    from datetime import datetime, timedelta
    
    # Try Excel serial date format (numeric)
    try:
        serial = float(date_str)
        if 1 <= serial < 100000:  # Reasonable range for Excel dates
            # Excel epoch is 1900-01-01 (but has a leap year bug for 1900)
            excel_epoch = datetime(1899, 12, 30)
            date_obj = excel_epoch + timedelta(days=serial)
            return date_obj.strftime("%Y-%m-%d")
    except ValueError:
        pass
    
    # Try various date formats
    date_formats = [
        "%Y-%m-%d",      # YYYY-MM-DD (ISO)
        "%d/%m/%Y",      # DD/MM/YYYY
        "%d/%m/%y",      # DD/MM/YY
        "%m/%d/%Y",      # MM/DD/YYYY (US)
        "%Y/%m/%d",      # YYYY/MM/DD
        "%d-%m-%Y",      # DD-MM-YYYY
        "%d-%m-%y",      # DD-MM-YY
        "%Y%m%d",        # YYYYMMDD (compact)
    ]
    
    for fmt in date_formats:
        try:
            date_obj = datetime.strptime(date_str, fmt)
            # Convert 2-digit years: 00-30 -> 2000-2030, 31-99 -> 1931-1999
            if date_obj.year < 100:
                if date_obj.year <= 30:
                    date_obj = date_obj.replace(year=date_obj.year + 2000)
                else:
                    date_obj = date_obj.replace(year=date_obj.year + 1900)
            # Validate reasonable year range (1900-2100)
            if not (1900 <= date_obj.year <= 2100):
                continue
            return date_obj.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    return None  # Invalid format
