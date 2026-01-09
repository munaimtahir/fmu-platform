# Backend Legacy Removal Documentation

This document details all legacy modules removed from the backend.

## Apps Removed from INSTALLED_APPS

The following apps were removed from `backend/sims_backend/settings.py`:

1. **`sims_backend.admissions`** - Legacy student records and applications
2. **`sims_backend.enrollment`** - Legacy enrollment tracking
3. **`sims_backend.assessments`** - Legacy assessment/grading system
4. **`sims_backend.requests`** - Administrative requests module
5. **`sims_backend.documents`** - Document generation module
6. **`sims_backend.notifications`** - Notification service module

## URLs Removed

The following URL patterns were removed from `backend/sims_backend/urls.py`:

- `path("api/", include("sims_backend.admissions.urls"))`
- All legacy routes gated behind `ENABLE_LEGACY_MODULES` flag:
  - `path("api/legacy/", include("sims_backend.enrollment.urls"))`
  - `path("api/legacy/", include("sims_backend.assessments.urls"))`
  - `path("api/legacy/", include("sims_backend.requests.urls"))`

## Directories Deleted

The following app directories were completely deleted:

- `backend/sims_backend/admissions/`
- `backend/sims_backend/enrollment/`
- `backend/sims_backend/assessments/`
- `backend/sims_backend/requests/`
- `backend/sims_backend/documents/`
- `backend/sims_backend/notifications/`

## Files Modified

### Settings
- `backend/sims_backend/settings.py`
  - Removed legacy apps from INSTALLED_APPS
  - Removed `BlockLegacyWritesMiddleware` from MIDDLEWARE
  - Removed `ENABLE_LEGACY_MODULES` and `ALLOW_LEGACY_WRITES` flags

### URLs
- `backend/sims_backend/urls.py`
  - Removed all legacy route includes

### Core
- `backend/core/middleware.py` - **DELETED** (BlockLegacyWritesMiddleware no longer needed)
- `backend/core/demo_scenarios.py`
  - Removed imports: `admissions.Student`, `enrollment.Enrollment`, `assessments.Assessment/AssessmentScore`
  - Updated `create_demo_students()` to use canonical `students.Student`
  - Disabled `enroll_students_in_sections()` function
  - Disabled `create_assessment_scores()` function
  - Removed cleanup code for enrollment and assessments

### Transcripts
- `backend/sims_backend/transcripts/jobs.py`
  - Changed import from `admissions.Student` to `students.Student`

### Academics
- `backend/sims_backend/academics/serializers.py`
  - Updated `get_enrolled_count()` to return 0 (legacy enrollment removed)

### Results
- `backend/sims_backend/results/utils.py`
  - Removed `calculate_final_grade()` function (used legacy assessments)

### Tests
- `backend/core/tests/test_seed_demo_scenarios.py`
  - Updated imports to use `students.Student` instead of `admissions.Student`
  - Removed `test_enrollments_created()` test (legacy enrollment removed)
  - Updated other tests to use canonical Student model

- `backend/tests/regression/test_data_integrity.py`
  - Removed `TestEnrollmentUniqueness` test class
  - Removed enrollment import

## Imports Fixed

All imports of legacy modules were replaced with canonical equivalents:

- `admissions.Student` → `students.Student`
- `enrollment.Enrollment` → Removed (no canonical equivalent yet)
- `assessments.Assessment` → Use `exams.Exam` and `results.ResultHeader`
- `assessments.AssessmentScore` → Use `results.ResultComponentEntry`

## Admin Registrations

All admin registrations for legacy models were removed when app directories were deleted:
- `admissions.admin.StudentAdmin`
- `admissions.admin.StudentApplicationAdmin`
- All other legacy admin classes

## Notes

- Legacy database tables may still exist but are no longer queried
- Migrations for legacy apps remain in the codebase but are not applied to new databases
- No destructive database operations were performed (tables not dropped)
