# Attendance Module Specification

## Purpose + Boundaries

**Purpose:** Attendance capture and eligibility computation.

**Owns:**
- Attendance records
- Same-day edit rules
- Eligibility logic
- Defaulter reports
- Exports

**Locked Decision:** Past attendance edits are restricted; eligibility rules are configurable but explicit.

## Models

### Attendance
- `session`: ForeignKey(Session)
- `student`: ForeignKey(Student)
- `status`: CharField (PRESENT, ABSENT, LATE, LEAVE)
- `marked_by`: ForeignKey(User)
- `marked_at`: DateTimeField
- Unique constraint: (session, student)

## APIs

### `/api/attendance/attendances/`
- CRUD with `attendance.attendances.*` permissions
- Object-level: Students can view own attendance, Faculty can view own sections
- Filters: `session`, `student`, `status`

### `/api/attendance/attendances/eligibility/`
- GET: Check eligibility for student/section
- Permission: `attendance.eligibility.view`
- Query params: `student_id`, `section_id`, `threshold` (optional, default 75%)

### `/api/attendance/attendances/export/`
- GET: Export attendance records as CSV
- Permission: `attendance.attendances.export`
- Filters applied

### `/api/attendance/attendances/sessions/{id}/mark/`
- POST: Mark attendance for all students in a session
- Permission: `attendance.attendances.create`
- Request: `{attendance: [{student_id, status}]}`

## Workflows / State Machines

**Edit Rules:**
- Same-day edits: Allowed for authorized users
- Past edits: Restricted (admin override required)
- Validation in `_validate_date()` service function

## Validations + Conflict Handling

- Same day: Can edit attendance for today
- Past dates: Requires admin permissions
- Session date validation: Must match session schedule (admin can override)

## Frontend Screens

### Admin Screens
- Attendance list/search
- Eligibility reports
- CSV export

### Faculty Screens
- Mark attendance for own sections
- View section attendance summary

### Student Screens
- View own attendance records
- View attendance percentage

## Tests Required

1. CRUD tests
2. Permission tests (object-level)
3. Same-day edit tests
4. Past-edit restriction tests
5. Eligibility calculation tests
6. CSV export tests
