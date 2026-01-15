#!/usr/bin/env python3
"""
Improved Excel to CSV converter with better duplicate handling and validation
"""

import pandas as pd
import sys
from datetime import datetime
from collections import Counter

def normalize_program(program):
    """Normalize program name variations to standard format"""
    if pd.isna(program) or not program:
        return None
    
    program_str = str(program).strip().upper()
    
    # Map variations to standard names
    if 'MBBS' in program_str:
        return 'MBBS'
    elif 'BDS' in program_str:
        return 'BDS'
    elif 'MBBA' in program_str:
        return 'MBBA'
    elif 'MBBD' in program_str:
        return 'MBBD'
    else:
        return program_str.strip()

def format_reg_no(roll_number):
    """Format roll number as string"""
    if pd.isna(roll_number):
        return None
    
    try:
        return str(int(float(roll_number)))
    except:
        return str(roll_number).strip()

def format_phone(phone):
    """Format phone number"""
    if pd.isna(phone):
        return ""
    
    phone_str = str(phone).strip()
    # Prefer E.164 format if available
    if phone_str.startswith('+'):
        return phone_str[:20]
    elif phone_str.startswith('92') and len(phone_str) >= 10:
        return '+' + phone_str[:19]
    else:
        return phone_str[:20]

def format_date(date_value):
    """Format date to YYYY-MM-DD"""
    if pd.isna(date_value):
        return ""
    
    if isinstance(date_value, datetime):
        return date_value.strftime("%Y-%m-%d")
    elif isinstance(date_value, pd.Timestamp):
        return date_value.strftime("%Y-%m-%d")
    else:
        try:
            parsed = pd.to_datetime(date_value)
            return parsed.strftime("%Y-%m-%d")
        except:
            return ""

def get_email(row):
    """Get email from either column"""
    email1 = row.get('Email Address')
    email2 = row.get('Email address')
    
    if pd.notna(email1) and email1:
        return str(email1).strip()
    elif pd.notna(email2) and email2:
        return str(email2).strip()
    return ""

def convert_excel_to_csv(input_file, output_file, batch_name="2029 Batch", group_name="Group A", handle_duplicates="keep_first"):
    """
    Convert Excel to CSV format
    
    Args:
        input_file: Path to Excel file
        output_file: Path to output CSV file
        batch_name: Batch name to use
        group_name: Group name to use
        handle_duplicates: How to handle duplicates - "keep_first", "keep_last", or "suffix"
    """
    print(f"Reading Excel file: {input_file}")
    df = pd.read_excel(input_file)
    
    print(f"Total rows in Excel: {len(df)}")
    
    # Prepare CSV data
    csv_rows = []
    errors = []
    warnings = []
    seen_reg_nos = {}
    duplicate_count = Counter()
    
    for idx, row in df.iterrows():
        row_num = idx + 2  # Excel row number
        
        # Extract and normalize data
        reg_no = format_reg_no(row.get('FMU Roll Number'))
        name = str(row.get('Full name (as per CNIC/B-Form)', '')).strip() if pd.notna(row.get('Full name (as per CNIC/B-Form)')) else ''
        program = normalize_program(row.get('Program applied / admitted to'))
        email = get_email(row)
        phone = format_phone(row.get('Mobile phone number (E.164)') or row.get('Mobile phone number'))
        dob = format_date(row.get('Date of birth'))
        
        # Validation
        if not reg_no:
            errors.append(f"Row {row_num}: Missing FMU Roll Number - SKIPPED")
            continue
        
        if not name:
            errors.append(f"Row {row_num}: Missing Full name - SKIPPED")
            continue
        
        if not program:
            errors.append(f"Row {row_num}: Missing or invalid Program - SKIPPED")
            continue
        
        # Handle duplicates
        if reg_no in seen_reg_nos:
            duplicate_count[reg_no] += 1
            
            if handle_duplicates == "keep_first":
                warnings.append(f"Row {row_num}: Duplicate reg_no '{reg_no}' - SKIPPED (keeping first occurrence at row {seen_reg_nos[reg_no]})")
                continue
            elif handle_duplicates == "keep_last":
                # Remove previous occurrence
                csv_rows = [r for r in csv_rows if r['reg_no'] != reg_no]
                warnings.append(f"Row {row_num}: Duplicate reg_no '{reg_no}' - REPLACING previous occurrence")
            elif handle_duplicates == "suffix":
                # Add suffix to make unique
                suffix = duplicate_count[reg_no]
                reg_no = f"{reg_no}-{suffix}"
                warnings.append(f"Row {row_num}: Duplicate reg_no - using '{reg_no}'")
        else:
            seen_reg_nos[reg_no] = row_num
        
        # Validate field lengths
        if len(reg_no) > 32:
            errors.append(f"Row {row_num}: reg_no '{reg_no}' exceeds 32 characters - SKIPPED")
            continue
        
        if len(name) > 255:
            name = name[:255]
            warnings.append(f"Row {row_num}: name truncated to 255 characters")
        
        if phone and len(phone) > 20:
            phone = phone[:20]
            warnings.append(f"Row {row_num}: phone truncated to 20 characters")
        
        # Create CSV row
        csv_row = {
            'reg_no': reg_no,
            'name': name,
            'program_name': program,
            'batch_name': batch_name,
            'group_name': group_name,
            'status': 'active',
            'email': email,
            'phone': phone,
            'date_of_birth': dob,
        }
        
        csv_rows.append(csv_row)
    
    # Create DataFrame and save to CSV
    csv_df = pd.DataFrame(csv_rows)
    
    # Reorder columns as per import template
    columns_order = ['reg_no', 'name', 'program_name', 'batch_name', 'group_name', 'status', 'email', 'phone', 'date_of_birth']
    csv_df = csv_df[columns_order]
    
    # Save to CSV
    csv_df.to_csv(output_file, index=False, encoding='utf-8')
    
    print(f"\n{'='*60}")
    print("CONVERSION SUMMARY")
    print(f"{'='*60}")
    print(f"Total rows in Excel:     {len(df)}")
    print(f"Successfully converted:   {len(csv_rows)}")
    print(f"Errors (skipped):        {len([e for e in errors if 'SKIPPED' in e])}")
    print(f"Warnings:                {len(warnings)}")
    print(f"Duplicate reg_nos found: {len(duplicate_count)}")
    
    if errors:
        print(f"\nErrors (first 10):")
        for error in errors[:10]:
            print(f"  - {error}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors")
    
    if warnings:
        print(f"\nWarnings (first 10):")
        for warning in warnings[:10]:
            print(f"  - {warning}")
        if len(warnings) > 10:
            print(f"  ... and {len(warnings) - 10} more warnings")
    
    print(f"\n✅ CSV file saved to: {output_file}")
    print(f"\nProgram distribution:")
    print(csv_df['program_name'].value_counts())
    
    # Check for missing data
    print(f"\nData completeness:")
    print(f"  - Rows with email: {csv_df['email'].notna().sum()} ({csv_df['email'].notna().sum()/len(csv_df)*100:.1f}%)")
    print(f"  - Rows with phone: {csv_df['phone'].notna().sum()} ({csv_df['phone'].notna().sum()/len(csv_df)*100:.1f}%)")
    print(f"  - Rows with DOB: {csv_df['date_of_birth'].notna().sum()} ({csv_df['date_of_birth'].notna().sum()/len(csv_df)*100:.1f}%)")
    
    return len(csv_rows), len(errors), len(warnings)

if __name__ == "__main__":
    input_file = "/app/Year 1 formatted data.xlsx"
    output_file = "/app/Year1_students_import.csv"
    
    # Default batch and group
    batch_name = "2029 Batch"
    group_name = "Group A"
    handle_duplicates = "keep_first"  # Options: keep_first, keep_last, suffix
    
    if len(sys.argv) > 1:
        batch_name = sys.argv[1]
    if len(sys.argv) > 2:
        group_name = sys.argv[2]
    if len(sys.argv) > 3:
        handle_duplicates = sys.argv[3]
    
    print(f"Configuration:")
    print(f"  Batch: {batch_name}")
    print(f"  Group: {group_name}")
    print(f"  Duplicate handling: {handle_duplicates}")
    
    try:
        converted, errors, warnings = convert_excel_to_csv(
            input_file, output_file, batch_name, group_name, handle_duplicates
        )
        print(f"\n✅ Conversion complete!")
        print(f"\nNext steps:")
        print(f"1. Review the CSV file: {output_file}")
        print(f"2. Verify batch '{batch_name}' and group '{group_name}' exist in the system")
        print(f"3. Use admin interface to preview and import")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
