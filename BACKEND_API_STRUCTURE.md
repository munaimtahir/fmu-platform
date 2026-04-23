# FMU SIMS Backend API Structure - Complete Reference

## Overview
This is a comprehensive API documentation for the FMU Platform SIMS Backend, a Student Information Management System built with Django REST Framework. The system is organized into multiple apps with clear separation of concerns.

---

## 1. MAIN URL CONFIGURATION

### Primary Entry Point: `/home/munaim/srv/apps/fmu-platform/backend/config/urls.py`

```python
Main patterns:
- admin/: Django admin (admin.site.urls)
- api/v1/: Core API routes (apps.core.urls)
- (empty): Intake app routes (apps.intake.urls)
```

### Root URLs: `/home/munaim/srv/apps/fmu-platform/backend/sims_backend/urls.py`

Health check & Auth endpoints:
- `health/`: Health check (returns status, db latency, redis, migrations)
- `healthz/`: Alias for health
- `api/health/`: API health endpoint
- `api/auth/login/`: UnifiedLoginView - Main authentication
- `api/auth/logout/`: Logout
- `api/auth/refresh/`: Token refresh
- `api/auth/me/`: Current user info
- `api/auth/change-password/`: Password change
- `api/auth/token/`: Legacy token endpoint (deprecated)
- `api/auth/token/refresh/`: Legacy token refresh (deprecated)
- `api/dashboard/stats/`: Dashboard statistics
- `api/schema/`: OpenAPI/Swagger schema
- `api/docs/`: Swagger UI documentation
- `api/redoc/`: ReDoc documentation

---

## 2. ALL URLS.PY FILES & ENDPOINTS BY APP

### CORE RBAC (`/sims_backend/core/urls.py`)
```
Prefix: api/core/
Endpoints:
- roles/: List, create, update roles
- permission-tasks/: Manage permission tasks
- role-task-assignments/: Assign tasks to roles
- user-task-assignments/: Assign tasks to users
- users/me/: Current user information
```

### PEOPLE/IDENTITY (`/sims_backend/people/urls.py`)
```
Prefix: api/people/
Endpoints:
- persons/: Person CRUD (central identity records)
- contact-info/: Contact information management
- addresses/: Address records
- identity-documents/: Identity documents (passports, CNICs, etc.)
```

### ACADEMICS (`/sims_backend/academics/urls.py`)
```
Prefix: api/academics/
Endpoints:
- programs/: Academic programs (MBBS, BDS, etc.)
- batches/: Batches per program (graduation year cohorts)
- academic-periods/: Year/Block/Module hierarchical periods
- courses/: Courses/Subjects
- sections/: Course sections with faculty assignment
- groups/: Student groups within batches
- departments/: Departments (Anatomy, Medicine, Surgery, etc.)
- periods/: Program periods (Year 1, Year 2, etc.)
- tracks/: Parallel program tracks
- blocks/: Learning blocks (Integrated/Rotation)
- modules/: Modules within learning blocks
```

### STUDENTS (`/sims_backend/students/urls.py`)
```
Prefix: api/
Endpoints:
- students/: Student CRUD (reg_no, name, program, batch, group, status)
- leave-periods/: Student leave periods (medical, personal, academic, absence)

Sub-app - Student Imports:
Prefix: api/admin/students/
- import/: CSV import for bulk student creation
```

### ATTENDANCE (`/sims_backend/attendance/urls.py`)
```
Prefix: api/
Endpoints:
- attendance/: Attendance records (PRESENT, ABSENT, LATE, LEAVE)
- attendance-input/live/roster/: Live roster view
- attendance-input/live/submit/: Live attendance submission
- attendance-input/csv/dry-run/: CSV import preview
- attendance-input/csv/commit/: Finalize CSV attendance
- attendance-input/sheet/template/: Ticket sheet template download
- attendance-input/sheet/dry-run/: Sheet OCR preview
- attendance-input/sheet/commit/: Finalize scanned sheet
- attendance-input/biometric/punches/: Biometric device punches
```

### TIMETABLE (`/sims_backend/timetable/urls.py`)
```
Prefix: api/timetable/
Endpoints:
- sessions/: Academic sessions (faculty, group, department, time slot)
- weekly-timetables/: Weekly timetable per batch
- timetable-cells/: Individual timetable grid cells
```

### EXAMS (`/sims_backend/exams/urls.py`)
```
Prefix: api/
Endpoints:
- exams/: Exam records
- exam-components/: Exam components (written, practical, oral, etc.)
```

### RESULTS (`/sims_backend/results/urls.py`)
```
Prefix: api/
Endpoints:
- results/: Result headers (exam result per student - DRAFT/VERIFIED/PUBLISHED/FROZEN)
- result-components/: Individual component results (marks per component)
```

### FINANCE (`/sims_backend/finance/urls.py`)
```
Prefix: api/
Endpoints:
- finance/fee-types/: Fee categories (TUITION, EXAM, LIBRARY, etc.)
- finance/fee-plans/: Fee amount definitions per program/term
- finance/vouchers/: Payment vouchers (GENERATED/PAID/OVERDUE/CANCELLED)
- finance/payments/: Payment records
- finance/ledger/: Ledger entries (financial transactions)
- finance/adjustments/: Fee adjustments
- finance/policies/: Finance policies
- finance/students/: Student finance summary
- finance/reports/: Financial reports
```

### NOTIFICATIONS (`/sims_backend/notifications/urls.py`)
```
Prefix: api/
Endpoints:
- notifications/: Admin notification management
- my/notifications/: Personal notification inbox
```

### TRANSCRIPTS (`/sims_backend/transcripts/urls.py`)
```
Endpoints:
- api/transcripts/<int:student_id>/: Get student transcript
- api/transcripts/verify/<str:token>/: Verify transcript authenticity
- api/transcripts/enqueue/: Queue transcript generation
```

### COMPLIANCE (`/sims_backend/compliance/urls.py`)
```
Prefix: api/compliance/
Endpoints:
- my-compliance/: Student compliance requirements
- admin-compliance/: Admin compliance management
- definitions/: Requirement definitions
```

### AUDIT (`/sims_backend/audit/urls.py`)
```
Prefix: api/
Endpoints:
- audit/: Audit log entries
```

### ADMIN (`/sims_backend/admin/urls.py`)
```
Prefix: api/
Endpoints:
- admin/dashboard/: Admin dashboard data
- admin/impersonation/start/: Start user impersonation
- admin/impersonation/stop/: Stop user impersonation
- admin/users/: Admin user management
```

### LEARNING (`/sims_backend/learning/urls.py`)
```
Prefix: api/
Endpoints:
- learning/materials/: Learning materials management
- learning/audiences/: Learning material audiences
- learning/student-feed/: Student learning feed
```

### SYLLABUS (`/sims_backend/syllabus/urls.py`)
```
Prefix: api/admin/
Endpoints:
- syllabus/: Syllabus item management
```

### SETTINGS (`/sims_backend/settings_app/urls.py`)
```
Prefix: api/admin/
Endpoints:
- settings/: Application settings management
```

### FACULTY IMPORTS (`/sims_backend/faculty/imports/urls.py`)
```
Prefix: api/admin/faculty/
Endpoints:
- import/: CSV import for faculty bulk creation
```

---

## 3. CORE DATA MODELS & FIELDS

### STUDENT MODEL
**File:** `/sims_backend/students/models.py`
**Table:** students_student

Fields:
- `id` (PK)
- `user` (OneToOne→User, nullable) - Linked user account
- `person` (OneToOne→Person, nullable) - Identity data
- `reg_no` (CharField, unique) - Registration number
- `name` (CharField, 255) - Full name
- `program` (FK→Program) - Enrolled program
- `batch` (FK→Batch) - Batch/cohort
- `group` (FK→Group) - Student group
- `status` (CharField, choices: ACTIVE/INACTIVE/GRADUATED/SUSPENDED/ON_LEAVE)
- `email` (EmailField)
- `phone` (CharField, 20)
- `date_of_birth` (DateField, nullable)
- `enrollment_year` (PositiveSmallInt, nullable)
- `expected_graduation_year` (PositiveSmallInt, nullable)
- `actual_graduation_year` (PositiveSmallInt, nullable)
- `created_at` (DateTimeField, auto)
- `updated_at` (DateTimeField, auto)

Indexes: program+batch+group, status, reg_no, enrollment_year

---

### LEAVE PERIOD MODEL
**File:** `/sims_backend/students/models.py`
**Table:** students_leaveperiod

Fields:
- `id` (PK)
- `student` (FK→Student)
- `type` (CharField, choices: MEDICAL/PERSONAL/ACADEMIC/ABSENCE)
- `start_date` (DateField)
- `end_date` (DateField, nullable)
- `reason` (TextField)
- `status` (CharField, choices: PENDING/APPROVED/REJECTED/COMPLETED)
- `approved_by` (FK→User, nullable)
- `counts_toward_graduation` (BooleanField, default=True)
- `created_at`, `updated_at`

---

### ATTENDANCE MODEL
**File:** `/sims_backend/attendance/models.py`
**Table:** attendance_attendance

Fields:
- `id` (PK)
- `session` (FK→Session)
- `student` (FK→Student)
- `status` (CharField, choices: PRESENT/ABSENT/LATE/LEAVE)
- `marked_by` (FK→User, nullable)
- `marked_at` (DateTimeField)
- `created_at`, `updated_at`

Unique: (session, student)
Indexes: session+student, status, marked_at

---

### RESULT HEADER MODEL (Assessment/Exam Result)
**File:** `/sims_backend/results/models.py`
**Table:** results_resultheader

Fields:
- `id` (PK)
- `exam` (FK→Exam)
- `student` (FK→Student)
- `total_obtained` (DecimalField, 10,2)
- `total_max` (DecimalField, 10,2)
- `final_outcome` (CharField, choices: PASS/FAIL/PENDING)
- `status` (CharField, choices: DRAFT/VERIFIED/PUBLISHED/FROZEN)
- `published_at` (DateTimeField, nullable)
- `published_by` (FK→User, nullable)
- `frozen_at` (DateTimeField, nullable)
- `frozen_by` (FK→User, nullable)
- `created_at`, `updated_at`

Unique: (exam, student)
Indexes: exam+student, status, final_outcome

Properties:
- `is_editable`: status == DRAFT
- `is_publishable`: status in [DRAFT, VERIFIED]
- `is_freezable`: status == PUBLISHED

---

### RESULT COMPONENT ENTRY MODEL
**File:** `/sims_backend/results/models.py`
**Table:** results_resultcomponententry

Fields:
- `id` (PK)
- `result_header` (FK→ResultHeader)
- `exam_component` (FK→ExamComponent)
- `marks_obtained` (DecimalField, 10,2)
- `component_outcome` (CharField, choices: PASS/FAIL/NA)
- `created_at`, `updated_at`

Unique: (result_header, exam_component)

---

### ATTENDANCE INPUT JOB MODEL
**File:** `/sims_backend/attendance/models.py`
**Table:** attendance_attendanceinputjob

Fields:
- `id` (PK)
- `session` (FK→Session)
- `date` (DateField)
- `uploaded_by` (FK→User, nullable)
- `input_type` (CharField, choices: CSV/SHEET)
- `status` (CharField, choices: DRAFT/COMMITTED)
- `original_filename` (CharField, 255)
- `file_fingerprint` (CharField, 64) - MD5/SHA hash
- `summary` (JSONField) - Import statistics
- `created_at`, `updated_at`

Tracks CSV/sheet uploads for attendance workflows

---

### PROGRAM MODEL
**File:** `/sims_backend/academics/models.py`
**Table:** academics_program

Fields:
- `id` (PK)
- `name` (CharField, 128, unique) - e.g., "MBBS", "BDS"
- `description` (TextField)
- `is_active` (BooleanField, default=True)
- `structure_type` (CharField, choices: YEARLY/SEMESTER/CUSTOM)
- `is_finalized` (BooleanField)
- `period_length_months` (PositiveSmallInt, nullable)
- `total_periods` (PositiveSmallInt, nullable)
- `created_at`, `updated_at`

---

### BATCH MODEL
**File:** `/sims_backend/academics/models.py`
**Table:** academics_batch

Fields:
- `id` (PK)
- `program` (FK→Program)
- `name` (CharField, 128)
- `start_year` (PositiveSmallInt) - **GRADUATION YEAR** (not intake year!)
  - Note: Students enrolling in 2026 in 5-year program have batch.start_year=2031
- `is_active` (BooleanField, default=True)
- `created_at`, `updated_at`

Unique: (program, name)

---

### SESSION MODEL (Timetable Session)
**File:** `/sims_backend/timetable/models.py`
**Table:** timetable_session

Fields:
- `id` (PK)
- `academic_period` (FK→AcademicPeriod)
- `group` (FK→Group)
- `faculty` (FK→User) - Faculty assigned
- `department` (FK→Department)
- `starts_at` (DateTimeField)
- `ends_at` (DateTimeField)
- `created_at`, `updated_at`

Indexes: academic_period+group, faculty, starts_at

---

### VOUCHER MODEL (Finance)
**File:** `/sims_backend/finance/models.py`
**Table:** finance_voucher

Fields:
- `id` (PK)
- `voucher_no` (CharField, 64, unique) - Readable identifier
- `student` (FK→Student)
- `term` (FK→AcademicPeriod)
- `status` (CharField, choices: GENERATED/PARTIALLY_PAID/PAID/OVERDUE/CANCELLED)
- `issue_date` (DateField)
- `due_date` (DateField)
- `total_amount` (DecimalField, 12,2) - Snapshot for printing
- `notes` (TextField)
- `created_by` (FK→User, nullable)
- `created_at`, `updated_at`

Indexes: student+term, status

---

### PAYMENT MODEL (Finance)
**File:** `/sims_backend/finance/models.py`
**Table:** finance_payment (lines 260+)

Contains payment transaction records

---

### FEE TYPE MODEL (Finance)
**File:** `/sims_backend/finance/models.py`
**Table:** finance_feetype

Fields:
- `id` (PK)
- `code` (CharField, 32, unique) - TUITION, EXAM, LIBRARY, etc.
- `name` (CharField, 128)
- `is_active` (BooleanField, default=True)
- `created_at`, `updated_at`

---

### FEE PLAN MODEL (Finance)
**File:** `/sims_backend/finance/models.py`
**Table:** finance_feeplan

Fields:
- `id` (PK)
- `program` (FK→Program)
- `term` (FK→AcademicPeriod)
- `fee_type` (FK→FeeType)
- `amount` (DecimalField, 12,2)
- `is_mandatory` (BooleanField, default=True)
- `frequency` (CharField, choices: ONE_TIME/PER_TERM)
- `effective_from` (DateField, nullable)
- `is_active` (BooleanField, default=True)
- `created_at`, `updated_at`

Unique constraint: (program, term, fee_type) where is_active=True

---

### ACADEMIC PERIOD MODEL
**File:** `/sims_backend/academics/models.py`
**Table:** academics_academicperiod

Fields:
- `id` (PK)
- `period_type` (CharField, choices: YEAR/BLOCK/MODULE)
- `name` (CharField, 128)
- `parent_period` (FK→self, nullable) - Hierarchical: YEAR→BLOCK→MODULE
- `start_date` (DateField, nullable)
- `end_date` (DateField, nullable)
- `status` (CharField, choices: OPEN/CLOSED) - Controls enrollment
- `is_enrollment_open` (BooleanField, default=True)
- `created_at`, `updated_at`

Indexes: status, period_type+status

---

## 4. MANAGEMENT COMMANDS

Located in `/core/management/commands/`:

1. **seed_demo.py**
   - Creates sample Programs, Batches, Groups, Students, Sessions, Vouchers
   - Adds demo data for testing and demonstration

2. **seed_demo_scenarios.py**
   - Creates specific test scenarios for the system

3. **seed_academics_demo.py**
   - Located in `academics/management/commands/`
   - Seeds academic-specific demo data

4. **generate_login_credentials.py**
   - Generates user credentials for testing

5. **create_role_groups.py**
   - Creates default RBAC role groups

6. **test_admin_urls.py**
   - Tests admin URL routing

---

## 5. FIXTURE FILES

**Result:** No fixture files found (*.json) in fixtures/ directories
- System uses management commands for seeding instead of JSON fixtures
- Consider creating fixture files at `sims_backend/{app}/fixtures/` if needed for testing

---

## 6. SERIALIZERS OVERVIEW

All apps include serializers at `{app}/serializers.py`:
- **students**: StudentSerializer, StudentPlacementSerializer, LeavePeriodSerializer
- **attendance**: AttendanceSerializer (with related data)
- **results**: ResultHeaderSerializer, ResultComponentEntrySerializer
- **academics**: Program, Batch, Course, Section, Group serializers
- **finance**: FeeType, FeePlan, Voucher, Payment serializers
- **people**: Person, ContactInfo, Address, IdentityDocument serializers
- **exams**: Exam, ExamComponent serializers
- **timetable**: Session, WeeklyTimetable, TimetableCell serializers

---

## 7. QUICK API FIXTURE BUILDING REFERENCE

### Create Student Fixture:
```python
POST /api/students/
{
    "reg_no": "STU001",
    "name": "John Doe",
    "program": 1,  # FK to Program
    "batch": 1,    # FK to Batch
    "group": 1,    # FK to Group
    "status": "active",
    "email": "john@example.com",
    "phone": "1234567890",
    "enrollment_year": 2023
}
```

### Create Attendance:
```python
POST /api/attendance/
{
    "session": 1,    # FK to Session
    "student": 1,    # FK to Student
    "status": "PRESENT"
}
```

### Create Result Header:
```python
POST /api/results/
{
    "exam": 1,           # FK to Exam
    "student": 1,        # FK to Student
    "total_obtained": 85,
    "total_max": 100,
    "final_outcome": "PASS",
    "status": "DRAFT"
}
```

### Create Voucher:
```python
POST /api/finance/vouchers/
{
    "voucher_no": "V-2024-001",
    "student": 1,        # FK to Student
    "term": 1,           # FK to AcademicPeriod
    "total_amount": "5000.00",
    "due_date": "2024-12-31"
}
```

---

## 8. KEY RELATIONSHIPS DIAGRAM

```
User (Django Auth)
├── Person (1:1) - Central identity
│   ├── Student (1:1)
│   │   ├── Attendance Records (1:many)
│   │   ├── Result Headers (1:many)
│   │   ├── Vouchers (1:many)
│   │   └── Leave Periods (1:many)
│   ├── Faculty Profile (1:1 from User)
│   └── Contact Info (1:many)
│
Program
├── Batches (1:many)
│   ├── Groups (1:many)
│   │   ├── Students (1:many)
│   │   ├── Sections (1:many)
│   │   └── Sessions (1:many)
├── Fee Plans (1:many)
├── Periods (1:many)
│   └── Academic Periods
├── Tracks (1:many)
│   └── Learning Blocks
│
Academic Period
├── Courses (1:many)
│   └── Sections (1:many)
├── Sessions (1:many)
├── Timetables (1:many)
├── Vouchers (1:many)
│
Exam
├── Exam Components (1:many)
└── Result Headers (1:many)
    └── Result Component Entries (1:many)
```

---

## 9. COMMON DEVELOPMENT PATTERNS

### List Endpoints (GET /api/{resource}/)
- Returns paginated list with filters
- Query params typically: page, search, filter_by_status, etc.

### Create Endpoints (POST /api/{resource}/)
- Accepts JSON payload with required/optional fields
- Returns created object with ID

### Detail Endpoints (GET /api/{resource}/{id}/)
- Returns single object details

### Update Endpoints (PATCH/PUT /api/{resource}/{id}/)
- Partial (PATCH) or full (PUT) updates

### Delete Endpoints (DELETE /api/{resource}/{id}/)
- Soft or hard delete depending on model

### Custom Actions
- POST /api/{resource}/{id}/{action}/ (e.g., publish results, freeze results)

---

## 10. AUTHENTICATION WORKFLOW

```
1. POST /api/auth/login/ with credentials
   Returns: {"access": "token", "refresh": "token"}

2. Use 'access' token in Authorization: Bearer <token> header

3. GET /api/auth/me/ to get current user info

4. POST /api/auth/refresh/ to refresh expired access token

5. POST /api/auth/logout/ to invalidate tokens
```

---

**Last Updated:** Backend structure as of March 7, 2024
**Status:** Complete API reference for test fixture building
