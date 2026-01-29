# Frontend Feature Coverage Matrix

## Overview

This document tracks which backend API endpoints have corresponding frontend UI pages and identifies any gaps.

## Coverage Status

✅ = Frontend page exists and is functional  
⚠️ = Frontend page exists but may need enhancement  
❌ = No frontend page (backend-only or missing)  
🔧 = Partial implementation

## Authentication & User Management

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/auth/login/` | POST | `/login` | ✅ | Login page |
| `/api/auth/logout/` | POST | Topbar menu | ✅ | Logout action |
| `/api/auth/me/` | GET | `/profile` | ✅ | Profile page |
| `/api/auth/refresh/` | POST | Auto-handled | ✅ | Token refresh interceptor |
| User Management | - | `/admin/users` | ⚠️ | Info page (Django admin for actual management) |

## Academics

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/academics/programs/` | GET, POST, PUT, PATCH, DELETE | `/academics/programs` | ✅ | Programs list page |
| `/api/academics/batches/` | GET, POST, PUT, PATCH, DELETE | `/academics/batches` | ✅ | Batches list page |
| `/api/academics/academic-periods/` | GET, POST, PUT, PATCH, DELETE | `/academics/periods` | ✅ | Academic periods list page |
| `/api/academics/groups/` | GET, POST, PUT, PATCH, DELETE | `/academics/groups` | ✅ | Groups list page |
| `/api/academics/departments/` | GET, POST, PUT, PATCH, DELETE | `/academics/departments` | ✅ | Departments list page |

## Students

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/students/` | GET, POST, PUT, PATCH, DELETE | `/students` | ✅ | Students CRUD page |
| `/api/admin/students/import/` | POST | `/admin/students/import` | ✅ | Student import page |

## Courses & Sections

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/courses/` | GET, POST, PUT, PATCH, DELETE | `/courses` | ✅ | Courses CRUD page |
| `/api/sections/` | GET, POST, PUT, PATCH, DELETE | `/sections` | ✅ | Sections CRUD page |

## Timetable

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/timetable/sessions/` | GET, POST, PUT, PATCH, DELETE | `/timetable` | ✅ | Timetable page |

## Enrollment

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/enrollments/` | GET, POST, PUT, PATCH, DELETE | - | 🔧 | Used in bulk enrollment |
| `/api/enrollments/bulk/` | POST | `/enrollment/bulk` | ✅ | Bulk enrollment page |

## Attendance

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/attendance/` | GET, POST, PUT, PATCH, DELETE | `/attendance` | ✅ | Attendance dashboard |
| `/api/attendance-input/live/roster/` | GET | `/attendance/input` | ✅ | Live attendance roster |
| `/api/attendance-input/live/submit/` | POST | `/attendance/input` | ✅ | Live attendance submission |
| `/api/attendance-input/csv/dry-run/` | POST | `/attendance/bulk` | ✅ | CSV dry run |
| `/api/attendance-input/csv/commit/` | POST | `/attendance/bulk` | ✅ | CSV commit |
| `/api/attendance-input/sheet/template/` | GET | `/attendance/bulk` | ✅ | Tick sheet template |
| `/api/attendance-input/sheet/dry-run/` | POST | `/attendance/bulk` | ✅ | Tick sheet dry run |
| `/api/attendance-input/sheet/commit/` | POST | `/attendance/bulk` | ✅ | Tick sheet commit |
| `/api/attendance-input/biometric/punches/` | POST | - | ❌ | Biometric integration (backend-only) |
| `/api/attendance/eligibility/` | GET | `/attendance/eligibility` | ✅ | Eligibility report |

## Assessments

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/assessments/` | GET, POST, PUT, PATCH, DELETE | `/assessments` | ✅ | Assessments CRUD page |
| `/api/assessment-scores/` | GET, POST, PUT, PATCH, DELETE | `/assessments`, `/gradebook` | ✅ | Used in assessments and gradebook |

## Exams

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/exams/` | GET, POST, PUT, PATCH, DELETE | `/exams` | ✅ | Exams list page |
| `/api/exam-components/` | GET, POST, PUT, PATCH, DELETE | `/exams` | 🔧 | Shown in exams page (can be enhanced) |

## Results

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/results/` | GET, POST, PUT, PATCH, DELETE | `/results` | ✅ | Results list page |
| `/api/result-components/` | GET, POST, PUT, PATCH, DELETE | `/results` | 🔧 | Shown in results page (can be enhanced) |
| `/api/examcell/publish/` | POST | `/examcell/publish` | ✅ | Publish results page |

## Gradebook

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| Gradebook view | - | `/gradebook` | ✅ | Gradebook page (uses assessments and scores) |

## Finance

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/finance/fee-types/` | GET, POST, PUT, PATCH, DELETE | `/finance/fee-plans` | 🔧 | Used in fee plans |
| `/api/finance/fee-plans/` | GET, POST, PUT, PATCH, DELETE | `/finance/fee-plans` | ✅ | Fee plans page |
| `/api/finance/vouchers/` | GET, POST, PUT, PATCH, DELETE | `/finance/vouchers`, `/finance/vouchers/list` | ✅ | Voucher pages |
| `/api/finance/payments/` | GET, POST, PUT, PATCH, DELETE | `/finance/payments` | ✅ | Payments page |
| `/api/finance/ledger/` | GET, POST, PUT, PATCH, DELETE | `/finance` | 🔧 | Used in finance dashboard |
| `/api/finance/adjustments/` | GET, POST, PUT, PATCH, DELETE | `/finance` | 🔧 | Used in finance dashboard |
| `/api/finance/policies/` | GET, POST, PUT, PATCH, DELETE | - | ❌ | Finance policies (backend-only) |
| `/api/finance/students/` | GET | `/finance/me` (Student) | ✅ | Student finance summary |
| `/api/finance/reports/` | GET | Various report pages | ✅ | Collection, defaulters, aging, statement reports |

## Transcripts

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/transcripts/{student_id}/` | GET | `/transcripts` | ✅ | Transcript generation (info page) |
| `/api/transcripts/enqueue/` | POST | `/transcripts` | ✅ | Background transcript generation |
| `/api/transcripts/verify/{token}/` | GET | `/verify/:token` | ✅ | Transcript verification page |

## Requests

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/requests/` | GET, POST, PUT, PATCH, DELETE | `/requests` | ✅ | Requests list page (Bonafide, Transcript, NOC) |

## Admissions

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/students/` (admissions) | GET, POST | `/apply` | ✅ | Student application form |
| `/api/student-applications/` | GET, POST, PUT, PATCH, DELETE | `/apply` | ✅ | Application management |

## Administration

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/audit/` | GET | `/admin/audit` | ✅ | Audit log viewer |
| `/api/dashboard/stats/` | GET | Various dashboards | ✅ | Dashboard statistics |

## Analytics

| Endpoint | Method | Frontend Page | Status | Notes |
|----------|--------|---------------|--------|-------|
| Analytics endpoints | - | `/analytics` | ✅ | Analytics dashboard |

## Summary

### Coverage Statistics

- **Total Backend Endpoints**: ~80+
- **Frontend Pages Created**: 40+
- **Coverage**: ~95% of user-facing features

### Missing or Incomplete Features

1. **User Management API** - Currently uses Django admin (info page exists)
2. **Finance Policies** - Backend-only configuration
3. **Biometric Attendance** - Backend integration only
4. **Exam Components Detail View** - List exists, detail view can be enhanced
5. **Result Components Detail View** - List exists, detail view can be enhanced
6. **Password Change** - Backend endpoint needed

### Intentionally Backend-Only

- Health check endpoints
- API schema/docs endpoints
- Internal system configuration
- Background job queues

## Future Enhancements

1. **Enhanced Detail Views**: Add detail/edit pages for all entities
2. **Bulk Operations UI**: Expand bulk operation interfaces
3. **Advanced Filtering**: Add more filter options to list pages
4. **Export Functionality**: Add export buttons to list pages
5. **User Management API**: Create full user management UI when backend API is available

## Notes

- All list pages include search functionality
- CRUD operations are available where backend supports them
- Role-based access is enforced at both UI and route levels
- Backend permissions are the source of truth for access control
