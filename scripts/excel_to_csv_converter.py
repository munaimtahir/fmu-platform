#!/usr/bin/env python3
"""
Excel to CSV Converter for Student Import

This script converts an Excel file containing student data into a CSV format
compatible with the FMU Platform student import system.

Usage:
    python excel_to_csv_converter.py --input "Year 1 formatted data.xlsx" --output "students_import.csv"
    
    Or with custom mapping:
    python excel_to_csv_converter.py --input "Year 1 formatted data.xlsx" --output "students_import.csv" --mapping-config mapping.json
"""

import argparse
import csv
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

try:
    import pandas as pd
except ImportError:
    print("ERROR: pandas is required. Install with: pip install pandas openpyxl")
    sys.exit(1)


# Default column mapping - update based on actual Excel file structure
DEFAULT_COLUMN_MAPPING = {
    # Excel column name -> CSV column name
    # Update these based on your actual Excel file
    "reg_no": ["Registration Number", "Reg No", "Student ID", "Roll No", "REG_NO"],
    "name": ["Name", "Full Name", "Student Name", "NAME"],
    "program_name": ["Program", "Course", "Degree", "PROGRAM"],
    "batch_name": ["Batch", "Year", "Graduation Year", "BATCH"],
    "group_name": ["Group", "Section", "Class", "GROUP"],
    "status": ["Status", "Student Status", "STATUS"],
    "email": ["Email", "Email Address", "EMAIL"],
    "phone": ["Phone", "Mobile", "Contact", "PHONE"],
    "date_of_birth": ["DOB", "Date of Birth", "Birth Date", "DATE_OF_BIRTH"],
}

# Valid status values
VALID_STATUSES = ["active", "inactive", "graduated", "suspended", "on_leave"]

# Date formats to try when parsing dates
DATE_FORMATS = [
    "%Y-%m-%d",      # 2000-01-15
    "%d/%m/%Y",      # 15/01/2000
    "%m/%d/%Y",      # 01/15/2000
    "%d-%m-%Y",      # 15-01-2000
    "%Y/%m/%d",      # 2000/01/15
    "%d.%m.%Y",      # 15.01.2000
]


def find_excel_column(df: pd.DataFrame, possible_names: List[str]) -> Optional[str]:
    """Find a column in the DataFrame by trying multiple possible names."""
    for col in df.columns:
        col_clean = str(col).strip()
        for name in possible_names:
            if col_clean.lower() == name.lower():
                return col
    return None


def normalize_status(status: str) -> str:
    """Normalize status value to match system requirements."""
    if not status:
        return "active"  # Default
    
    status_lower = str(status).strip().lower()
    
    # Map common variations
    status_map = {
        "a": "active",
        "i": "inactive",
        "g": "graduated",
        "s": "suspended",
        "ol": "on_leave",
        "on leave": "on_leave",
    }
    
    if status_lower in status_map:
        return status_map[status_lower]
    
    # Check if it's already a valid status
    if status_lower in [s.lower() for s in VALID_STATUSES]:
        for valid_status in VALID_STATUSES:
            if valid_status.lower() == status_lower:
                return valid_status
    
    # Default to active if unclear
    return "active"


def parse_date(date_value) -> Optional[str]:
    """Parse date value and convert to YYYY-MM-DD format."""
    if pd.isna(date_value) or date_value is None:
        return None
    
    # If already a datetime object
    if isinstance(date_value, datetime):
        return date_value.strftime("%Y-%m-%d")
    
    # If it's a pandas Timestamp
    if isinstance(date_value, pd.Timestamp):
        return date_value.strftime("%Y-%m-%d")
    
    # Try parsing as string
    date_str = str(date_value).strip()
    if not date_str or date_str.lower() in ["nan", "none", ""]:
        return None
    
    # Try different date formats
    for fmt in DATE_FORMATS:
        try:
            parsed = datetime.strptime(date_str, fmt)
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    # If pandas can parse it
    try:
        parsed = pd.to_datetime(date_str)
        return parsed.strftime("%Y-%m-%d")
    except:
        pass
    
    return None


def clean_phone(phone: str) -> str:
    """Clean and normalize phone number."""
    if pd.isna(phone) or phone is None:
        return ""
    
    phone_str = str(phone).strip()
    # Remove common separators
    phone_str = phone_str.replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
    return phone_str[:20]  # Max 20 characters


def clean_text(text: str, max_length: Optional[int] = None) -> str:
    """Clean text field."""
    if pd.isna(text) or text is None:
        return ""
    
    text_str = str(text).strip()
    if max_length:
        text_str = text_str[:max_length]
    return text_str


def validate_row(row: Dict[str, str], row_num: int) -> List[str]:
    """Validate a row and return list of errors."""
    errors = []
    
    # Required fields
    required_fields = ["reg_no", "name", "program_name", "batch_name", "group_name", "status"]
    for field in required_fields:
        if not row.get(field) or not str(row[field]).strip():
            errors.append(f"Row {row_num}: Missing required field '{field}'")
    
    # Field length validation
    if row.get("reg_no") and len(str(row["reg_no"])) > 32:
        errors.append(f"Row {row_num}: reg_no exceeds 32 characters")
    
    if row.get("name") and len(str(row["name"])) > 255:
        errors.append(f"Row {row_num}: name exceeds 255 characters")
    
    if row.get("phone") and len(str(row["phone"])) > 20:
        errors.append(f"Row {row_num}: phone exceeds 20 characters")
    
    # Status validation
    if row.get("status") and row["status"] not in VALID_STATUSES:
        errors.append(f"Row {row_num}: Invalid status '{row['status']}'")
    
    # Email validation (basic)
    if row.get("email"):
        email = str(row["email"]).strip()
        if "@" not in email or "." not in email.split("@")[1]:
            errors.append(f"Row {row_num}: Invalid email format '{email}'")
    
    return errors


def convert_excel_to_csv(
    input_file: str,
    output_file: str,
    column_mapping: Optional[Dict] = None,
    sheet_name: Optional[str] = None,
    default_status: str = "active",
) -> Dict[str, any]:
    """
    Convert Excel file to CSV format for student import.
    
    Returns:
        Dictionary with conversion statistics and errors
    """
    if column_mapping is None:
        column_mapping = DEFAULT_COLUMN_MAPPING
    
    print(f"Reading Excel file: {input_file}")
    
    try:
        # Read Excel file
        if sheet_name:
            df = pd.read_excel(input_file, sheet_name=sheet_name)
        else:
            df = pd.read_excel(input_file)
        
        print(f"Found {len(df)} rows in Excel file")
        print(f"Columns in Excel: {list(df.columns)}")
        
        # Map columns
        csv_columns = ["reg_no", "name", "program_name", "batch_name", "group_name", "status", "email", "phone", "date_of_birth"]
        mapped_columns = {}
        
        print("\nMapping columns...")
        for csv_col in csv_columns:
            excel_col = find_excel_column(df, column_mapping.get(csv_col, []))
            if excel_col:
                mapped_columns[csv_col] = excel_col
                print(f"  {csv_col} <- {excel_col}")
            else:
                print(f"  WARNING: Could not find column for '{csv_col}'")
        
        # Check required columns
        required = ["reg_no", "name", "program_name", "batch_name", "group_name"]
        missing_required = [col for col in required if col not in mapped_columns]
        if missing_required:
            print(f"\nERROR: Missing required columns: {missing_required}")
            return {
                "success": False,
                "error": f"Missing required columns: {missing_required}",
                "total_rows": len(df),
                "converted_rows": 0,
            }
        
        # Convert rows
        converted_rows = []
        errors = []
        duplicate_reg_nos = set()
        seen_reg_nos = {}
        
        print(f"\nConverting {len(df)} rows...")
        
        for idx, row in df.iterrows():
            row_num = idx + 2  # +2 because Excel is 1-indexed and has header
            
            # Extract values
            csv_row = {}
            for csv_col, excel_col in mapped_columns.items():
                value = row.get(excel_col)
                
                if csv_col == "status":
                    csv_row[csv_col] = normalize_status(value) if value else default_status
                elif csv_col == "date_of_birth":
                    csv_row[csv_col] = parse_date(value) or ""
                elif csv_col == "phone":
                    csv_row[csv_col] = clean_phone(value)
                elif csv_col == "reg_no":
                    csv_row[csv_col] = clean_text(value, max_length=32)
                elif csv_col == "name":
                    csv_row[csv_col] = clean_text(value, max_length=255)
                else:
                    csv_row[csv_col] = clean_text(value) if value else ""
            
            # Check for duplicate reg_no
            reg_no = csv_row.get("reg_no", "").strip()
            if reg_no:
                if reg_no in seen_reg_nos:
                    errors.append(f"Row {row_num}: Duplicate reg_no '{reg_no}' (first seen at row {seen_reg_nos[reg_no]})")
                    duplicate_reg_nos.add(reg_no)
                else:
                    seen_reg_nos[reg_no] = row_num
            
            # Validate row
            row_errors = validate_row(csv_row, row_num)
            errors.extend(row_errors)
            
            # Add row if no critical errors
            if not row_errors:
                converted_rows.append(csv_row)
        
        # Write CSV file
        print(f"\nWriting CSV file: {output_file}")
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=csv_columns)
            writer.writeheader()
            writer.writerows(converted_rows)
        
        # Summary
        print(f"\n{'='*60}")
        print("CONVERSION SUMMARY")
        print(f"{'='*60}")
        print(f"Total rows in Excel:     {len(df)}")
        print(f"Successfully converted:   {len(converted_rows)}")
        print(f"Rows with errors:        {len(errors)}")
        print(f"Duplicate reg_nos:        {len(duplicate_reg_nos)}")
        
        if errors:
            print(f"\nErrors found:")
            for error in errors[:20]:  # Show first 20 errors
                print(f"  - {error}")
            if len(errors) > 20:
                print(f"  ... and {len(errors) - 20} more errors")
        
        return {
            "success": True,
            "total_rows": len(df),
            "converted_rows": len(converted_rows),
            "error_rows": len(errors),
            "duplicate_reg_nos": len(duplicate_reg_nos),
            "errors": errors,
        }
        
    except FileNotFoundError:
        return {
            "success": False,
            "error": f"File not found: {input_file}",
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error converting file: {str(e)}",
        }


def load_mapping_config(config_file: str) -> Dict:
    """Load column mapping from JSON config file."""
    with open(config_file, 'r') as f:
        config = json.load(f)
    
    # Convert config format to mapping format
    mapping = {}
    if "excel_columns" in config:
        for csv_col, excel_col in config["excel_columns"].items():
            mapping[csv_col] = [excel_col]
    
    return mapping


def main():
    parser = argparse.ArgumentParser(
        description="Convert Excel file to CSV format for student import"
    )
    parser.add_argument(
        "--input",
        "-i",
        required=True,
        help="Input Excel file path",
    )
    parser.add_argument(
        "--output",
        "-o",
        required=True,
        help="Output CSV file path",
    )
    parser.add_argument(
        "--mapping-config",
        "-m",
        help="JSON file with column mapping configuration",
    )
    parser.add_argument(
        "--sheet",
        "-s",
        help="Sheet name to read (if not specified, reads first sheet)",
    )
    parser.add_argument(
        "--default-status",
        "-d",
        default="active",
        choices=VALID_STATUSES,
        help="Default status for rows without status (default: active)",
    )
    
    args = parser.parse_args()
    
    # Load mapping if provided
    mapping = None
    if args.mapping_config:
        mapping = load_mapping_config(args.mapping_config)
    
    # Convert file
    result = convert_excel_to_csv(
        input_file=args.input,
        output_file=args.output,
        column_mapping=mapping,
        sheet_name=args.sheet,
        default_status=args.default_status,
    )
    
    if result["success"]:
        print(f"\n✅ Conversion complete! CSV file saved to: {args.output}")
        print(f"\nNext steps:")
        print(f"1. Review the CSV file: {args.output}")
        print(f"2. Use the admin interface to preview the import")
        print(f"3. Commit the import if validation passes")
        sys.exit(0)
    else:
        print(f"\n❌ Conversion failed: {result.get('error', 'Unknown error')}")
        sys.exit(1)


if __name__ == "__main__":
    main()
