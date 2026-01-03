# System Contracts - Non-Negotiable Rules

**Last Updated:** 2026-01-03  
**Purpose:** This document defines the non-negotiable contracts that must never break. These are the ground truth for all regression tests.

---

## 1. Authentication & Authorization Contracts

### 1.1 Student Isolation
**Contract:** A student user can ONLY see their own data.

**Enforcement:**
- Student endpoints MUST filter by `student.user == request.user`
- Students MUST NOT see other students' records
- Students MUST NOT access admin/faculty/registrar endpoints

**Affected Endpoints:**
- `GET /api/attendance/` - Only own attendance
- `GET /api/results/` - Only own published results
- `GET /api/finance/ledger/` - Only own ledger entries
- `GET /api/finance/students/{id}/` - Only own summary (id must match)
- `GET /api/dashboard/stats/` - Only own stats

**Test Requirement:** `test_student_sees_only_own_data()` in regression suite

---

### 1.2 Faculty Access Control
**Contract:** Faculty can ONLY access sections they are assigned to.

**Enforcement:**
- Faculty endpoints MUST filter by `session.faculty == request.user` or `section.faculty == request.user`
- Faculty MUST NOT access unassigned sections
- Faculty MUST NOT access student finance data

**Affected Endpoints:**
- `GET /api/attendance/` - Only assigned sections
- `GET /api/sections/` - Only assigned sections
- `POST /api/attendance/sessions/{id}/mark/` - Only if faculty assigned

**Test Requirement:** `test_faculty_cannot_access_unassigned_sections()` in regression suite

---

### 1.3 Role-Based Endpoint Access
**Contract:** Each role can ONLY access endpoints explicitly allowed for that role.

**Role → Endpoint Mapping:**
- **Student:** `/api/attendance/` (own), `/api/results/` (own), `/api/finance/students/{id}/` (own)
- **Faculty:** `/api/attendance/` (assigned sections), `/api/sections/` (assigned), `/api/gradebook/`
- **Admin:** All endpoints
- **Registrar:** `/api/students/`, `/api/enrollment/`, `/api/academics/`
- **ExamCell:** `/api/exams/`, `/api/results/` (publish actions)
- **Finance:** `/api/finance/*` (all finance endpoints)

**Test Requirement:** `test_role_based_api_access()` in regression suite

---

## 2. API Contract

### 2.1 Endpoint Response Shapes

#### Student Portal Endpoints

**`GET /api/auth/me/`**
```json
{
  "id": 1,
  "username": "student1",
  "email": "student1@test.com",
  "full_name": "Student One",
  "role": "Student",
  "is_active": true
}
```
**Required Fields:** `id`, `username`, `email`, `role`

**`GET /api/attendance/`**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "student": 1,
      "session": 1,
      "status": "PRESENT",
      "marked_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```
**Required Fields:** `results` array, each item has `student`, `session`, `status`

**`GET /api/results/`**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "exam": 1,
      "student": 1,
      "total_obtained": 85.0,
      "total_max": 100.0,
      "status": "PUBLISHED"
    }
  ]
}
```
**Required Fields:** `results` array, each item has `exam`, `student`, `status` (must be PUBLISHED for students)

**`GET /api/finance/students/{id}/`**
```json
{
  "student_id": 1,
  "outstanding_balance": 5000.00,
  "ledger_entries": [...]
}
```
**Required Fields:** `student_id`, `outstanding_balance`

---

#### Faculty Portal Endpoints

**`GET /api/sections/`**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "course": 1,
      "academic_period": 1,
      "faculty": 1,
      "name": "Section A"
    }
  ]
}
```
**Required Fields:** `results` array, each item has `faculty` (must match request.user)

**`GET /api/attendance/`** (Faculty view)
```json
{
  "count": 20,
  "results": [
    {
      "id": 1,
      "student": 1,
      "session": 1,
      "status": "PRESENT"
    }
  ]
}
```
**Required Fields:** Only attendance for sessions where `session.faculty == request.user`

---

### 2.2 Error Response Format
**Contract:** All errors MUST follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

**Common Error Codes:**
- `AUTH_INVALID_CREDENTIALS` - Login failed
- `AUTH_TOKEN_EXPIRED` - Token expired
- `PERMISSION_DENIED` - Role insufficient
- `NOT_FOUND` - Resource doesn't exist
- `VALIDATION_ERROR` - Field validation failed

**Test Requirement:** `test_error_response_format()` in regression suite

---

## 3. Workflow Contracts

### 3.1 Attendance Uniqueness
**Contract:** One attendance record per student per session. Duplicates MUST be prevented.

**Enforcement:**
- Database constraint: `unique_together = [("session", "student")]`
- Application logic: `update_or_create()` in attendance marking
- API MUST return 409 Conflict if duplicate attempted

**Test Requirement:** `test_attendance_duplicate_blocked()` in regression suite

---

### 3.2 Enrollment Uniqueness
**Contract:** One enrollment per student per section. Duplicates MUST be prevented.

**Enforcement:**
- Database constraint: `unique_together = [("student", "section")]`
- API MUST return 409 Conflict if duplicate attempted

**Test Requirement:** `test_enrollment_duplicate_blocked()` in regression suite

---

### 3.3 Result Publish/Freeze Rules
**Contract:** Results follow strict workflow: DRAFT → VERIFIED → PUBLISHED → FROZEN

**Enforcement:**
- Status transitions MUST be validated via `validate_workflow_transition()`
- Valid transitions: `DRAFT → VERIFIED`, `VERIFIED → PUBLISHED`, `PUBLISHED → FROZEN`
- PUBLISHED results MUST NOT be editable (except via change approval workflow)
- Only Admin/Coordinator can publish/verify

**Test Requirement:** `test_result_freeze_rules()` in regression suite

---

### 3.4 Read-Only Guarantees After Freeze
**Contract:** FROZEN results are immutable. No field updates allowed.

**Enforcement:**
- `perform_update()` MUST check `status == 'FROZEN'` and raise `PermissionDenied`
- Serializer `validate()` MUST prevent status changes from FROZEN
- API MUST return 403 Forbidden for update attempts

**Test Requirement:** `test_frozen_results_immutable()` in regression suite

---

### 3.5 Pending Change Approval
**Contract:** Changes to PUBLISHED results require approval workflow.

**Enforcement:**
- Direct PATCH to PUBLISHED result MUST be blocked
- Changes MUST go through PendingChange model
- Approval requires Admin/Coordinator action

**Test Requirement:** `test_pending_change_approval_enforced()` in regression suite

---

## 4. Deployment Contracts

### 4.1 No `/api/api/` Paths
**Contract:** API base URL MUST NOT include `/api` suffix if service calls already include `/api/` prefix.

**Enforcement:**
- Frontend `VITE_API_URL` MUST be `/` (relative) or `http://localhost:8000` (dev), NOT `/api`
- All service calls use paths like `/api/auth/login/`, `/api/students/`
- Final URL: `baseURL + path` MUST NOT result in `/api/api/...`

**Test Requirement:** Pre-deploy script checks for `/api/api/` in network requests

---

### 4.2 Backend Localhost Binding
**Contract:** Backend MUST be bound to `127.0.0.1` (localhost) in production, NOT `0.0.0.0`.

**Enforcement:**
- Docker compose: `ports: ["127.0.0.1:8010:8000"]`
- Backend MUST NOT be directly accessible from internet
- Only frontend/nginx/caddy can access backend

**Test Requirement:** Pre-deploy script verifies backend not accessible from external IP

---

### 4.3 Health Endpoint Availability
**Contract:** Health endpoint MUST be available at `/health/`, `/healthz/`, and `/api/health/`.

**Enforcement:**
- All three paths MUST return `{"status": "ok", "service": "SIMS Backend"}`
- Database and Redis status MUST be included in response

**Test Requirement:** Pre-deploy script hits all three health endpoints

---

## 5. Data Integrity Contracts

### 5.1 Foreign Key Integrity
**Contract:** All foreign key relationships MUST be enforced at database level.

**Enforcement:**
- `on_delete=models.PROTECT` for critical relationships (exam, student)
- `on_delete=models.CASCADE` for dependent data (attendance, results)
- Database constraints MUST prevent orphaned records

**Test Requirement:** Database migration tests verify constraints exist

---

### 5.2 Unique Constraints
**Contract:** Business-critical uniqueness MUST be enforced at database level.

**Enforced Uniqueness:**
- `Student.reg_no` - Unique
- `Enrollment(student, section)` - Unique together
- `Attendance(session, student)` - Unique together
- `ResultHeader(exam, student)` - Unique together

**Test Requirement:** Regression tests attempt duplicates and verify 409 Conflict

---

## 6. Testing Contracts

### 6.1 Regression Tests Must Use Seed Data
**Contract:** Regression tests MUST run with demo/seed data, NOT empty database.

**Enforcement:**
- Tests MUST use fixtures that create realistic data
- Tests MUST NOT assume empty database
- Tests MUST verify behavior with existing records

**Test Requirement:** All regression tests in `tests/regression/` use `conftest.py` fixtures

---

### 6.2 Tests Must Fail Fast
**Contract:** Regression tests MUST fail immediately on contract violation.

**Enforcement:**
- Tests MUST use `assert` statements (not warnings)
- CI MUST fail on any regression test failure
- Tests MUST NOT be marked as `@pytest.mark.skip` or `continue-on-error: true`

**Test Requirement:** CI workflow runs regression tests as blocking step

---

## 7. Change Impact Assessment

When modifying code, check against these contracts:

1. **Auth Changes:** Does it break student isolation? Faculty access control?
2. **API Changes:** Does response shape change? Are required fields still present?
3. **Workflow Changes:** Does it break uniqueness? Freeze rules? Approval flow?
4. **Deployment Changes:** Does it introduce `/api/api/`? Expose backend?
5. **Data Changes:** Does it break foreign keys? Unique constraints?

**If ANY contract is violated, the change MUST be rejected or the contract MUST be updated (with team approval).**

---

## 8. Contract Violation Response

If a contract violation is detected:

1. **Immediate:** Block merge/deployment
2. **Investigation:** Identify root cause
3. **Fix:** Restore contract compliance
4. **Prevention:** Add regression test to prevent recurrence
5. **Documentation:** Update this contract if intentional change approved

---

**This document is the source of truth. All tests, CI checks, and deployment scripts reference these contracts.**
