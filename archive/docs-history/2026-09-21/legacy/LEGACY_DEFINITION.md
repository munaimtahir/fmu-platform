# Legacy Definition - Source of Truth

This document defines which modules are **canonical** (official, production-ready) versus **legacy** (deprecated, to be permanently removed) in the FMU SIMS platform.

## Canonical Modules (KEEP)

These modules are the **source of truth** and must remain in the system:

### Core Infrastructure
- **`core`**: RBAC system with task-based permissions, user management
- **`people`**: Normalized identity and contact data (Person, ContactInfo, Address, IdentityDocument)

### Student Registry
- **`students`**: Enrolled student registry (official student records)
  - Model: `sims_backend.students.models.Student`
  - This is the authoritative source for student enrollment status

### Academic Structure
- **`academics`**: Programs, Periods, Tracks, Blocks, Modules, Courses, Sections, Batches, Academic Periods, Groups, Departments
  - New structure: Program → Period → Track → Block → Module
  - Model: `sims_backend.academics.models.*`

### Attendance
- **`attendance`**: Student attendance tracking and eligibility reporting
  - Model: `sims_backend.attendance.models.*`

### Exams & Results
- **`exams`**: Exam scheduling
  - Model: `sims_backend.exams.models.*`
- **`results`**: Official marks/publishing system
  - Model: `sims_backend.results.models.*`

### Transcripts
- **`transcripts`**: Official transcript generation and verification
  - Model: `sims_backend.transcripts.models.*`
  - Must read official grades from `results` module only

### Public Apply/Intake
- **`apps.intake`**: Public student application form at `/apply`
  - Model: `apps.intake.models.*`

### Finance
- **`finance`**: Fee plans, vouchers, payments, financial reporting
  - Model: `sims_backend.finance.models.*`

### Audit
- **`audit`**: System audit logging (required for compliance)
  - Model: `sims_backend.audit.models.*`

### Timetable
- **`timetable`**: Class scheduling and session management
  - Model: `sims_backend.timetable.models.*`

## Legacy Modules (REMOVE)

These modules are **legacy** and must be **permanently deleted** from the codebase:

### Legacy Modules List
1. **`admissions`** (`sims_backend.admissions`)
   - **Replacement**: Use `students` + `apps.intake` instead
   - **Models to remove**: `Student`, `StudentApplication`, `ApplicationDraft`
   - **Note**: Canonical Student model is `sims_backend.students.models.Student`

2. **`enrollment`** (`sims_backend.enrollment`)
   - **Replacement**: Use `students` enrollment features instead
   - **Models to remove**: `Enrollment`
   - **Note**: Enrollment tracking may need to be handled via Section relationships or moved to students app

3. **`assessments`** (`sims_backend.assessments`)
   - **Replacement**: Use `exams` + `results` instead
   - **Models to remove**: `Assessment`, `AssessmentScore`
   - **Note**: Canonical assessment/grading is handled by `exams` and `results` modules

4. **`requests`** (`sims_backend.requests`)
   - **Replacement**: Administrative requests (may be re-evaluated later, but for now REMOVE)
   - **Models to remove**: All request-related models

5. **`documents`** (`sims_backend.documents`)
   - **Replacement**: Document management (if exists, may be re-evaluated later, but for now REMOVE)
   - **Models to remove**: All document-related models

6. **`notifications`** (`sims_backend.notifications`)
   - **Replacement**: Notification system (if exists, may be re-evaluated later, but for now REMOVE)
   - **Models to remove**: All notification-related models

## Data Integrity Rules

1. **Identity & Auth**: `core` provides RBAC and user management. `people` provides normalized identity data that all other modules reference.

2. **Students Registry**: `sims_backend.students.models.Student` is the enrolled student registry. All student enrollment status must be managed through this module.

3. **Exams & Results**: `exams` + `results` are the official marks/publishing system. All grade publishing must go through `results`.

4. **Transcripts**: `transcripts` must read official grades from `results` only. Do not read from legacy assessment modules.

5. **Intake**: `apps.intake` is the public apply workflow. Use this for student application submissions.

6. **Academic Structure**: `academics` is the canonical source for all academic structure (programs, courses, sections, etc.).

## Migration Notes

- Legacy `admissions.Student` → Use `students.Student`
- Legacy `enrollment.Enrollment` → Track via `students.Student` relationships with `academics.Section`
- Legacy `assessments.Assessment` → Use `exams.Exam` and `results.ResultHeader`
- Legacy `assessments.AssessmentScore` → Use `results.ResultComponentEntry`

## Verification

After removal, verify:
- No imports of legacy modules remain
- No references to legacy models in canonical code
- All tests pass
- E2E tests pass
- Frontend builds without errors
- Backend boots without warnings
