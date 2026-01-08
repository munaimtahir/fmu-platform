# Canonical Modules Decision

This document defines which modules are **canonical** (official, production-ready) versus **legacy** (deprecated, to be phased out) in the FMU SIMS platform.

## Canonical Modules (Official)

These modules are the **source of truth** and should be used for all new development and production operations:

### Student Registry
- **Module**: `students`
- **Purpose**: Enrolled student registry (official student records)
- **Data Integrity**: This is the authoritative source for student enrollment status

### Academic Structure
- **Module**: `academics`
- **Purpose**: Programs, courses, sections, batches, academic periods, groups, departments
- **Data Integrity**: Official academic structure definitions

### Attendance
- **Module**: `attendance`
- **Purpose**: Student attendance tracking and eligibility reporting
- **Data Integrity**: Official attendance records

### Exams & Results
- **Modules**: `exams` + `results`
- **Purpose**: Exam scheduling and official marks/publishing
- **Data Integrity**: 
  - `exams` handles exam scheduling
  - `results` is the official source for published grades
  - Transcripts must read from `results` (not from legacy sources)

### Transcripts
- **Module**: `transcripts`
- **Purpose**: Official transcript generation and verification
- **Data Integrity**: Must read official grades from `results` module only

### Public Apply/Intake
- **Module**: `apps.intake`
- **Purpose**: Public student application form at `/apply`
- **Data Integrity**: Official intake workflow

### Finance
- **Module**: `finance`
- **Purpose**: Fee plans, vouchers, payments, financial reporting
- **Status**: Canonical if already stable and in production use

### Audit
- **Module**: `audit`
- **Purpose**: System audit logging
- **Status**: Canonical (required for compliance)

## Legacy Modules (Deprecated)

These modules are **legacy** and should NOT be used for new development. They are kept for backward compatibility but are gated behind environment flags:

### Legacy Modules List
- `admissions` - Use `students` + `apps.intake` instead
- `enrollment` - Use `students` enrollment features instead
- `assessments` - Use `exams` + `results` instead
- `requests` - Administrative requests (may be re-evaluated later)
- `documents` - Document management (if exists, may be re-evaluated later)
- `notifications` - Notification system (if exists, may be re-evaluated later)

## Data Integrity Rules

1. **Students Registry**: `students` is the enrolled student registry. All student enrollment status must be managed through this module.

2. **Exams & Results**: `exams` + `results` are the official marks/publishing system. All grade publishing must go through `results`.

3. **Transcripts**: `transcripts` must read official grades from `results` only. Do not read from legacy assessment modules.

4. **Intake**: `apps.intake` is the public apply workflow. Use this for student application submissions.

5. **Academic Structure**: `academics` is the canonical source for all academic structure (programs, courses, sections, etc.).

## Enforcement

### Frontend
- Legacy modules are **hidden from navigation** (sidebar, menus, dashboards)
- If legacy routes are still accessible via direct URL, they show a "LEGACY / DO NOT USE" banner
- Mutation actions (POST/PUT/PATCH/DELETE) are disabled on legacy routes

### Backend
- Legacy modules are gated behind `ENABLE_LEGACY_MODULES` environment flag (default: `false`)
- Legacy routes are prefixed with `/api/legacy/` when enabled
- Write operations (POST/PUT/PATCH/DELETE) on legacy endpoints are blocked unless `ALLOW_LEGACY_WRITES=true`
- Read operations may be allowed for backward compatibility, but writes are blocked by default

## Migration Path

1. **Phase 1 (Current)**: Hide from UI, gate routes, block writes
2. **Phase 2 (Future)**: Migrate any remaining data from legacy to canonical modules
3. **Phase 3 (Future)**: Remove legacy code entirely after migration verification

## Notes

- This decision is **LOCKED** and should not be changed without explicit approval
- All new development must use canonical modules only
- Legacy modules are kept for backward compatibility but should not be used for new features
- Production deployments should have both flags set to `false` by default
