# Demo Scenarios Implementation Summary

**Date:** January 2, 2026  
**Status:** ✅ **COMPLETED**

---

## Overview

A comprehensive demo data seeding system has been implemented to create students in different workflow stages for debugging and showcasing the MVP. The system creates students across 8 distinct scenario buckets representing different stages of the academic workflow.

## What Was Implemented

### 1. ✅ Helper Module (`backend/core/demo_scenarios.py`)

A comprehensive helper module with functions for creating demo data:

- **Academic Structure**: Programs, Batches, Academic Periods, Groups, Departments
- **Student Creation**: Students with linked User accounts
- **Attendance**: Session-based attendance tracking
- **Exams & Results**: Exam creation with components and result generation
- **Finance**: Challan/voucher generation for fees
- **Cleanup**: Function to delete all demo-tagged objects

**Key Features:**
- All demo objects are tagged with `DEMO_` prefix for easy identification
- Idempotent operations (get_or_create patterns)
- Timezone-safe date handling
- Transaction support

### 2. ✅ Management Command (`backend/core/management/commands/seed_demo_scenarios.py`)

A Django management command with the following features:

**Command Signature:**
```bash
python manage.py seed_demo_scenarios --students 20 --program "MBBS" --term "Block-1" --sections 3 --reset
```

**Arguments:**
- `--students`: Total number of students (default: 20)
- `--program`: Program name (default: MBBS)
- `--term`: Academic period name (default: Block-1)
- `--sections`: Number of sections/groups (default: 3)
- `--reset`: Delete existing demo objects before creating new ones

**Scenario Buckets Created:**

1. **ENROLLED_ONLY** (3 students)
   - Enrollment exists
   - No attendance records
   - No exam scores

2. **ATTENDANCE_STARTED** (4 students)
   - Attendance marked for 3-5 sessions
   - Mixed present/absent status
   - No exam scores yet

3. **LOW_ATTENDANCE_AT_RISK** (3 students)
   - Attendance between 60-74% (below threshold)
   - At risk of failing attendance requirements

4. **ASSESSMENT_SCORES_PARTIAL** (3 students)
   - Quiz scores entered
   - Midterm scores missing
   - Results in draft state

5. **ASSESSMENT_COMPLETE_RESULTS_DRAFT** (3 students)
   - All assessment scores entered (quiz + midterm)
   - Results in DRAFT status
   - Ready for verification

6. **RESULTS_PUBLISHED** (2 students)
   - All scores entered
   - Results published and visible to students
   - Status: PUBLISHED

7. **RESULTS_FROZEN** (1 student)
   - Results verified and frozen
   - Status: VERIFIED (used as proxy for frozen, as system doesn't have explicit FROZEN status)
   - Editing blocked

8. **FEES_VOUCHER_GENERATED** (1 student)
   - Fee challan/voucher generated
   - Status: PENDING (unpaid)
   - Ready for payment

### 3. ✅ Test Suite (`backend/tests/test_demo_scenarios.py`)

Comprehensive test coverage including:

- Command creates exactly 20 students
- Idempotency test (running twice doesn't duplicate)
- Reset flag functionality
- Results published scenario verification
- Low attendance scenario verification
- Fees voucher generation verification
- Custom parameter handling

### 4. ✅ Container Rebuild

Backend container has been rebuilt to include the new command files.

---

## Usage

### Running in Docker

```bash
# From project root
cd /home/munaim/srv/apps/fmu-platform

# Run with default settings (20 students)
docker compose exec backend python manage.py seed_demo_scenarios

# Run with custom parameters
docker compose exec backend python manage.py seed_demo_scenarios \
  --students 20 \
  --program "MBBS" \
  --term "Block-1" \
  --sections 3

# Reset existing demo data and recreate
docker compose exec backend python manage.py seed_demo_scenarios \
  --students 20 \
  --reset
```

### Running Locally

```bash
cd backend
python manage.py seed_demo_scenarios --students 20 --reset
```

---

## Expected Output

The command prints a comprehensive summary including:

- Created academic structure (Program, Batch, Period, Groups)
- Faculty users created (with credentials)
- Students organized by scenario bucket
- Login credentials for each student
- Key API endpoints

**Sample Output:**
```
✅ DEMO SCENARIOS CREATED SUCCESSFULLY
================================================================================

📚 ACADEMIC STRUCTURE:
  Program: DEMO_MBBS
  Batch: DEMO_2026 Batch
  Academic Period: DEMO_Block-1
  Groups/Sections: DEMO_Section 1, DEMO_Section 2, DEMO_Section 3

👨‍🏫 FACULTY USERS:
  - demofaculty1 (demofaculty1@sims.edu) - Password: faculty123
  - demofaculty2 (demofaculty2@sims.edu) - Password: faculty123

👥 STUDENTS BY SCENARIO:

  ENROLLED_ONLY (3 students):
    - DEMO-2026-MBBS-001: John Doe
      Username: studentdemo2026mbbs001 | Password: student2026
    ...

📊 TOTAL: 20 students created

🔗 KEY ENDPOINTS:
  - Admin: http://localhost:8000/admin/
  - API: http://localhost:8000/api/
  ...
```

---

## Files Created/Modified

### New Files
1. `backend/core/demo_scenarios.py` - Helper functions for demo data creation
2. `backend/core/management/commands/seed_demo_scenarios.py` - Management command
3. `backend/tests/test_demo_scenarios.py` - Test suite

### Modified Files
- None (existing seed_demo.py command remains untouched)

---

## Key Assumptions & Design Decisions

### 1. Model Structure
- **Student Model**: Uses `sims_backend.students.models.Student` (not `admissions.Student`)
- **Enrollment**: System references `academics.Section` but Section model doesn't exist in current codebase
  - **Workaround**: Used Groups as proxy for sections
  - **Note**: Enrollment model exists but references non-existent Section model
- **Results**: Uses Exam-based results (not section-based assessments)
  - System has both `assessments` and `exams` apps
  - Chose `exams` as it's more complete with components and passing logic

### 2. Attendance System
- Uses `timetable.Session` model (not section-based)
- Attendance is linked to Sessions, not Sections
- Sessions are created per Group with faculty assignments

### 3. Results Workflow
- **Status Values**: DRAFT → VERIFIED → PUBLISHED
- **Frozen Status**: System doesn't have explicit FROZEN status
  - **Solution**: Used VERIFIED status as proxy for frozen results
  - Results in VERIFIED state are considered "frozen" (editing blocked)

### 4. Finance/Vouchers
- Uses existing `Challan` model (not a separate FeeVoucher model)
- Challan represents the fee voucher
- Status: PENDING (unpaid) vs PAID

### 5. Demo Tagging
- All demo objects prefixed with `DEMO_` for easy identification
- `--reset` flag deletes only DEMO-tagged objects
- Idempotent: running twice updates existing objects rather than duplicating

### 6. User Accounts
- Each student gets a User account
- Username format: `student{reg_no}` (sanitized)
- Password format: `student{year}` (e.g., `student2026`)
- Students added to "Student" group for permissions

---

## Database Migrations

**No new migrations required.** The implementation uses existing models only.

However, if you need to run migrations for any reason:
```bash
docker compose exec backend python manage.py migrate
```

---

## Testing

Run the test suite:
```bash
# In Docker
docker compose exec backend pytest tests/test_demo_scenarios.py -v

# Locally
cd backend
pytest tests/test_demo_scenarios.py -v
```

---

## Troubleshooting

### Command Not Found
If the command is not recognized:
1. Rebuild the container: `docker compose build backend`
2. Restart: `docker compose restart backend`

### Database Connection Errors
Ensure:
- Database container is running: `docker compose ps`
- Environment variables are set correctly in `.env`
- Database credentials match in settings

### Import Errors
If you see import errors:
- Ensure `core` is in `INSTALLED_APPS`
- Check that all required apps are installed
- Verify Python path includes `/app`

---

## Next Steps for Deployment

1. **Run Migrations** (if needed):
   ```bash
   docker compose exec backend python manage.py migrate
   ```

2. **Seed Demo Data**:
   ```bash
   docker compose exec backend python manage.py seed_demo_scenarios --students 20 --reset
   ```

3. **Verify Data**:
   - Check admin panel: http://localhost:8000/admin/
   - Check API endpoints
   - Verify students in different scenarios

4. **Access on Public Domain**:
   - Ensure containers are running
   - Configure reverse proxy (nginx/Caddy) if needed
   - Update DNS settings
   - Verify firewall rules

---

## Notes

- The command is **idempotent**: running multiple times won't create duplicates
- Use `--reset` flag to clean up and start fresh
- All demo objects are clearly tagged for easy identification
- The system respects existing data (won't delete non-demo objects)
- Faculty users are created with password: `faculty123`
- Student passwords follow pattern: `student{year}`

---

## Support

For issues or questions:
1. Check test suite for expected behavior
2. Review command help: `python manage.py help seed_demo_scenarios`
3. Check logs: `docker compose logs backend`
