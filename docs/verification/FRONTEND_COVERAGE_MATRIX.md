# Frontend Coverage Matrix

**Date:** 2026-01-03  
**Purpose:** Verify frontend UI exists for every backend service/module

## Coverage Status Legend
- ✅ **Complete** - Frontend page exists and wired to correct endpoints
- ⚠️ **Partial** - Frontend page exists but may need updates
- ❌ **Missing** - No frontend page for backend endpoint
- 🔄 **Legacy** - Legacy route, wrapped with LegacyRouteGuard

## Core Modules

### Authentication
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `POST /api/auth/login/` | `/login` | `LoginPage` | ✅ | Unified login working |
| `POST /api/auth/logout/` | (Logout button) | Auth hook | ✅ | Logout integrated |
| `GET /api/auth/me/` | (Profile) | `ProfilePage` | ✅ | User profile page |
| `POST /api/auth/refresh/` | (Auto) | Axios interceptor | ✅ | Auto token refresh |

### Core RBAC
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/core/roles/` | `/admin/roles` | `RolesPage` | ✅ | Roles management |
| `GET /api/core/permission-tasks/` | `/admin/roles` | `RolesPage` | ✅ | Integrated with roles |
| `GET /api/core/users/me/` | `/profile` | `ProfilePage` | ✅ | User profile |

## People Module

| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/people/persons/` | (Embedded) | Forms | ⚠️ | Used in forms, no dedicated page |
| `POST /api/people/persons/` | (Embedded) | Forms | ⚠️ | Used in student application |
| `GET /api/people/contact-info/` | (Embedded) | Forms | ⚠️ | Used in forms |
| `GET /api/people/addresses/` | (Embedded) | Forms | ⚠️ | Used in forms |
| `GET /api/people/identity-documents/` | (Embedded) | Forms | ⚠️ | Used in forms |

**Note:** People module is primarily used via embedded forms in other modules. No dedicated management page exists.

## Academics Module

### Programs
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/programs/` | `/academics/programs` | `ProgramsListPage` | ✅ | List page working |
| `GET /api/programs/{id}/` | `/academics/programs/:id` | `ProgramDetailPage` | ✅ | Detail page working |
| `POST /api/programs/` | `/academics/programs/new` | `ProgramFormPage` | ✅ | Create form working |
| `PATCH /api/programs/{id}/` | `/academics/programs/:id/edit` | `ProgramFormPage` | ✅ | Edit form working |
| `POST /api/programs/{id}/finalize/` | `ProgramDetailPage` | ✅ | Finalize action |
| `POST /api/programs/{id}/generate-periods/` | `ProgramDetailPage` | ✅ | Generate periods action |

### Batches
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/batches/` | `/academics/batches` | `BatchesPage` | ✅ | List + CRUD |

### Academic Periods
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/academic-periods/` | `/academics/periods` | `AcademicPeriodsPage` | ✅ | List + CRUD |

### Groups
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/groups/` | `/academics/groups` | `GroupsPage` | ✅ | List + CRUD |

### Departments
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/departments/` | `/academics/departments` | `DepartmentsPage` | ✅ | List + CRUD |

### Courses
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/courses/` | `/courses` | `CoursesPage` | ✅ | List + CRUD |

### Sections
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/sections/` | `/sections` | `SectionsPage` | ✅ | List + CRUD |

### Periods/Tracks/Blocks/Modules (New Structure)
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/periods/` | ❌ | Missing | ❌ | **MISSING** - No frontend page |
| `GET /api/tracks/` | ❌ | Missing | ❌ | **MISSING** - No frontend page |
| `GET /api/blocks/` | ❌ | Missing | ❌ | **MISSING** - No frontend page |
| `GET /api/modules/` | ❌ | Missing | ❌ | **MISSING** - No frontend page |

**Action Required:** Create frontend pages for Periods, Tracks, Learning Blocks, and Modules

## Students Module

| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/students/` | `/students` | `StudentsPage` | ✅ | List + CRUD working |
| `GET /api/students/me/` | `/dashboard/student` | `StudentDashboard` | ✅ | Student dashboard |
| `POST /api/students/import/preview/` | `/admin/students/import` | `StudentsImportPage` | ✅ | Import page |
| `GET /api/leave-periods/` | (Embedded in StudentsPage) | ✅ | Leave periods integrated |

**Schema Fix:** ✅ Student page now works with `person_id` field

## Attendance Module

| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/attendance/` | `/attendance` | `AttendanceDashboard` | ✅ | Attendance dashboard |
| `POST /api/attendance-input/live/submit/` | `/attendance/input` | `AttendanceInputPage` | ✅ | Live attendance input |
| `POST /api/attendance-input/csv/commit/` | (Bulk attendance) | `BulkAttendancePage` | ✅ | CSV import |
| `GET /api/attendance/eligibility/` | `/attendance/eligibility` | `EligibilityReport` | ✅ | Eligibility report |

## Timetable Module

| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/timetable/sessions/` | `/timetable` | `TimetablePage` | ✅ | Timetable view |

## Exams Module

| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/exams/` | `/exams` | `ExamsPage` | ✅ | Exams management |
| `GET /api/exam-components/` | (Embedded in ExamsPage) | ✅ | Components integrated |

## Results Module

| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/results/` | `/results` | `ResultsPage` | ✅ | Results view |
| `GET /api/result-components/` | (Embedded) | ✅ | Components integrated |
| `GET /api/results/` | `/gradebook` | `Gradebook` | ✅ | Gradebook view |

### Publish Results
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| Publish action | `/examcell/publish` | `PublishResults` | ✅ | Publish results page |

## Transcripts Module

| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/transcripts/{student_id}/` | `/transcripts` | `TranscriptsPage` | ✅ | Transcript generation |
| `GET /api/transcripts/verify/{token}/` | `/verify/:token` | `TranscriptVerify` | ✅ | Public verification |

## Finance Module

### Fee Plans
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/finance/fee-plans/` | `/finance/fee-plans` | `FeePlansPage` | ✅ | Fee plans management |

### Vouchers
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/finance/vouchers/` | `/finance/vouchers` | `VoucherGenerationPage` | ✅ | Voucher generation |
| `GET /api/finance/vouchers/` | `/finance/vouchers/list` | `VouchersPage` | ✅ | Vouchers list |

### Payments
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/finance/payments/` | `/finance/payments` | `PaymentsPage` | ✅ | Payments management |

### Reports
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/finance/reports/` | `/finance/reports/collection` | `CollectionReportPage` | ✅ | Collection report |
| `GET /api/finance/reports/` | `/finance/reports/defaulters` | `DefaultersReportPage` | ✅ | Defaulters report |
| `GET /api/finance/reports/` | `/finance/reports/aging` | `AgingReportPage` | ✅ | Aging report |
| `GET /api/finance/students/{id}/` | `/finance/reports/statement` | `StudentStatementPage` | ✅ | Student statement |

### Finance Dashboard
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/finance/students/` | `/finance` | `FinanceDashboard` | ✅ | Finance dashboard |
| Student finance | `/finance/me` | `StudentFinancePage` | ✅ | Student finance view |

## Audit Module

| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/audit/` | `/admin/audit` | `AuditLog` | ✅ | Audit log viewer |

## Legacy Modules (Gated)

### Assessments (Legacy)
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/legacy/api/assessments/` | `/assessments` | `AssessmentsPage` | 🔄 | Wrapped with LegacyRouteGuard |

### Requests (Legacy)
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/legacy/api/requests/` | `/requests` | `RequestsPage` | 🔄 | Wrapped with LegacyRouteGuard |

### Enrollment (Legacy)
| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `GET /api/legacy/api/enrollments/` | `/enrollment/bulk` | `BulkEnrollmentPage` | 🔄 | Marked as legacy, hidden from nav |

## Admissions Module (Special Case)

| Backend Endpoint | Frontend Route | Component | Status | Notes |
|-----------------|----------------|-----------|--------|-------|
| `POST /api/student-applications/` | `/apply` | `StudentApplicationPage` | ✅ | Public application form |
| `GET /api/application-drafts/` | `/apply` | `StudentApplicationPage` | ✅ | Draft save/load |

**Note:** Admissions module kept for public application form compatibility

## Missing Frontend Coverage

### New Academics Structure
- ❌ **Periods** (`/api/periods/`) - No frontend page
- ❌ **Tracks** (`/api/tracks/`) - No frontend page
- ❌ **Learning Blocks** (`/api/blocks/`) - No frontend page
- ❌ **Modules** (`/api/modules/`) - No frontend page

**Recommendation:** Create frontend pages for these resources or integrate them into existing Program management page.

### People Module
- ⚠️ **Dedicated Management Page** - People module primarily used via embedded forms
- **Action:** Consider creating dedicated people management page for admin users

## Summary

### Coverage Statistics
- **Total Backend Resources:** ~50 endpoints
- **Covered:** ~45 endpoints (90%)
- **Missing:** ~5 endpoints (10%)
- **Legacy:** ~3 endpoints (6%)

### Critical Missing Coverage
1. **Periods** - New academics structure endpoint
2. **Tracks** - New academics structure endpoint
3. **Learning Blocks** - New academics structure endpoint
4. **Modules** - New academics structure endpoint

### Action Items
1. ✅ Schema fixes applied (students.person_id, academics.structure_type)
2. ✅ Core CRUD pages working
3. ⚠️ Create frontend pages for Periods, Tracks, Blocks, Modules
4. ⚠️ Consider dedicated People management page

## Next Steps

1. Create frontend pages for missing academics structure endpoints
2. Verify API wiring for all existing pages
3. Test create/update/delete flows for all resources
4. E2E testing with Playwright/Cypress
