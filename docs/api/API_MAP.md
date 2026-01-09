# API Map - Complete Endpoint Documentation

**Date:** 2026-01-03  
**Base URL:** `/api/` (unless otherwise specified)

## Authentication Endpoints

### Canonical Auth (Use These)
- `POST /api/auth/login/` - Unified login (email/username + password)
- `POST /api/auth/logout/` - Logout (clears tokens)
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Get current user info

### Legacy Auth (Deprecated)
- `POST /api/auth/token/` - Legacy token obtain
- `POST /api/auth/token/refresh/` - Legacy token refresh

**Auth Required:** None (except `/me` requires authentication)

---

## Core RBAC Endpoints

### Roles
- `GET /api/core/roles/` - List roles (Admin only)
- `POST /api/core/roles/` - Create role (Admin only)
- `GET /api/core/roles/{id}/` - Get role details
- `PUT/PATCH /api/core/roles/{id}/` - Update role
- `DELETE /api/core/roles/{id}/` - Delete role

### Permission Tasks
- `GET /api/core/permission-tasks/` - List permission tasks
- `POST /api/core/permission-tasks/` - Create permission task
- `GET /api/core/permission-tasks/{id}/` - Get task details
- `PUT/PATCH /api/core/permission-tasks/{id}/` - Update task
- `DELETE /api/core/permission-tasks/{id}/` - Delete task

### Role-Task Assignments
- `GET /api/core/role-task-assignments/` - List assignments
- `POST /api/core/role-task-assignments/` - Create assignment
- `GET /api/core/role-task-assignments/{id}/` - Get assignment
- `PUT/PATCH /api/core/role-task-assignments/{id}/` - Update assignment
- `DELETE /api/core/role-task-assignments/{id}/` - Delete assignment

### User-Task Assignments
- `GET /api/core/user-task-assignments/` - List user assignments
- `POST /api/core/user-task-assignments/` - Create user assignment
- `GET /api/core/user-task-assignments/{id}/` - Get assignment
- `PUT/PATCH /api/core/user-task-assignments/{id}/` - Update assignment
- `DELETE /api/core/user-task-assignments/{id}/` - Delete assignment

### User Me
- `GET /api/core/users/me/` - Get current user profile
- `PUT/PATCH /api/core/users/me/` - Update current user profile

**Auth Required:** Yes (JWT token)  
**Permissions:** Varies by endpoint

---

## People Module Endpoints

### Persons
- `GET /api/people/persons/` - List persons
- `POST /api/people/persons/` - Create person
- `GET /api/people/persons/{id}/` - Get person details
- `PUT/PATCH /api/people/persons/{id}/` - Update person
- `DELETE /api/people/persons/{id}/` - Delete person

**Tasks:** `people.persons.view`, `people.persons.create`, `people.persons.update`, `people.persons.delete`

### Contact Info
- `GET /api/people/contact-info/` - List contact info
- `POST /api/people/contact-info/` - Create contact info
- `GET /api/people/contact-info/{id}/` - Get contact info
- `PUT/PATCH /api/people/contact-info/{id}/` - Update contact info
- `DELETE /api/people/contact-info/{id}/` - Delete contact info

**Filters:** `person`, `type`, `is_primary`, `is_verified`

### Addresses
- `GET /api/people/addresses/` - List addresses
- `POST /api/people/addresses/` - Create address
- `GET /api/people/addresses/{id}/` - Get address
- `PUT/PATCH /api/people/addresses/{id}/` - Update address
- `DELETE /api/people/addresses/{id}/` - Delete address

**Filters:** `person`, `type`, `is_primary`, `city`, `country`

### Identity Documents
- `GET /api/people/identity-documents/` - List documents
- `POST /api/people/identity-documents/` - Create document
- `GET /api/people/identity-documents/{id}/` - Get document
- `PUT/PATCH /api/people/identity-documents/{id}/` - Update document
- `DELETE /api/people/identity-documents/{id}/` - Delete document

**Filters:** `person`, `type`, `is_verified`

---

## Academics Module Endpoints

### Programs
- `GET /api/programs/` - List programs
- `POST /api/programs/` - Create program
- `GET /api/programs/{id}/` - Get program details
- `PUT/PATCH /api/programs/{id}/` - Update program
- `DELETE /api/programs/{id}/` - Delete program
- `POST /api/programs/{id}/finalize/` - Finalize program structure
- `POST /api/programs/{id}/generate-periods/` - Generate periods for program

**Tasks:** `academics.programs.view`, `academics.programs.create`, `academics.programs.update`, `academics.programs.delete`, `academics.programs.manage`  
**Filters:** `is_active`, `structure_type`, `is_finalized`  
**Search:** `name`, `description`

### Batches
- `GET /api/batches/` - List batches
- `POST /api/batches/` - Create batch
- `GET /api/batches/{id}/` - Get batch details
- `PUT/PATCH /api/batches/{id}/` - Update batch
- `DELETE /api/batches/{id}/` - Delete batch

**Filters:** `program`, `start_year`

### Academic Periods
- `GET /api/academic-periods/` - List academic periods
- `POST /api/academic-periods/` - Create academic period
- `GET /api/academic-periods/{id}/` - Get period details
- `PUT/PATCH /api/academic-periods/{id}/` - Update period
- `DELETE /api/academic-periods/{id}/` - Delete period

**Filters:** `period_type`, `status`, `is_enrollment_open`

### Groups
- `GET /api/groups/` - List groups
- `POST /api/groups/` - Create group
- `GET /api/groups/{id}/` - Get group details
- `PUT/PATCH /api/groups/{id}/` - Update group
- `DELETE /api/groups/{id}/` - Delete group

**Filters:** `batch`

### Departments
- `GET /api/departments/` - List departments
- `POST /api/departments/` - Create department
- `GET /api/departments/{id}/` - Get department details
- `PUT/PATCH /api/departments/{id}/` - Update department
- `DELETE /api/departments/{id}/` - Delete department

### Courses
- `GET /api/courses/` - List courses
- `POST /api/courses/` - Create course
- `GET /api/courses/{id}/` - Get course details
- `PUT/PATCH /api/courses/{id}/` - Update course
- `DELETE /api/courses/{id}/` - Delete course

**Filters:** `department`, `academic_period`  
**Search:** `code`, `name`

### Sections
- `GET /api/sections/` - List sections
- `POST /api/sections/` - Create section
- `GET /api/sections/{id}/` - Get section details
- `PUT/PATCH /api/sections/{id}/` - Update section
- `DELETE /api/sections/{id}/` - Delete section

**Filters:** `course`, `academic_period`, `faculty`, `group`

### Periods (New Structure)
- `GET /api/periods/` - List periods
- `POST /api/periods/` - Create period
- `GET /api/periods/{id}/` - Get period details
- `PUT/PATCH /api/periods/{id}/` - Update period
- `DELETE /api/periods/{id}/` - Delete period

**Filters:** `program`, `order`

### Tracks
- `GET /api/tracks/` - List tracks
- `POST /api/tracks/` - Create track
- `GET /api/tracks/{id}/` - Get track details
- `PUT/PATCH /api/tracks/{id}/` - Update track
- `DELETE /api/tracks/{id}/` - Delete track

**Filters:** `program`

### Learning Blocks
- `GET /api/blocks/` - List learning blocks
- `POST /api/blocks/` - Create learning block
- `GET /api/blocks/{id}/` - Get block details
- `PUT/PATCH /api/blocks/{id}/` - Update block
- `DELETE /api/blocks/{id}/` - Delete block

**Filters:** `period`, `track`, `block_type`

### Modules
- `GET /api/modules/` - List modules
- `POST /api/modules/` - Create module
- `GET /api/modules/{id}/` - Get module details
- `PUT/PATCH /api/modules/{id}/` - Update module
- `DELETE /api/modules/{id}/` - Delete module

**Filters:** `block`, `order`

---

## Students Module Endpoints

### Students (Canonical)
- `GET /api/students/` - List students
- `POST /api/students/` - Create student
- `GET /api/students/{id}/` - Get student details
- `PUT/PATCH /api/students/{id}/` - Update student
- `DELETE /api/students/{id}/` - Delete student
- `GET /api/students/me/` - Get current student's profile
- `PATCH /api/students/{id}/placement/` - Update student placement (Program/Batch/Group)

**Tasks:** `students.students.view`, `students.students.create`, `students.students.update`, `students.students.delete`, `students.students.manage_placement`  
**Filters:** `program`, `batch`, `group`, `status`, `reg_no`  
**Search:** `reg_no`, `name`, `email`, `phone`

### Leave Periods
- `GET /api/leave-periods/` - List leave periods
- `POST /api/leave-periods/` - Create leave period
- `GET /api/leave-periods/{id}/` - Get leave period details
- `PUT/PATCH /api/leave-periods/{id}/` - Update leave period
- `DELETE /api/leave-periods/{id}/` - Delete leave period

**Tasks:** `students.leave_periods.view`, `students.leave_periods.create`, `students.leave_periods.update`, `students.leave_periods.delete`  
**Filters:** `student`, `type`, `status`, `start_date`, `end_date`  
**Search:** `reason`

### Student Import
- `POST /api/students/import/preview/` - Preview import (dry run)
- `POST /api/students/import/commit/` - Commit import
- `GET /api/students/import/jobs/` - List import jobs
- `GET /api/students/import/jobs/{id}/` - Get import job details

---

## Attendance Module Endpoints

### Attendance Records
- `GET /api/attendance/` - List attendance records
- `POST /api/attendance/` - Create attendance record
- `GET /api/attendance/{id}/` - Get attendance details
- `PUT/PATCH /api/attendance/{id}/` - Update attendance
- `DELETE /api/attendance/{id}/` - Delete attendance

**Filters:** `student`, `session`, `date`, `status`

### Attendance Input Methods
- `GET /api/attendance-input/live/roster/` - Get live roster for attendance
- `POST /api/attendance-input/live/submit/` - Submit live attendance
- `POST /api/attendance-input/csv/dry-run/` - Preview CSV import
- `POST /api/attendance-input/csv/commit/` - Commit CSV import
- `GET /api/attendance-input/sheet/template/` - Download tick sheet template
- `POST /api/attendance-input/sheet/dry-run/` - Preview tick sheet import
- `POST /api/attendance-input/sheet/commit/` - Commit tick sheet import
- `POST /api/attendance-input/biometric/punches/` - Record biometric punch

---

## Timetable Module Endpoints

### Sessions
- `GET /api/timetable/sessions/` - List sessions
- `POST /api/timetable/sessions/` - Create session
- `GET /api/timetable/sessions/{id}/` - Get session details
- `PUT/PATCH /api/timetable/sessions/{id}/` - Update session
- `DELETE /api/timetable/sessions/{id}/` - Delete session

**Filters:** `academic_period`, `group`, `faculty`, `department`

---

## Exams Module Endpoints

### Exams
- `GET /api/exams/` - List exams
- `POST /api/exams/` - Create exam
- `GET /api/exams/{id}/` - Get exam details
- `PUT/PATCH /api/exams/{id}/` - Update exam
- `DELETE /api/exams/{id}/` - Delete exam

**Filters:** `academic_period`, `course`, `exam_type`, `status`

### Exam Components
- `GET /api/exam-components/` - List exam components
- `POST /api/exam-components/` - Create exam component
- `GET /api/exam-components/{id}/` - Get component details
- `PUT/PATCH /api/exam-components/{id}/` - Update component
- `DELETE /api/exam-components/{id}/` - Delete component

**Filters:** `exam`, `component_type`, `is_mandatory`

---

## Results Module Endpoints

### Result Headers
- `GET /api/results/` - List result headers
- `POST /api/results/` - Create result header
- `GET /api/results/{id}/` - Get result details
- `PUT/PATCH /api/results/{id}/` - Update result
- `DELETE /api/results/{id}/` - Delete result

**Filters:** `student`, `exam`, `status`

### Result Components
- `GET /api/result-components/` - List result components
- `POST /api/result-components/` - Create result component
- `GET /api/result-components/{id}/` - Get component details
- `PUT/PATCH /api/result-components/{id}/` - Update component
- `DELETE /api/result-components/{id}/` - Delete component

**Filters:** `result_header`, `component`, `outcome`

---

## Finance Module Endpoints

### Fee Types
- `GET /api/finance/fee-types/` - List fee types
- `POST /api/finance/fee-types/` - Create fee type
- `GET /api/finance/fee-types/{id}/` - Get fee type details
- `PUT/PATCH /api/finance/fee-types/{id}/` - Update fee type
- `DELETE /api/finance/fee-types/{id}/` - Delete fee type

### Fee Plans
- `GET /api/finance/fee-plans/` - List fee plans
- `POST /api/finance/fee-plans/` - Create fee plan
- `GET /api/finance/fee-plans/{id}/` - Get fee plan details
- `PUT/PATCH /api/finance/fee-plans/{id}/` - Update fee plan
- `DELETE /api/finance/fee-plans/{id}/` - Delete fee plan

**Filters:** `program`, `is_active`

### Vouchers
- `GET /api/finance/vouchers/` - List vouchers
- `POST /api/finance/vouchers/` - Create voucher
- `GET /api/finance/vouchers/{id}/` - Get voucher details
- `PUT/PATCH /api/finance/vouchers/{id}/` - Update voucher
- `DELETE /api/finance/vouchers/{id}/` - Delete voucher

**Filters:** `student`, `status`, `fee_plan`

### Payments
- `GET /api/finance/payments/` - List payments
- `POST /api/finance/payments/` - Create payment
- `GET /api/finance/payments/{id}/` - Get payment details
- `PUT/PATCH /api/finance/payments/{id}/` - Update payment
- `DELETE /api/finance/payments/{id}/` - Delete payment

**Filters:** `student`, `voucher`, `payment_method`, `status`

### Ledger Entries
- `GET /api/finance/ledger/` - List ledger entries
- `POST /api/finance/ledger/` - Create ledger entry
- `GET /api/finance/ledger/{id}/` - Get ledger entry
- `PUT/PATCH /api/finance/ledger/{id}/` - Update ledger entry
- `DELETE /api/finance/ledger/{id}/` - Delete ledger entry

**Filters:** `student`, `entry_type`, `date`

### Adjustments
- `GET /api/finance/adjustments/` - List adjustments
- `POST /api/finance/adjustments/` - Create adjustment
- `GET /api/finance/adjustments/{id}/` - Get adjustment
- `PUT/PATCH /api/finance/adjustments/{id}/` - Update adjustment
- `DELETE /api/finance/adjustments/{id}/` - Delete adjustment

**Filters:** `student`, `adjustment_type`

### Finance Policies
- `GET /api/finance/policies/` - List finance policies
- `POST /api/finance/policies/` - Create policy
- `GET /api/finance/policies/{id}/` - Get policy details
- `PUT/PATCH /api/finance/policies/{id}/` - Update policy
- `DELETE /api/finance/policies/{id}/` - Delete policy

### Student Finance Summary
- `GET /api/finance/students/` - List student finance summaries
- `GET /api/finance/students/{id}/` - Get student finance summary

**Filters:** `program`, `batch`, `status`

### Finance Reports
- `GET /api/finance/reports/` - List finance reports
- `GET /api/finance/reports/{id}/` - Get report details
- `POST /api/finance/reports/` - Generate report

---

## Transcripts Module Endpoints

### Transcripts
- `GET /api/transcripts/{student_id}/` - Get transcript for student
- `POST /api/transcripts/enqueue/` - Enqueue transcript generation
- `GET /api/transcripts/verify/{token}/` - Verify transcript QR token

**Auth:** Transcript generation requires authentication; verification is public

---

## Audit Module Endpoints

### Audit Logs
- `GET /api/audit/` - List audit log entries
- `GET /api/audit/{id}/` - Get audit log entry

**Filters:** `actor`, `entity`, `action`, `date_from`, `date_to`  
**Permissions:** Admin only

---

## Admissions Module Endpoints (Legacy, Kept for Compatibility)

### Student Applications
- `GET /api/student-applications/` - List applications
- `POST /api/student-applications/` - Create application
- `GET /api/student-applications/{id}/` - Get application details
- `PUT/PATCH /api/student-applications/{id}/` - Update application
- `DELETE /api/student-applications/{id}/` - Delete application

### Application Drafts
- `GET /api/application-drafts/` - List drafts
- `POST /api/application-drafts/` - Create draft
- `GET /api/application-drafts/{id}/` - Get draft details
- `PUT/PATCH /api/application-drafts/{id}/` - Update draft
- `DELETE /api/application-drafts/{id}/` - Delete draft

**Note:** This module uses legacy `admissions.Student` model, not canonical `students.Student`

---

## Legacy Module Endpoints (Gated Behind `ENABLE_LEGACY_MODULES`)

**Note:** These endpoints are only available when `ENABLE_LEGACY_MODULES=True`

### Enrollment (Legacy)
- `GET /api/legacy/api/enrollments/` - List enrollments
- `POST /api/legacy/api/enrollments/` - Create enrollment (blocked if `ALLOW_LEGACY_WRITES=False`)
- `GET /api/legacy/api/enrollments/{id}/` - Get enrollment
- `PUT/PATCH /api/legacy/api/enrollments/{id}/` - Update enrollment (blocked)
- `DELETE /api/legacy/api/enrollments/{id}/` - Delete enrollment (blocked)

### Assessments (Legacy)
- `GET /api/legacy/api/assessments/` - List assessments
- `POST /api/legacy/api/assessments/` - Create assessment (blocked)
- `GET /api/legacy/api/assessments/{id}/` - Get assessment
- `PUT/PATCH /api/legacy/api/assessments/{id}/` - Update assessment (blocked)
- `DELETE /api/legacy/api/assessments/{id}/` - Delete assessment (blocked)

### Requests (Legacy)
- `GET /api/legacy/api/requests/` - List requests
- `POST /api/legacy/api/requests/` - Create request (blocked)
- `GET /api/legacy/api/requests/{id}/` - Get request
- `PUT/PATCH /api/legacy/api/requests/{id}/` - Update request (blocked)
- `DELETE /api/legacy/api/requests/{id}/` - Delete request (blocked)

---

## Utility Endpoints

### Health Check
- `GET /health/` - Health check (no auth)
- `GET /healthz/` - Health check alias
- `GET /api/health/` - Health check API endpoint

**Response:**
```json
{
  "status": "ok",
  "service": "SIMS Backend",
  "components": {
    "database": "ok",
    "redis": "ok",
    "rq_queue": "ok"
  }
}
```

### Dashboard Stats
- `GET /api/dashboard/stats/` - Get dashboard statistics

**Auth Required:** Yes

### API Schema & Documentation
- `GET /api/schema/` - OpenAPI 3.0 schema
- `GET /api/docs/` - Swagger UI
- `GET /api/redoc/` - ReDoc UI

---

## Common Features

### Pagination
All list endpoints support pagination:
- `?page=1` - Page number (default: 1)
- `?page_size=50` - Results per page (default: 50, max: 100)

### Filtering
Use django-filters for exact matches:
- `?program=1&status=active`
- `?student=123&date=2026-01-03`

### Search
Use search parameter for partial text matches:
- `?search=john` - Searches configured search_fields

### Ordering
Use ordering parameter:
- `?ordering=name` - Ascending
- `?ordering=-name` - Descending
- `?ordering=created_at,-name` - Multiple fields

---

## Authentication

### JWT Token Format
All authenticated endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

### Token Refresh
Access tokens expire after 60 minutes (configurable). Use refresh token to get new access token:
```json
POST /api/auth/refresh/
{
  "refresh": "<refresh_token>"
}
```

---

## Permission Model

### Task-Based Permissions
All endpoints use task-based permissions (e.g., `students.students.view`, `academics.programs.create`)

### Roles
- **Admin**: Full access to all endpoints
- **Coordinator**: Manage academic structure and student placement
- **Faculty**: View/update sections they teach, attendance, assessments
- **Student**: View own data only
- **Finance**: Full access to finance module
- **Office Assistant**: Limited write access (DRAFT state only)

### Object-Level Permissions
Some endpoints support object-level permissions (e.g., students can view only their own records)
