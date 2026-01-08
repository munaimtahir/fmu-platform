# FRONTEND COVERAGE MATRIX

**Generated**: 2026-01-08  
**Frontend Framework**: React 19 + Vite  
**Status**: Coverage Analysis Complete

## Module Coverage Overview

| Backend Module | List Screen | Create Form | Detail View | Edit Form | Delete Action | Coverage % |
|----------------|-------------|-------------|-------------|-----------|---------------|------------|
| **People** | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 0% |
| **Students** | ✅ Yes | ✅ Yes (Import) | ⚠️ Limited | ⚠️ Limited | ⚠️ Missing | 40% |
| **Academics - Programs** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Partial | 90% |
| **Academics - Batches** | ✅ Yes | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 20% |
| **Academics - Groups** | ✅ Yes | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 20% |
| **Academics - Departments** | ✅ Yes | ⚠️ Partial | ⚠️ Missing | ⚠️ Partial | ⚠️ Missing | 40% |
| **Academics - Periods** | ✅ Yes | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 20% |
| **Academics - Tracks** | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 0% |
| **Academics - Blocks** | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 0% |
| **Academics - Modules** | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 0% |
| **Academics - Courses** | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 0% |
| **Academics - Sections** | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 0% |
| **Attendance** | ✅ Yes | ✅ Yes (Multiple) | ✅ Yes | ⚠️ Limited | ⚠️ Limited | 60% |
| **Timetable** | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 0% |
| **Exams** | ✅ Yes | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | ⚠️ Missing | 20% |
| **Results** | ✅ Yes | ✅ Yes (Gradebook) | ✅ Yes | ✅ Yes | ⚠️ Limited | 80% |
| **Finance** | ✅ Yes (Multiple) | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Limited | 80% |
| **Audit** | ✅ Yes | N/A | ✅ Yes | N/A | N/A | 100% |

**Overall Coverage**: 30% (11/36 modules have >50% coverage)

## Detailed Page Inventory

### People Module (0% Coverage)
**Backend Resources**: Person, ContactInfo, Address, IdentityDocument  
**Frontend Pages**: ❌ NONE

**Missing Screens**:
- [ ] `/people/persons` - List all persons with search/filter
- [ ] `/people/persons/new` - Create new person
- [ ] `/people/persons/:id` - Person detail with tabs (contact, address, documents)
- [ ] `/people/persons/:id/edit` - Edit person details

**API Endpoints Available**:
- GET/POST `/api/people/persons/`
- GET/PUT/PATCH/DELETE `/api/people/persons/{id}/`
- Similar for contact-info, addresses, identity-documents

**Priority**: **HIGH** - Person is core identity record referenced by students, faculty, staff

---

### Students Module (40% Coverage)
**Backend Resources**: Student, LeavePeriod, StudentImport  
**Frontend Pages**: 4 pages (partial coverage)

#### Existing Pages:
1. ✅ `/admin/students-import` - `StudentsImportPage.tsx`
   - Full import workflow (upload, validate, commit)
   - Status tracking and error reporting
   - **Coverage**: 100%

2. ⚠️ `/admin/students-programs` - `StudentsProgramsPage.jsx`
   - Currently placeholder (254 bytes)
   - **Coverage**: 0%

3. ⚠️ `/admin/students-batches` - `StudentsBatchesPage.jsx`
   - Currently placeholder (248 bytes)
   - **Coverage**: 0%

4. ⚠️ `/admin/students-academic-periods` - `StudentsAcademicPeriodsPage.jsx`
   - Currently placeholder (257 bytes)
   - **Coverage**: 0%

**Missing Screens**:
- [ ] `/students` - List students with advanced filters (program, batch, group, status)
- [ ] `/students/new` - Create new student manually
- [ ] `/students/:id` - Student detail view (profile, enrollment, leaves)
- [ ] `/students/:id/edit` - Edit student details
- [ ] `/students/:id/leaves` - Leave period management
- [ ] `/students/:id/leaves/new` - Request new leave

**API Wiring Issues**:
- Placeholder pages not wired to backend
- No student detail/edit screens
- Leave period UI completely missing

**Priority**: **CRITICAL** - Students are central to the system

---

### Academics Module

#### Programs (90% Coverage)
**Frontend Pages**: 4 pages

1. ✅ `/academics/programs` - `ProgramsPage.tsx` (2861 bytes)
   - Full program list with search
   - **Coverage**: 100%

2. ✅ `/academics/programs/list` - `ProgramsListPage.tsx` (4886 bytes)
   - Enhanced list view
   - **Coverage**: 100%

3. ✅ `/academics/programs/new` - `ProgramFormPage.tsx` (4617 bytes)
   - Create/edit form with structure configuration
   - **Coverage**: 100%

4. ✅ `/academics/programs/:id` - `ProgramDetailPage.tsx` (8286 bytes)
   - Full program details with tabs
   - Structure visualization
   - Batch/track/period management
   - **Coverage**: 90%

**Status**: ✅ **GOOD** - Full CRUD for programs

#### Batches (20% Coverage)
**Frontend Pages**: 2 pages (limited)

1. ✅ `/academics/batches` - `BatchesPage.tsx` (2679 bytes)
   - List view only
   - **Coverage**: 20%

2. ⚠️ `/admin/students-batches` - Admin placeholder

**Missing Screens**:
- [ ] `/academics/batches/new` - Create batch
- [ ] `/academics/batches/:id` - Batch detail
- [ ] `/academics/batches/:id/edit` - Edit batch
- [ ] `/academics/batches/:id/students` - Student list for batch

**API**: `GET/POST /api/academics/batches/`

#### Groups (20% Coverage)
**Frontend Pages**: 1 page

1. ✅ `/academics/groups` - `GroupsPage.tsx` (2373 bytes)
   - List view only
   - **Coverage**: 20%

**Missing Screens**:
- [ ] `/academics/groups/new` - Create group
- [ ] `/academics/groups/:id` - Group detail
- [ ] `/academics/groups/:id/edit` - Edit group
- [ ] `/academics/groups/:id/students` - Student list for group

**API**: `GET/POST /api/academics/groups/`

#### Academic Periods (20% Coverage)
**Frontend Pages**: 1 page

1. ✅ `/academics/academic-periods` - `AcademicPeriodsPage.tsx` (2867 bytes)
   - List view with hierarchy
   - **Coverage**: 20%

**Missing Screens**:
- [ ] `/academics/academic-periods/new` - Create period
- [ ] `/academics/academic-periods/:id` - Period detail
- [ ] `/academics/academic-periods/:id/edit` - Edit period

**API**: `GET/POST /api/academics/academic-periods/`

#### Departments (40% Coverage)
**Frontend Pages**: 2 pages

1. ✅ `/academics/departments` - `DepartmentsPage.tsx` (4788 bytes)
   - Full list with hierarchy tree view
   - **Coverage**: 60%

2. ⚠️ `/admin/faculty-departments` - Admin placeholder (218 bytes)

**Missing Screens**:
- [ ] `/academics/departments/new` - Create department
- [ ] `/academics/departments/:id` - Department detail
- [ ] `/academics/departments/:id/edit` - Edit department

**API**: `GET/POST /api/academics/departments/`

#### New Academic Models (0% Coverage)
**Backend Resources**: Period, Track, LearningBlock, Module  
**Frontend Pages**: ❌ NONE

**Missing Screens**:
- [ ] `/academics/periods` - List periods
- [ ] `/academics/periods/new` - Create period
- [ ] `/academics/tracks` - List tracks
- [ ] `/academics/tracks/new` - Create track
- [ ] `/academics/blocks` - List learning blocks
- [ ] `/academics/blocks/new` - Create integrated/rotation block
- [ ] `/academics/modules` - List modules
- [ ] `/academics/modules/new` - Create module

**API Endpoints Available**:
- `GET/POST /api/academics/periods/`
- `GET/POST /api/academics/tracks/`
- `GET/POST /api/academics/blocks/`
- `GET/POST /api/academics/modules/`

**Priority**: **MEDIUM** - New models need UI for structure management

#### Courses & Sections (0% Coverage)
**Backend Resources**: Course, Section  
**Frontend Pages**: ❌ NONE

**Missing Screens**:
- [ ] `/academics/courses` - List courses
- [ ] `/academics/courses/new` - Create course
- [ ] `/academics/courses/:id` - Course detail
- [ ] `/academics/sections` - List sections
- [ ] `/academics/sections/new` - Create section

**API**: `GET/POST /api/academics/courses/`, `/api/academics/sections/`

**Priority**: **HIGH** - Courses needed for timetable and attendance

---

### Attendance Module (60% Coverage)
**Frontend Pages**: 3 pages

1. ✅ `/attendance/dashboard` - `AttendanceDashboard.tsx` (8409 bytes)
   - Overview with stats
   - Recent attendance
   - **Coverage**: 80%

2. ✅ `/attendance/input` - `AttendanceInputPage.tsx` (14778 bytes)
   - Multiple input methods (Live, CSV, Sheet, Biometric)
   - Dry-run validation
   - **Coverage**: 100%

3. ✅ `/attendance/eligibility` - `EligibilityReport.tsx` (8506 bytes)
   - Eligibility calculation
   - Detailed reports
   - **Coverage**: 80%

4. ⚠️ `/admin/attendance-overview` - Admin placeholder (267 bytes)
5. ⚠️ `/admin/attendance-input` - Admin placeholder (254 bytes)
6. ⚠️ `/admin/attendance-report` - Admin placeholder (273 bytes)

**Missing Screens**:
- [ ] `/attendance` - List all attendance records
- [ ] `/attendance/:id` - Single attendance record detail
- [ ] `/attendance/reports` - Advanced reporting

**Status**: ✅ **GOOD** - Core attendance functionality present

---

### Timetable Module (0% Coverage)
**Backend Resources**: Session  
**Frontend Pages**: ❌ NONE

**Missing Screens**:
- [ ] `/timetable` - Timetable grid view (weekly/daily)
- [ ] `/timetable/sessions` - List all sessions
- [ ] `/timetable/sessions/new` - Create session
- [ ] `/timetable/sessions/:id` - Session detail
- [ ] `/timetable/sessions/:id/edit` - Edit session

**API**: `GET/POST /api/timetable/sessions/`

**Priority**: **HIGH** - Timetable needed for attendance and teaching

---

### Exams Module (20% Coverage)
**Frontend Pages**: 1 page

1. ✅ `/exams` - `ExamsPage.tsx` (2645 bytes)
   - List view only
   - **Coverage**: 20%

**Missing Screens**:
- [ ] `/exams/new` - Create exam
- [ ] `/exams/:id` - Exam detail with components
- [ ] `/exams/:id/edit` - Edit exam
- [ ] `/exams/:id/components` - Manage exam components

**API**: `GET/POST /api/exams/`, `/api/exam-components/`

**Priority**: **MEDIUM** - Exam management UI needed

---

### Results Module (80% Coverage)
**Frontend Pages**: 7 pages

1. ✅ `/results` - `ResultsPage.tsx` (2887 bytes)
   - List/filter results
   - **Coverage**: 60%

2. ✅ `/gradebook` - `Gradebook.tsx` (10566 bytes)
   - Full gradebook interface
   - Component entry
   - Publish workflow
   - **Coverage**: 100%

3. ✅ `/examcell/publish-results` - `PublishResults.tsx` (9606 bytes)
   - Results approval and publishing
   - **Coverage**: 100%

4. ⚠️ `/admin/results-overview` - Admin placeholder (246 bytes)
5. ⚠️ `/admin/results-grade` - Admin placeholder (232 bytes)
6. ⚠️ `/admin/results-batch-wise` - Admin placeholder (243 bytes)
7. ⚠️ `/admin/results-academic-period` - Admin placeholder (269 bytes)
8. ⚠️ `/admin/results-assessment-report` - Admin placeholder (299 bytes)

**Status**: ✅ **GOOD** - Core functionality present

---

### Finance Module (80% Coverage)
**Frontend Pages**: 11 pages

1. ✅ `/finance/dashboard` - `FinanceDashboard.tsx` (2771 bytes)
   - Financial overview
   - **Coverage**: 80%

2. ✅ `/finance/vouchers` - `VouchersPage.tsx` (5310 bytes)
   - List and manage vouchers
   - **Coverage**: 80%

3. ✅ `/finance/vouchers/generate` - `VoucherGenerationPage.tsx` (1812 bytes)
   - Bulk voucher generation
   - **Coverage**: 100%

4. ✅ `/finance/payments` - `PaymentsPage.tsx` (5292 bytes)
   - Payment entry and listing
   - **Coverage**: 80%

5. ✅ `/finance/fee-plans` - `FeePlansPage.tsx` (5245 bytes)
   - Fee plan management
   - **Coverage**: 80%

6. ✅ `/finance/students` - `StudentFinancePage.tsx` (4947 bytes)
   - Student finance summaries
   - **Coverage**: 80%

7. ✅ `/finance/students/:id/statement` - `StudentStatementPage.tsx` (8442 bytes)
   - Individual student ledger
   - **Coverage**: 100%

8. ✅ `/finance/reports/defaulters` - `DefaultersReportPage.tsx` (7080 bytes)
   - Defaulters report
   - **Coverage**: 100%

9. ✅ `/finance/reports/collection` - `CollectionReportPage.tsx` (6618 bytes)
   - Collection report
   - **Coverage**: 100%

10. ✅ `/finance/reports/aging` - `AgingReportPage.tsx` (5944 bytes)
    - Aging report
    - **Coverage**: 100%

11. ⚠️ `/admin/finance-dashboard` - Admin placeholder (266 bytes)
12. ⚠️ `/admin/finance-vouchers` - Admin placeholder (240 bytes)
13. ⚠️ `/admin/finance-fee-plans` - Admin placeholder (269 bytes)
14. ⚠️ `/admin/finance-payment-report` - Admin placeholder (285 bytes)

**Status**: ✅ **EXCELLENT** - Comprehensive finance UI

---

### Audit Module (100% Coverage)
**Frontend Pages**: 1 page

1. ✅ `/admin/audit-log` - `AuditLog.tsx` (7998 bytes)
   - Full audit log viewer
   - Advanced filtering
   - **Coverage**: 100%

**Status**: ✅ **COMPLETE**

---

### Transcripts Module
**Frontend Pages**: 2 pages

1. ✅ `/transcripts` - `TranscriptsPage.tsx` (2056 bytes)
   - Transcript request/view
   - **Coverage**: 60%

2. ✅ `/verify/transcript` - `TranscriptVerify.tsx` (7179 bytes)
   - Public transcript verification
   - **Coverage**: 100%

**Status**: ✅ **GOOD**

---

### Requests Module
**Frontend Pages**: 1 page

1. ✅ `/requests` - `RequestsPage.tsx` (3230 bytes)
   - Request workflow
   - **Coverage**: 60%

---

## API Wiring Status

### Environment Configuration
**File**: `/frontend/.env` or `/frontend/.env.production`

Required variables:
```env
VITE_API_URL=http://backend:8000/api  # Production
VITE_API_URL=http://localhost:8010/api  # Development
```

**Status**: ✅ Properly configured in docker-compose.yml

### API Client Configuration
**File**: `/frontend/src/api/client.ts` or `/frontend/src/lib/axios.ts`

**Base URL**: Should use `import.meta.env.VITE_API_URL`

**Status**: ⚠️ Needs verification (requires container startup)

---

## Action Items

### Priority 1: CRITICAL (Blocking Basic Functionality)
- [ ] **People Module** - Create full CRUD UI (4 screens × 4 resources = 16 screens)
- [ ] **Students Module** - Create list, detail, edit screens (3 screens)
- [ ] **Timetable Module** - Create full timetable UI (5 screens)
- [ ] **Courses/Sections** - Create management UI (4 screens)

### Priority 2: HIGH (New Features from Models)
- [ ] **Academic Structure** - Create Period/Track/Block/Module UI (8 screens)
- [ ] **Leave Management** - Create leave period UI for students (2 screens)
- [ ] **Exams** - Complete exam management UI (3 screens)

### Priority 3: MEDIUM (Complete Existing Modules)
- [ ] **Batches** - Add create/edit/detail (3 screens)
- [ ] **Groups** - Add create/edit/detail (3 screens)
- [ ] **Departments** - Add create/edit (2 screens)
- [ ] **Academic Periods** - Add create/edit (2 screens)

### Priority 4: LOW (Polish)
- [ ] Replace admin placeholder pages with working links
- [ ] Add delete confirmations throughout
- [ ] Add batch operations where needed
- [ ] Improve error handling and loading states

---

## Summary Statistics

- **Total Backend Resources**: 36
- **Resources with Frontend**: 11 (31%)
- **Full CRUD Coverage**: 4 resources (11%)
- **Partial Coverage**: 7 resources (19%)
- **No Coverage**: 25 resources (69%)

**Required Screens to Build**: ~70+ pages for full coverage

**Estimated Effort**:
- Priority 1: 30-40 hours (Critical)
- Priority 2: 20-25 hours (High)
- Priority 3: 15-20 hours (Medium)
- Priority 4: 10-15 hours (Polish)

**Total**: 75-100 hours of frontend development needed for complete coverage
