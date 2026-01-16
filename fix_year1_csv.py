#!/usr/bin/env python3
"""
Script to fix Year1_students_import.csv:
1. Add password column (empty for auto-generation)
2. Format phone numbers to E.164 format
3. Fix any formatting issues
"""

import csv
import re
import sys

def format_phone_to_e164(phone):
    """
    Convert phone number to E.164 format (+923001234567)
    Handles various formats:
    - +923001234567 (already correct)
    - +92300-1234567 (with dash)
    - ++923001234567 (double plus)
    - 03001234567 (without country code)
    - +3122205254 (wrong country code)
    - +O3155422756 (O instead of 0)
    """
    if not phone or not phone.strip():
        return ""
    
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # Fix double plus
    cleaned = cleaned.replace('++', '+')
    
    # Fix O instead of 0
    cleaned = cleaned.replace('O', '0').replace('o', '0')
    
    # Remove leading + if present to process
    has_plus = cleaned.startswith('+')
    digits_only = cleaned.lstrip('+')
    
    # Remove leading zeros if present
    digits_only = digits_only.lstrip('0')
    
    # For Pakistan numbers: should be 10 digits after country code
    # Country code is 92, so total should be 12 digits (92 + 10)
    
    # If it starts with 92, it's already country code
    if digits_only.startswith('92'):
        if len(digits_only) == 12:  # 92 + 10 digits
            return '+' + digits_only
        elif len(digits_only) == 11:  # Missing one digit, pad with 0
            return '+92' + '0' + digits_only[2:]
        elif len(digits_only) == 13:  # Extra digit, take first 12
            return '+' + digits_only[:12]
    
    # If it's 10 digits, assume it's a Pakistan mobile number
    if len(digits_only) == 10:
        return '+92' + digits_only
    
    # If it's 11 digits starting with 0, remove leading 0 and add country code
    if len(digits_only) == 11 and digits_only.startswith('0'):
        return '+92' + digits_only[1:]
    
    # If it's 9 digits, might be missing leading 0
    if len(digits_only) == 9:
        return '+92' + '0' + digits_only
    
    # If it starts with 3 (Pakistan mobile prefix), add country code
    if len(digits_only) >= 10 and digits_only[0] == '3':
        if len(digits_only) == 10:
            return '+92' + digits_only
        elif len(digits_only) > 10:
            return '+92' + digits_only[:10]
    
    # If it's a wrong country code (like 31 for Netherlands), try to fix
    if digits_only.startswith('31') and len(digits_only) > 10:
        # This might be a Pakistan number with wrong country code
        # Try to extract the last 10 digits
        if len(digits_only) >= 10:
            last_10 = digits_only[-10:]
            return '+92' + last_10
    
    # If we can't fix it, return original with + if it had one
    if has_plus and not cleaned.startswith('+'):
        return '+' + digits_only
    elif not has_plus and digits_only:
        # Try to make it valid
        if len(digits_only) >= 10:
            return '+92' + digits_only[-10:]
    
    # Last resort: return as is with +
    return '+' + digits_only if digits_only else phone

def fix_csv(input_file, output_file):
    """Fix the CSV file"""
    rows = []
    
    # Read the CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        # Check if password column exists
        has_password = 'password' in fieldnames if fieldnames else False
        
        # Add password column if missing
        if not has_password and fieldnames:
            fieldnames = list(fieldnames) + ['password']
        
        for row in reader:
            # Fix phone number
            if 'phone' in row:
                row['phone'] = format_phone_to_e164(row['phone'])
            
            # Add empty password if not present
            if not has_password:
                row['password'] = ''
            
            rows.append(row)
    
    # Write the fixed CSV
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        if rows:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    
    print(f"Fixed CSV written to: {output_file}")
    print(f"Total rows processed: {len(rows)}")
    
    # Show some examples of fixed phone numbers
    print("\nSample phone number fixes:")
    sample_count = 0
    for row in rows[:10]:
        if 'phone' in row and row['phone']:
            print(f"  {row.get('name', 'N/A')}: {row['phone']}")
            sample_count += 1
            if sample_count >= 5:
                break

if __name__ == '__main__':
    input_file = 'Year1_students_import.csv'
    output_file = 'Year1_students_import_fixed.csv'
    
    try:
        fix_csv(input_file, output_file)
        print(f"\n✓ Successfully fixed CSV file!")
        print(f"  Input:  {input_file}")
        print(f"  Output: {output_file}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
