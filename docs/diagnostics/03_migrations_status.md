# PHASE 2 — MIGRATIONS STATUS AND SCHEMA FIXES

**Date**: 2026-01-08  
**Status**: MIGRATIONS CREATED (Awaiting Container Startup)

## Problem Statement

The deployed system shows evidence of schema misalignment:
- **Error 1**: `column students_student.person_id does not exist`
- **Error 2**: `column academics_program.structure_type does not exist`

**Root Cause**: Database schema is behind the code OR migrations were not applied to the correct database.

## Code Analysis Results

### Students App Analysis

#### Model State (`sims_backend/students/models.py`)
The `Student` model includes:
- `person` ForeignKey to `people.Person` (lines 32-39) - **MISSING FROM MIGRATION**
- `enrollment_year` PositiveSmallIntegerField (lines 85-89) - **MISSING FROM MIGRATION**
- `expected_graduation_year` PositiveSmallIntegerField (lines 90-94) - **MISSING FROM MIGRATION**
- `actual_graduation_year` PositiveSmallIntegerField (lines 95-99) - **MISSING FROM MIGRATION**
- `status` field includes `on_leave` choice - **MISSING FROM MIGRATION**
- `LeavePeriod` model exists (lines 114-197) - **MISSING FROM MIGRATION**

#### Migration State
- `0001_initial.py` - Creates Student model WITHOUT person field
- `0002_student_user.py` - Adds user field
- `0003_importjob.py` - Adds ImportJob model
- **Missing**: Migration for person field and enrollment fields
- **Missing**: Migration for LeavePeriod model

### Academics App Analysis

#### Model State (`sims_backend/academics/models.py`)
The `Program` model includes:
- `structure_type` CharField (lines 29-34) - **MISSING FROM MIGRATION**
- `is_finalized` BooleanField (lines 35-38) - **MISSING FROM MIGRATION**
- `period_length_months` PositiveSmallIntegerField (lines 39-43) - **MISSING FROM MIGRATION**
- `total_periods` PositiveSmallIntegerField (lines 44-48) - **MISSING FROM MIGRATION**
- Custom permissions for program management - **MISSING FROM MIGRATION**

Additional models present in code but NOT in migrations:
- `Period` model (lines 310-342) - **MISSING COMPLETELY**
- `Track` model (lines 345-365) - **MISSING COMPLETELY**
- `LearningBlock` model (lines 368-428) - **MISSING COMPLETELY**
- `Module` model (lines 431-454) - **MISSING COMPLETELY**

#### Migration State
- `0001_initial.py` - Creates Program WITHOUT structure fields
- `0002_course_section.py` - Adds Course and Section models
- **Missing**: Migration for Program structure fields
- **Missing**: Migrations for Period, Track, LearningBlock, Module models

### People App Analysis

#### Model State (`sims_backend/people/models.py`)
The `people` app has 4 models:
- `Person` (lines 13-95)
- `ContactInfo` (lines 98-151)
- `Address` (lines 154-216)
- `IdentityDocument` (lines 219-284)

#### Migration State
- **NO MIGRATIONS EXIST AT ALL**
- The app is in INSTALLED_APPS but has an empty migrations directory
- This is a critical issue since `students.Student.person` references `people.Person`

## Migrations Created

### 1. People App Initial Migration
**File**: `sims_backend/people/migrations/0001_initial.py`

Creates all people app models:
- Person model with user, identity, and photo fields
- ContactInfo model for phone, email, emergency contacts
- Address model for mailing, permanent, temporary addresses
- IdentityDocument model for CNIC, passport, etc.

### 2. Students App - Person and Enrollment Fields
**File**: `sims_backend/students/migrations/0003_student_person_enrollment_fields.py`

Adds missing fields to Student model:
- `person` OneToOneField to people.Person (nullable)
- `enrollment_year` PositiveSmallIntegerField (nullable)
- `expected_graduation_year` PositiveSmallIntegerField (nullable)
- `actual_graduation_year` PositiveSmallIntegerField (nullable)
- Updates `status` choices to include 'on_leave'
- Adds index on enrollment_year

**Dependencies**: Requires people.0001_initial

### 3. Students App - LeavePeriod Model
**File**: `sims_backend/students/migrations/0004_leaveperiod.py`

Creates LeavePeriod model:
- Tracks medical, personal, academic, and absence leaves
- Links to Student and approval user
- Includes workflow status (pending, approved, rejected, completed)
- Auto-calculates counts_toward_graduation based on leave type

### 4. Academics App - Program Structure Fields
**File**: `sims_backend/academics/migrations/0003_program_structure_fields.py`

Adds missing fields to Program model:
- `structure_type` CharField (YEARLY/SEMESTER/CUSTOM)
- `is_finalized` BooleanField
- `period_length_months` PositiveSmallIntegerField (for CUSTOM type)
- `total_periods` PositiveSmallIntegerField (for CUSTOM type)
- Adds custom permissions: finalize_program, manage_structure

### 5. Academics App - New Academic Models
**File**: `sims_backend/academics/migrations/0004_new_academic_models.py`

Creates new academic structure models:
- `Period` - Periods within a program (Year 1, Semester 1, etc.)
- `Track` - Parallel tracks within a program
- `LearningBlock` - Integrated or Rotation blocks
- `Module` - Modules within integrated blocks

Also fixes:
- Department model adds parent field for hierarchy
- Department unique_together constraint updated
- AcademicPeriod adds status and is_enrollment_open fields
- Adds indexes for performance

## Migration Application Plan

### Prerequisites
1. Docker containers must be running
2. Database service (fmu_db) must be accessible
3. Backend service (fmu_backend) must be able to connect to database

### Steps to Apply Migrations

```bash
# 1. Start Docker containers
cd /home/runner/work/fmu-platform/fmu-platform
docker compose up -d

# 2. Check migration status
docker compose exec backend python manage.py showmigrations

# Expected output should show:
# people
#  [ ] 0001_initial  (NEW)
# students
#  [X] 0001_initial
#  [X] 0002_student_user
#  [X] 0003_importjob
#  [ ] 0003_student_person_enrollment_fields  (NEW)
#  [ ] 0004_leaveperiod  (NEW)
# academics
#  [X] 0001_initial
#  [X] 0002_course_section
#  [ ] 0003_program_structure_fields  (NEW)
#  [ ] 0004_new_academic_models  (NEW)

# 3. Apply migrations
docker compose exec backend python manage.py migrate

# 4. Verify schema alignment
docker compose exec backend python manage.py check

# 5. Test ORM queries
docker compose exec backend python manage.py shell
>>> from sims_backend.students.models import Student
>>> from sims_backend.academics.models import Program
>>> Student.objects.count()  # Should work
>>> Program.objects.count()  # Should work
>>> exit()
```

### Verification Queries

Once migrations are applied, verify with SQL:

```sql
-- Verify students_student.person_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students_student' AND column_name = 'person_id';

-- Verify academics_program.structure_type column exists  
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'academics_program' AND column_name = 'structure_type';

-- Verify people_person table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'people_person';

-- Verify academics_period table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'academics_period';
```

## Expected Outcomes

After migrations are applied:

1. ✅ No more `column students_student.person_id does not exist` errors
2. ✅ No more `column academics_program.structure_type does not exist` errors
3. ✅ Django admin for Program model will load successfully
4. ✅ Django admin for Student model will load successfully
5. ✅ API endpoints for students and academics will work correctly
6. ✅ Frontend create/update flows will persist data

## Risks and Considerations

### Risk 1: Data Loss
- All new fields are nullable or have defaults
- No existing data will be lost
- Existing rows will get default values for new fields

### Risk 2: Foreign Key Constraints
- `Student.person` is SET_NULL, so no constraint violations
- Existing students will have person_id = NULL until linked

### Risk 3: Migration Dependencies
- People migrations must run before students migrations
- Academics migrations can run independently
- Order is enforced by migration dependencies

### Risk 4: Production Database State
- If migrations were partially applied, may need to fake some
- Check actual database state before applying
- Use `--fake` flag carefully if needed

## Next Steps

1. Resolve Docker SSL certificate issue to start containers
2. Apply migrations in correct order
3. Verify no errors in backend logs
4. Test admin interfaces for Program and Student
5. Test API create operations
6. Verify frontend persistence
7. Document results in verification report

## Status Summary

- ✅ Missing migrations identified
- ✅ Migrations created and ready to apply
- ⏸️ **BLOCKED**: Cannot apply migrations until Docker containers start
- ⏸️ **BLOCKED**: SSL certificate issue preventing pip install in Docker build
