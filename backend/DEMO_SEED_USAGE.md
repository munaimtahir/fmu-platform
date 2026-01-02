# Demo Data Generation - Usage Guide

This guide explains how to use the `seed_demo_scenarios` management command to generate demo data for testing and showcasing the SIMS MVP.

## Overview

The `seed_demo_scenarios` command creates 20 students distributed across 8 different workflow stages, simulating a realistic academic environment with:
- Programs, courses, and sections
- Faculty assignments
- Student enrollments
- Attendance records
- Assessment scores
- Exam results in different states (draft, published, frozen)
- Fee vouchers/challans

## Command Usage

### Basic Usage

```bash
python manage.py seed_demo_scenarios
```

This creates 20 students in the MBBS program with default settings.

### With Docker

```bash
docker compose exec backend python manage.py seed_demo_scenarios
```

### Command Options

```bash
python manage.py seed_demo_scenarios [OPTIONS]
```

**Options:**
- `--students <N>` - Number of students to create (default: 20, must be 20 for correct bucket distribution)
- `--program <NAME>` - Program name (default: "MBBS")
- `--term <NAME>` - Term/Block name (default: "Block-1")
- `--sections <N>` - Number of sections to create (default: 3)
- `--reset` - Delete existing demo data before seeding

### Examples

```bash
# Create demo data with default settings
python manage.py seed_demo_scenarios

# Create demo data with reset (clean slate)
python manage.py seed_demo_scenarios --reset

# Custom program and term
python manage.py seed_demo_scenarios --program "BDS" --term "Block-2"

# Docker usage with reset
docker compose exec backend python manage.py seed_demo_scenarios --reset --students 20
```

## Scenario Buckets

The command distributes 20 students across 8 workflow stages:

### 1. ENROLLED_ONLY (3 students)
- Students who are enrolled in sections
- No attendance marked
- No assessment scores

### 2. ATTENDANCE_STARTED (4 students)
- Attendance marked for 4 out of 5 sessions
- ~75% attendance rate
- No assessment scores

### 3. LOW_ATTENDANCE_AT_RISK (3 students)
- Attendance marked for all 5 sessions
- ~65% attendance rate (at-risk threshold)
- No assessment scores

### 4. ASSESSMENT_SCORES_PARTIAL (3 students)
- Regular attendance (~85%)
- Quiz scores entered
- Midterm scores missing
- Useful for testing partial assessment scenarios

### 5. ASSESSMENT_COMPLETE_RESULTS_DRAFT (3 students)
- Regular attendance (~90%)
- All assessment scores entered
- Exam results in DRAFT status
- Useful for testing result editing workflows

### 6. RESULTS_PUBLISHED (2 students)
- Regular attendance (~92%)
- All scores and results entered
- Results in PUBLISHED status
- Visible to students

### 7. RESULTS_FROZEN (1 student)
- Excellent attendance (~95%)
- All scores and results entered
- Results in FROZEN status
- Editing blocked - useful for testing immutability

### 8. FEES_VOUCHER_GENERATED (1 student)
- Regular attendance (~88%)
- All scores and results published
- Fee challan/voucher generated (unpaid status)
- Useful for testing fee payment workflows

## What Gets Created

### Academic Structure
- 1 Program (e.g., MBBS)
- 1 Batch (current year)
- 3 Groups (A, B, C)
- 3 Departments (Anatomy, Physiology, Biochemistry)
- 1 Academic Period (Block-1 or specified)
- 3 Courses (one per department)
- 3 Sections (one per course)

### Users
- 2 Faculty users:
  - `demo_faculty1` / faculty123
  - `demo_faculty2` / faculty123
- 20 Student users:
  - `demo_student001` through `demo_student020`
  - Password pattern: `demo123` (e.g., demo123)

### Academic Data
- 20 Students (both admissions.Student and students.Student records)
- 20-40 Enrollments (students enrolled in 1-2 sections each)
- 5 Timetable Sessions
- Variable Attendance records based on bucket
- Variable Assessment records based on bucket
- Variable Exam/Result records based on bucket
- 1 Fee Challan (for last student)

## Sample Output

```
🚀 Starting demo scenario seeding...

📚 Setting up academic structure...
  ✓ Using existing program: MBBS
  ✓ Using existing academic period: Block-1
  ✓ Using batch: MBBS 2026 Batch
  ✓ Using 3 groups

👨‍🏫 Creating faculty...
  ✓ Created faculty: demo_faculty1
  ✓ Created faculty: demo_faculty2

📖 Creating courses...
  ✓ Created course: DEMO_ANAT-101
  ✓ Created course: DEMO_PHYS-101
  ✓ Created course: DEMO_BIOC-101

🏫 Creating sections...
  ✓ Created section: DEMO_Section A for DEMO_ANAT-101
  ✓ Created section: DEMO_Section B for DEMO_PHYS-101
  ✓ Created section: DEMO_Section C for DEMO_BIOC-101

👥 Creating 20 students...
  ✓ Created 20 demo students

📝 Enrolling students in sections...
  ✓ Created 27 enrollments

🗓️  Creating timetable sessions...
  ✓ Created 5 sessions

🎯 Distributing students into scenario buckets...
  ✓ Bucket 1 (ENROLLED_ONLY): 3 students
  ✓ Bucket 2 (ATTENDANCE_STARTED): 4 students
  ✓ Bucket 3 (LOW_ATTENDANCE_AT_RISK): 3 students
  ✓ Bucket 4 (ASSESSMENT_SCORES_PARTIAL): 3 students
  ✓ Bucket 5 (ASSESSMENT_COMPLETE_RESULTS_DRAFT): 3 students
  ✓ Bucket 6 (RESULTS_PUBLISHED): 2 students
  ✓ Bucket 7 (RESULTS_FROZEN): 1 student
  ✓ Bucket 8 (FEES_VOUCHER_GENERATED): 1 student

================================================================================
✅ DEMO DATA SEEDING COMPLETE
================================================================================

📊 SUMMARY:
  • Program: MBBS
  • Term: Block-1
  • Courses: 3
  • Sections: 3
  • Faculty: 2
  • Total Students: 20

👨‍🏫 FACULTY CREDENTIALS:
  • demo_faculty1 / faculty123
  • demo_faculty2 / faculty123

👥 STUDENT DISTRIBUTION BY SCENARIO:

  1. ENROLLED_ONLY (3 students):
     • DEMO_2026-MBBS-001 - John Doe (demo_student001 / demo123)
     • DEMO_2026-MBBS-002 - Jane Smith (demo_student002 / demo123)
     • DEMO_2026-MBBS-003 - Bob Wilson (demo_student003 / demo123)

  [... additional buckets ...]

================================================================================
🎉 Ready to debug and showcase!
================================================================================

💡 QUICK START:
  • Admin: http://localhost:8010/admin
  • API: http://localhost:8010/api
  • To reset: python manage.py seed_demo_scenarios --reset --students 20
```

## Idempotency

The command is idempotent - running it multiple times without `--reset` will:
- Reuse existing programs, departments, and academic periods
- Create new demo objects only if they don't exist (based on reg_no, code, etc.)
- Not duplicate students or enrollments

## Cleanup

To remove all demo data:

```bash
python manage.py seed_demo_scenarios --reset
```

Or manually delete objects with the `DEMO_` prefix.

## Use Cases

### 1. Testing Attendance Module
Use buckets 2-3 to test:
- Attendance marking workflows
- At-risk student identification
- Attendance reports

### 2. Testing Assessment Module
Use buckets 4-5 to test:
- Partial score entry
- Missing assessment workflows
- Score validation

### 3. Testing Results Module
Use buckets 5-7 to test:
- Draft result editing
- Result publishing workflows
- Frozen result immutability
- Student result visibility

### 4. Testing Finance Module
Use bucket 8 to test:
- Fee voucher generation
- Payment processing
- Outstanding fee reports

### 5. End-to-End Workflows
Use all buckets to test:
- Complete student lifecycle
- Cross-module workflows
- Reporting and analytics
- Role-based access controls

## Troubleshooting

### "No module named django"
Make sure Django is installed and you're in the correct environment:
```bash
pip install -r requirements.txt
```

### "Cannot delete some instances"
Use the `--reset` flag to properly clean up protected foreign keys:
```bash
python manage.py seed_demo_scenarios --reset
```

### Database Connection Errors
Ensure your database is running and environment variables are set:
```bash
# Check .env file
cat .env | grep POSTGRES

# Start database (Docker)
docker compose up -d db
```

## Architecture Notes

### Dual Student Models
The command creates records in both:
- `admissions.Student` - for enrollment and assessments
- `students.Student` - for attendance and results

This maintains compatibility with the existing codebase architecture.

### Demo Object Tagging
All demo objects are prefixed with `DEMO_` for easy identification and cleanup:
- Student reg_no: `DEMO_2026-MBBS-001`
- Faculty usernames: `demo_faculty1`
- Student usernames: `demo_student001`
- Course codes: `DEMO_ANAT-101`
- Section names: `DEMO_Section A`

## Testing

Run the test suite to verify functionality:

```bash
# Run all demo scenario tests
python manage.py test core.tests.test_seed_demo_scenarios

# Run specific test
python manage.py test core.tests.test_seed_demo_scenarios.SeedDemoScenariosTests.test_command_creates_20_students
```

## Support

For issues or questions:
1. Check the test suite for expected behavior
2. Review the code in `core/demo_scenarios.py`
3. Check existing issues in the repository
