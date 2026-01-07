# Results Module Specification

## Purpose + Boundaries

**Purpose:** Exam result management with state machine.

**Owns:**
- Result records (per student per exam)
- Result components
- State machine: draft → verified → published → frozen

**Locked Decision:** Immutable states (published/frozen) block direct edits; corrections after publish/freeze must go through Requests workflow.

## Models

### ResultHeader
- `exam`: ForeignKey(Exam)
- `student`: ForeignKey(Student)
- `total_obtained`: DecimalField
- `total_max`: DecimalField
- `final_outcome`: CharField (PASS, FAIL, PENDING)
- `status`: CharField (DRAFT, VERIFIED, PUBLISHED, FROZEN)
- `published_at`: DateTimeField
- `published_by`: ForeignKey(User)
- `frozen_at`: DateTimeField
- `frozen_by`: ForeignKey(User)
- Properties: `is_editable`, `is_publishable`, `is_freezable`
- Methods: `publish(user)`, `freeze(user)`

### ResultComponentEntry
- `result_header`: ForeignKey(ResultHeader)
- `exam_component`: ForeignKey(ExamComponent)
- `marks_obtained`: DecimalField
- `marks_max`: DecimalField
- `outcome`: CharField

## APIs

### `/api/results/result-headers/`
- CRUD with `results.result_headers.*` permissions
- Object-level: Students can view own published results
- Filters: `exam`, `student`, `status`, `final_outcome`

### `/api/results/result-headers/{id}/verify/`
- POST: Verify result (DRAFT → VERIFIED)
- Permission: `results.result_headers.verify`

### `/api/results/result-headers/{id}/publish/`
- POST: Publish result (DRAFT/VERIFIED → PUBLISHED)
- Permission: `results.result_headers.publish`

### `/api/results/result-headers/{id}/freeze/`
- POST: Freeze result (PUBLISHED → FROZEN, makes immutable)
- Permission: `results.result_headers.freeze`

### `/api/results/result-headers/me/`
- GET: Student's own published results
- Permission: `results.result_headers.view` (object-level)

## Workflows / State Machines

**States:** DRAFT → VERIFIED → PUBLISHED → FROZEN

**Transitions:**
- DRAFT: Editable, can verify
- VERIFIED: Can publish, can edit (if admin override)
- PUBLISHED: Can freeze, immutable (edits blocked, must use Requests)
- FROZEN: Fully immutable (corrections via Requests only)

**Immutability Enforcement:**
- `perform_update` checks `is_editable` property
- Blocked states: PUBLISHED, FROZEN (unless admin override)

## Validations + Conflict Handling

- Only DRAFT results can be edited directly
- PUBLISHED/FROZEN results require Requests workflow for corrections
- Finance gate check: Students may be blocked from viewing results if outstanding dues

## Frontend Screens

### Admin Screens
- Result entry (draft state)
- Verify/publish/freeze actions
- Result corrections via Requests

### Student Screens
- View own published results
- Request corrections if needed

## Tests Required

1. CRUD tests
2. State transition tests (verify, publish, freeze)
3. Immutability enforcement tests
4. Permission tests
5. Finance gate tests
