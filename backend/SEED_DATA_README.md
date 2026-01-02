# Demo Seed Data Guide

This guide explains how to seed the SIMS database with demo data for demonstration purposes.

## Overview

The seed data system creates:
- **Academic Structure**: Programs, Batches, Groups, Courses, Terms, Sections
- **Users**: Admin, Registrar, Faculty (4 users), and Student usersYou are working inside the FMU SIMS codebase (Django backend + existing apps like academics, students, core, audit). Implement a production-quality CSV importer for Students, derived strictly from the current database model and applied migrations in this repository.

Mission
1) Add a “Student Bulk Import” feature that imports students from a CSV file.
2) Provide an admin dashboard page to upload, preview (dry-run), validate, and commit the import.
3) Generate a downloadable CSV template matching the current Student model + required relations.

Global constraints
- MUST NOT guess Student fields. Read them from:
  - students/models.py
  - students/migrations/* (latest applied)
  - related FK models (academics: Program/Batch/Department/Group/etc.)
- Support “preview first” workflow: validation results shown BEFORE writing to DB.
- Provide clear error reporting per row, and an export of failed rows with reasons.
- Idempotent: re-uploading the same CSV should not create duplicates.
- Create an ImportJob record for auditability (who imported, when, summary counts).
- Keep the UI simple, clean, and consistent with existing admin/dashboard styles.

Scope assumptions (verify & adapt to repo)
- Backend: Django + DRF may exist; prefer Django views + templates for the admin import dashboard OR integrate into existing React frontend if that is the chosen UI stack in this repo.
- Authentication exists; import feature must be restricted to Admin/Staff role only.

Deliverables
A) CSV Template and Mapping
1) Detect required Student fields and relationships:
   - Identify unique keys used to match/update existing students (e.g., roll_number, student_code, registration_number, email).
   - Identify FK fields and acceptable CSV representations:
     - Program: program_code or program_name
     - Batch: batch_code or batch_name (and link to program if needed)
     - Department: department_code or department_name (optional)
     - Group/Section: group_code or group_name (optional)
2) Create endpoint/button to download template CSV with correct headers.
3) Add documentation in docs/IMPORT_STUDENTS.md describing the CSV columns, rules, and examples.

B) Import Workflow
Implement 2-phase import:
1) Phase 1: Upload + Dry Run (no DB writes)
   - Parse CSV
   - Normalize values (trim spaces, unify case where appropriate)
   - Validate each row:
     - Required fields present
     - Date parsing for DOB/admission_date (accept YYYY-MM-DD; reject others)
     - Email format if email column exists
     - FK resolution: match Program/Batch/Department by code/name (case-insensitive)
     - Detect duplicates in-file (same roll_number etc.)
     - Detect duplicates in DB (existing Student with same unique key)
   - Produce a preview result:
     - Total rows
     - Valid rows
     - Invalid rows
     - Rows that would CREATE vs UPDATE (if update mode enabled)
     - For each invalid row: error list with column names
2) Phase 2: Commit
   - Only commit valid rows
   - Use atomic transaction
   - Create or update students depending on config:
     - Default: CREATE ONLY (fail if existing)
     - Optional: UPSERT mode (update existing by unique key)
   - Record ImportJob summary: created_count, updated_count, failed_count, started_by, started_at, finished_at.
   - Store the uploaded file (or its hash) linked to ImportJob.

C) Dashboard UI
Provide an “Import Students” dashboard page for Admin:
- Upload CSV
- Toggle mode:
  - Create only / Upsert
- Preview results table (first N rows), with filters:
  - Show invalid only
  - Show create vs update
- Button: “Download error CSV”
- Button: “Commit Import”
- View Import History table:
  - job id, date/time, user, totals, created/updated/failed
  - link to job detail view

D) Tests
Add tests for:
- CSV parsing (valid/invalid)
- FK resolution (code/name)
- Duplicate handling (file-level and DB-level)
- Dry-run produces no DB writes
- Commit writes expected rows and creates ImportJob
Use pytest if repo uses it; otherwise Django TestCase.

E) Audit & Security
- Restrict endpoints/views to Admin/Staff.
- Log import actions in audit log if audit app exists.
- Ensure safe file handling (size limit, CSV injection prevention on exports: prefix cells starting with =,+,-,@ with apostrophe).

Implementation details (be smart)
- Prefer a service module: students/services/import_students.py
  - parse_csv(file) -> rows
  - validate_rows(rows) -> ValidationResult
  - commit(valid_rows, mode) -> CommitResult
- Add models:
  - students/models.py: ImportJob (or students/imports/models.py) with fields:
    - id, created_by, created_at, finished_at, status
    - mode, original_filename, file_hash
    - total_rows, valid_rows, invalid_rows, created_count, updated_count
    - error_report_file (optional)
- Ensure migrations created and applied.

Output required
- Commit-ready code changes
- docs/IMPORT_STUDENTS.md
- A sample CSV template file under docs/templates/students_import_template.csv
- Screenshots not required; ensure route is discoverable from admin/dashboard navigation.

- **Students**: Student records linked to user accounts
- **Enrollments**: Students enrolled in various course sections
- **Attendance**: Attendance records for enrolled students
- **Assessments**: Assessment types and scores
- **Results**: Final grades based on assessment scores

## Usage

### Seed Demo Data

```bash
# From the backend directory or using docker compose
cd /home/munaim/srv/apps/fmu-platform/backend

# Run with default settings (20 students)
python manage.py seed_demo

# Create more students
python manage.py seed_demo --students 50

# Clear existing data and reseed
python manage.py seed_demo --clear
```

### Using Docker Compose

```bash
# From the project root
cd /home/munaim/srv/apps/fmu-platform

# Run seed command
docker compose exec backend python manage.py seed_demo --students 30

# Clear and reseed
docker compose exec backend python manage.py seed_demo --clear
```

## Generated Login Credentials

### Administrative Users

**Admin**
- Username: `admin`
- Email: `admin@sims.edu`
- Password: `admin123`

**Registrar**
- Username: `registrar`
- Email: `registrar@sims.edu`
- Password: `registrar123`

**Faculty**
- Usernames: `faculty`, `faculty1`, `faculty2`, `faculty3`
- Email: `faculty@sims.edu`, `faculty1@sims.edu`, etc.
- Password: `faculty123` (for all faculty)

### Student Users

Each student gets a unique user account:

**Demo Student**
- Username: `student`
- Email: `student@sims.edu`
- Password: `student123`

**Other Students**
- Username format: `student{reg_no}` (e.g., `student2024cs001`)
- Email format: `student{reg_no}@sims.edu`
- Password format: `student{year}` where year is the batch year (e.g., `student2024`)

### Generate Credentials Document

After seeding, generate a markdown document with all login credentials:

```bash
python manage.py generate_login_credentials

# Or with custom output file
python manage.py generate_login_credentials --output DEMO_CREDENTIALS.md
```

Using Docker:
```bash
docker compose exec backend python manage.py generate_login_credentials
```

## Data Structure

### Academic Structure

**Programs:**
- Bachelor of Science in Computer Science
- Bachelor of Science in Electrical Engineering
- Master of Business Administration

**Batches:**
- Created for each program
- Current year and previous year batches
- Example: "2024 Batch", "2025 Batch"

**Groups:**
- Group A and Group B for each batch

**Courses:**
- CS courses: CS101, CS201, CS301, CS401
- EE courses: EE101, EE201
- MBA courses: MBA501, MBA601

**Terms:**
- Fall {current_year}
- Spring {next_year}

**Sections:**
- 2 sections per course for the current term
- Assigned to faculty members

### Student Data

Each student has:
- Registration number (format: `{year}-{program_code}-{number}`)
- Name, email, phone, date of birth
- Assigned to a Program, Batch, and Group
- Linked user account for login
- Enrollment in 4-5 course sections
- Attendance records (10 per enrollment, ~80% attendance rate)
- Assessment scores (midterm, final, quiz, assignment)
- Final grades calculated from assessment scores

## Example Workflow

1. **Seed the database:**
   ```bash
   docker compose exec backend python manage.py seed_demo --students 30 --clear
   ```

2. **Generate credentials document:**
   ```bash
   docker compose exec backend python manage.py generate_login_credentials
   ```

3. **Access the application:**
   - Frontend: https://sims.alshifalab.pk or https://sims.pmc.edu.pk
   - Login with any of the generated credentials
   - Test different user roles (Admin, Faculty, Student)

## Testing Student Login

To test student login in the frontend:

1. Use the demo student account:
   - Username: `student` or Email: `student@sims.edu`
   - Password: `student123`

2. Or use any generated student account:
   - Username: `student2024cs001` (format: student{reg_no})
   - Email: `student2024cs001@sims.edu`
   - Password: `student2024` (format: student{year})

3. Students can view:
   - Their enrollment information
   - Attendance records
   - Assessment scores
   - Final grades and results
   - Academic progress

## Notes

- **Default Passwords**: All default passwords follow predictable patterns for easy demo access
- **Production Warning**: Never use default passwords in production!
- **Data Relationships**: Students are properly linked to Programs, Batches, and Groups
- **User Accounts**: Each student has a corresponding User account for authentication
- **Batch Assignment**: Students are distributed across batches and groups
- **Random Data**: Student names, emails, and other details use Faker for realistic demo data

## Troubleshooting

### Clear All Data

If you need to start fresh:

```bash
docker compose exec backend python manage.py seed_demo --clear
```

### Check Seed Status

Verify seeded data:

```bash
# Check users
docker compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(f'Users: {User.objects.count()}')"

# Check students
docker compose exec backend python manage.py shell -c "from sims_backend.students.models import Student; print(f'Students: {Student.objects.count()}')"
```

### Common Issues

1. **Missing Batch/Group**: Ensure seed_demo creates batches and groups before creating students
2. **User Already Exists**: Use `--clear` flag to remove existing data
3. **Password Not Working**: Verify you're using the correct format (username/email + password)

## Security Notes

⚠️ **IMPORTANT**: 
- These credentials are for **demonstration purposes only**
- Default passwords are intentionally simple for demo access
- **Always change passwords in production environments**
- Consider implementing password complexity requirements
- Use strong, unique passwords for all production accounts
