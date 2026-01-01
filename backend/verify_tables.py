#!/usr/bin/env python3
"""
Verify Django database tables exist using Django's introspection.
"""

import os
import sys
import django

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_backend.settings')
django.setup()

from django.db import connection

def verify_tables():
    """Verify database tables exist."""
    
    print("=" * 80)
    print("DATABASE TABLE VERIFICATION")
    print("=" * 80)
    
    with connection.cursor() as cursor:
        # Get all table names using Django's introspection
        table_names = connection.introspection.table_names(cursor)
    
    print(f"\nTotal tables found: {len(table_names)}\n")
    
    # Group tables by app
    app_tables = {}
    for table in sorted(table_names):
        if table.startswith('sims_backend_'):
            # Extract app name after the 'sims_backend_' prefix, e.g.
            # 'sims_backend_admissions_student' -> 'admissions'.
            remainder = table[len('sims_backend_'):]
            if remainder:
                app = remainder.split('_', 1)[0]
            else:
                # Unexpected format: no app name after prefix; group under 'other'.
                app = 'other'
            if app not in app_tables:
                app_tables[app] = []
            app_tables[app].append(table)
        elif table.startswith('django_'):
            if 'django' not in app_tables:
                app_tables['django'] = []
            app_tables['django'].append(table)
        elif table.startswith('auth_'):
            if 'auth' not in app_tables:
                app_tables['auth'] = []
            app_tables['auth'].append(table)
        elif table.startswith('core_'):
            if 'core' not in app_tables:
                app_tables['core'] = []
            app_tables['core'].append(table)
        else:
            if 'other' not in app_tables:
                app_tables['other'] = []
            app_tables['other'].append(table)
    
    # Print grouped tables
    for app, tables in sorted(app_tables.items()):
        print(f"\n{app.upper()} ({len(tables)} tables):")
        print("-" * 40)
        for table in tables:
            print(f"  ✓ {table}")
    
    # Check for key tables
    print("\n" + "=" * 80)
    print("KEY TABLE VERIFICATION")
    print("=" * 80)
    
    key_tables = [
        'admissions_student',
        'admissions_studentapplication',
        'admissions_applicationdraft',
        'academics_department',
        'academics_program',
        'students_student',
        'attendance_attendance',
        'exams_exam',
        'results_resultheader',
        'finance_challan',
        'timetable_session',
        'audit_auditlog',
        'core_profile',
        'auth_user',
        'django_migrations',
    ]
    
    for table in key_tables:
        exists = table in table_names
        status = "✓ EXISTS" if exists else "✗ MISSING"
        print(f"{status}: {table}")
    
    # Check specific fields on Student table
    print("\n" + "=" * 80)
    print("STUDENT TABLE FIELD VERIFICATION (admissions.Student)")
    print("=" * 80)
    
    student_table = 'admissions_student'
    if student_table in table_names:
        with connection.cursor() as cursor:
            fields = connection.introspection.get_table_description(cursor, student_table)
        print(f"\nFields in {student_table}:")
        for field in fields:
            print(f"  ✓ {field.name} ({field.type_code})")
        
        # Check for the new fields we added
        field_names = [f.name for f in fields]
        new_fields = ['batch_year', 'current_year', 'email', 'phone', 'date_of_birth']
        print(f"\nNew fields verification:")
        for field in new_fields:
            exists = field in field_names
            status = "✓ EXISTS" if exists else "✗ MISSING"
            print(f"  {status}: {field}")
    else:
        print(f"\n✗ Table {student_table} not found!")
    
    print("\n" + "=" * 80)
    print("VERIFICATION COMPLETE")
    print("=" * 80)
    
    return len(table_names) > 0

if __name__ == '__main__':
    try:
        success = verify_tables()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Error during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
