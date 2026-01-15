# Frontend API Wiring Report

**Generated:** 2026-01-03  
**Repository:** fmu-platform  
**Commit:** 59838bb517389546a64d7e13d3da0429c56cb35d

## Executive Summary

This report verifies the frontend implementation, auditing routes, API service wiring, error handling, and authentication integration.

**Overall Status:** ✅ **VERIFIED** with significant findings

---

## 1. Routing Verification

### 1.1 Student Portal Routes

| Route | Component | Protected Route | Allowed Roles | Status |
|-------|-----------|----------------|---------------|--------|
| `/dashboard/student` | `StudentDashboard` | ✅ Yes | `['Student']` | ✅ PASS |
| `/gradebook` | `Gradebook` | ✅ Yes | `['Faculty', 'Student', 'Admin']` | ✅ PASS |
| `/finance/me` | `StudentFinancePage` | ✅ Yes | `['Student']` | ✅ PASS |
| `/finance/reports/statement` | `StudentStatementPage` | ✅ Yes | `['Admin', 'Finance', 'Student']` | ✅ PASS |
| `/results` | `ResultsPage` | ✅ Yes | `['Admin', 'Faculty', 'Student', 'ExamCell']` | ✅ PASS |

### 1.2 Faculty Portal Routes

| Route | Component | Protected Route | Allowed Roles | Status |
|-------|-----------|----------------|---------------|--------|
| `/dashboard/faculty` | `FacultyDashboard` | ✅ Yes | `['Faculty']` | ✅ PASS |
| `/attendance` | `AttendanceDashboard` | ✅ Yes | `['Faculty', 'Admin']` | ✅ PASS |
| `/attendance/input` | `AttendanceInputPage` | ✅ Yes | `['Faculty', 'Admin']` | ✅ PASS |
| `/attendance/bulk` | `BulkAttendancePage` | ✅ Yes | `['Faculty', 'Admin']` | ✅ PASS |
| `/gradebook` | `Gradebook` | ✅ Yes | `['Faculty', 'Student', 'Admin']` | ✅ PASS |
| `/assessments` | `AssessmentsPage` | ✅ Yes | `['Admin', 'Faculty']` | ✅ PASS |
| `/courses` | `CoursesPage` | ✅ Yes | `['Admin', 'Registrar', 'Faculty']` | ✅ PASS |
| `/sections` | `SectionsPage` | ✅ Yes | `['Admin', 'Registrar', 'Faculty']` | ✅ PASS |

### 1.3 Route Protection

- ✅ All routes use `ProtectedRoute` component
- ✅ Role-based access enforced via `allowedRoles` prop
- ✅ Unauthenticated users redirected to `/login`
- ✅ Unauthorized users shown `UnauthorizedPage`
- ✅ Loading states displayed during auth initialization

**Status:** ✅ **VERIFIED**

---

## 2. API Service Wiring

### 2.1 Base URL Configuration

**Configuration:**
- ✅ Base URL: `env.apiBaseUrl` (from `VITE_API_URL`)
- ✅ Default dev: `http://localhost:8000`
- ✅ Production: `/` (relative)
- ✅ **No `/api/api/` bugs found** - All service calls use `/api/...` paths correctly

**Axios Instance:**
- ✅ Base URL does NOT include `/api` suffix (correct)
- ✅ All service methods include `/api/` in paths (correct)
- ✅ Token injection via request interceptor (`Authorization: Bearer <token>`)

### 2.2 Service → Backend Endpoint Mapping

| Frontend Service | Backend Endpoint | Status | Notes |
|-----------------|------------------|--------|-------|
| `studentsService.getAll()` | `GET /api/students/` | ✅ PASS | Correct |
| `studentsService.getById(id)` | `GET /api/students/{id}/` | ✅ PASS | Correct |
| `studentsService.create(data)` | `POST /api/students/` | ✅ PASS | Correct |
| `studentsService.update(id, data)` | `PATCH /api/students/{id}/` | ✅ PASS | Correct |
| `attendanceService.getAll()` | `GET /api/attendance/` | ✅ PASS | Correct |
| `attendanceService.markAttendance()` | `POST /api/attendance/` | ✅ PASS | Creates individual records |
| `attendanceInputService.getRoster(sessionId)` | `GET /api/attendance-input/live/roster/` | ✅ PASS | Correct |
| `attendanceInputService.submitLive()` | `POST /api/attendance-input/live/submit/` | ✅ PASS | Correct |
| `resultsService.getAll()` | `GET /api/results/` | ✅ PASS | Correct |
| `resultsService.getById(id)` | `GET /api/results/{id}/` | ✅ PASS | Correct |
| `financeService.getFeePlans()` | `GET /api/finance/fee-plans/` | ✅ PASS | Correct |
| `financeService.listVouchers()` | `GET /api/finance/vouchers/` | ✅ PASS | Correct |
| `financeService.listPayments()` | `GET /api/finance/payments/` | ✅ PASS | Correct |
| `financeService.getStudentSummary(id)` | `GET /api/finance/students/{id}/` | ✅ PASS | Correct |
| `sessionsService.getAll()` | `GET /api/timetable/sessions/` | ✅ PASS | Correct |
| `sectionsService.getAll()` | `GET /api/sections/` | ✅ PASS | Correct (via academics) |
| `coursesService.getAll()` | `GET /api/courses/` | ✅ PASS | Correct (via academics) |
| `dashboardApi.getStats()` | `GET /api/dashboard/stats/` | ✅ PASS | Correct |

**Status:** ✅ **ALL ENDPOINTS CORRECTLY WIRED**

### 2.3 Authentication Headers

**Implementation:**
- ✅ Axios request interceptor adds `Authorization: Bearer <token>` header
- ✅ Token retrieved from localStorage or memory
- ✅ Token refresh handled automatically on 401 responses
- ✅ Refresh endpoint: `/api/auth/refresh/`

**Status:** ✅ **VERIFIED**

---

## 3. Page → Component → API Service → Backend Mapping

### 3.1 Student Portal Pages

#### StudentDashboard (`/dashboard/student`)
- **Component:** `StudentDashboard.tsx`
- **API Calls:** ⚠️ **NONE - Uses hardcoded data**
- **Backend Endpoint:** N/A
- **Status:** ⚠️ **FAKE DATA - No API integration**

**Finding:** StudentDashboard displays hardcoded statistics (GPA: 3.75, Enrolled Courses: 6, etc.) and hardcoded course list. No API calls are made to fetch actual student data.

#### Gradebook (`/gradebook`)
- **Component:** `Gradebook.tsx`
- **API Calls:** ✅ `GET /api/sections/`, `GET /api/assessments/`, `GET /api/assessment-scores/`
- **Service:** Direct `api.get()` calls (not via service)
- **Backend Endpoints:** ✅ Correct
- **Status:** ✅ **VERIFIED**

#### StudentFinancePage (`/finance/me`)
- **Component:** `StudentFinancePage.tsx`
- **API Calls:** ✅ `financeService.getStudentSummary()`, `financeService.getAcademicPeriods()`
- **Backend Endpoints:** ✅ `GET /api/finance/students/{id}/`, `GET /api/academics/academic-periods/`
- **Status:** ✅ **VERIFIED**

#### ResultsPage (`/results`)
- **Component:** `ResultsPage.tsx`
- **API Calls:** ✅ `resultsService.getAll()` via `useQuery`
- **Backend Endpoint:** ✅ `GET /api/results/`
- **Status:** ✅ **VERIFIED**

### 3.2 Faculty Portal Pages

#### FacultyDashboard (`/dashboard/faculty`)
- **Component:** `FacultyDashboard.tsx`
- **API Calls:** ⚠️ **NONE - Uses hardcoded data**
- **Backend Endpoint:** N/A
- **Status:** ⚠️ **FAKE DATA - No API integration**

**Finding:** FacultyDashboard displays hardcoded statistics (My Courses: 5, Total Students: 156, etc.) and hardcoded course list. No API calls are made to fetch actual faculty data.

#### AttendanceDashboard (`/attendance`)
- **Component:** `AttendanceDashboard.tsx`
- **API Calls:** ✅ `GET /api/sections/`, `GET /api/attendance/`, `GET /api/attendance/section-summary/`
- **Backend Endpoints:** ✅ Correct
- **Status:** ✅ **VERIFIED**

#### AttendanceInputPage (`/attendance/input`)
- **Component:** `AttendanceInputPage.tsx`
- **API Calls:** ✅ `sessionsService.getAll()`, `attendanceInputService.getRoster()`, `attendanceInputService.submitLive()`, etc.
- **Backend Endpoints:** ✅ Correct
- **Status:** ✅ **VERIFIED**

#### AssessmentsPage (`/assessments`)
- **Component:** `AssessmentsPage.tsx`
- **API Calls:** ✅ `assessmentsService.getAll()` via service
- **Backend Endpoint:** ✅ `GET /api/assessments/`
- **Status:** ✅ **VERIFIED**

### 3.3 Admin Portal Pages

#### AdminDashboard (`/dashboard/admin`)
- **Component:** `AdminDashboard.tsx`
- **API Calls:** ✅ `dashboardApi.getStats()` via `useEffect`
- **Backend Endpoint:** ✅ `GET /api/dashboard/stats/`
- **Status:** ✅ **VERIFIED**

#### StudentsPage (`/students`)
- **Component:** `StudentsPage.tsx`
- **API Calls:** ✅ `studentsService.getAll()` via service
- **Backend Endpoint:** ✅ `GET /api/students/`
- **Status:** ✅ **VERIFIED**

---

## 4. Error Handling & Loading States

### 4.1 Error Handling Patterns

**Axios Interceptor:**
- ✅ Automatic token refresh on 401 errors
- ✅ Logout on refresh failure
- ✅ Errors properly propagated to components

**Component-Level Error Handling:**

| Component | Error Handling | Status |
|-----------|---------------|--------|
| `AdminDashboard` | ✅ try/catch, error state, error display | ✅ PASS |
| `AttendanceInputPage` | ✅ try/catch, toast.error() | ✅ PASS |
| `AttendanceDashboard` | ✅ try/catch, error state | ✅ PASS |
| `Gradebook` | ✅ try/catch, error state | ✅ PASS |
| `StudentDashboard` | ⚠️ N/A (no API calls) | ⚠️ N/A |
| `FacultyDashboard` | ⚠️ N/A (no API calls) | ⚠️ N/A |
| `StudentsPage` | ✅ useQuery error handling | ✅ PASS |
| `ResultsPage` | ✅ useQuery error handling | ✅ PASS |
| `FinancePages` | ✅ try/catch, error state, toast | ✅ PASS |

**Error Display Components:**
- ✅ `ErrorState` component exists for consistent error display
- ✅ Toast notifications used for transient errors
- ✅ Alert components for persistent errors

### 4.2 Loading States

| Component | Loading State | Status |
|-----------|--------------|--------|
| `AdminDashboard` | ✅ loading state, spinner display | ✅ PASS |
| `AttendanceInputPage` | ✅ loading state management | ✅ PASS |
| `AttendanceDashboard` | ✅ loading state | ✅ PASS |
| `Gradebook` | ✅ loading state | ✅ PASS |
| `StudentDashboard` | ⚠️ N/A (no API calls) | ⚠️ N/A |
| `FacultyDashboard` | ⚠️ N/A (no API calls) | ⚠️ N/A |
| `StudentsPage` | ✅ useQuery isLoading | ✅ PASS |
| `ResultsPage` | ✅ useQuery isLoading | ✅ PASS |

**Loading Components:**
- ✅ `Spinner` component exists
- ✅ `LoadingState` component exists
- ✅ Skeleton loaders available

### 4.3 Empty States

- ✅ `EmptyState` component exists
- ✅ Used in DataTable and list views
- ✅ Consistent empty state messaging

**Status:** ✅ **VERIFIED** (except dashboards with hardcoded data)

---

## 5. Critical Findings

### 🔴 Blocking Issues

**None identified for deployment safety.** However, dashboards with hardcoded data should be addressed.

### ⚠️ Non-Blocking Issues

#### 1. StudentDashboard Uses Hardcoded Data ⚠️ **HIGH PRIORITY**

**Location:** `frontend/src/pages/dashboards/StudentDashboard.tsx`

**Issue:**
- Dashboard displays hardcoded statistics (GPA: 3.75, Enrolled Courses: 6, Attendance: 92%)
- Hardcoded course list with fake data
- No API calls to fetch actual student data

**Impact:** Medium - Students will see incorrect/fake data on their dashboard

**Recommendation:** 
- Integrate with `/api/dashboard/stats/` endpoint (role-specific stats)
- Fetch student's actual courses, attendance, and results
- Replace hardcoded data with real API calls

**Status:** ⚠️ **VERIFIED WITH FINDING**

#### 2. FacultyDashboard Uses Hardcoded Data ⚠️ **HIGH PRIORITY**

**Location:** `frontend/src/pages/dashboards/FacultyDashboard.tsx`

**Issue:**
- Dashboard displays hardcoded statistics (My Courses: 5, Total Students: 156, etc.)
- Hardcoded course list with fake data
- No API calls to fetch actual faculty data

**Impact:** Medium - Faculty will see incorrect/fake data on their dashboard

**Recommendation:**
- Integrate with `/api/dashboard/stats/` endpoint (role-specific stats)
- Fetch faculty's actual courses, students, and pending grades
- Replace hardcoded data with real API calls

**Status:** ⚠️ **VERIFIED WITH FINDING**

#### 3. Some Pages Use Direct API Calls Instead of Services ⚠️ **LOW PRIORITY**

**Location:** Multiple pages (e.g., `AttendanceDashboard.tsx`, `Gradebook.tsx`)

**Issue:**
- Some pages call `api.get()` directly instead of using service functions
- Inconsistent pattern (some use services, some use direct calls)

**Impact:** Low - Functional but inconsistent architecture

**Recommendation:**
- Standardize on service layer pattern
- Move direct API calls to service functions
- Improves maintainability and testability

**Status:** ⚠️ **VERIFIED WITH FINDING** (non-blocking)

---

## 6. Summary

### ✅ Passed Verifications

- ✅ All routes exist and are properly protected
- ✅ Role-based access control enforced
- ✅ API base URL configuration correct (no `/api/api/` bugs)
- ✅ Authentication headers properly attached
- ✅ Token refresh mechanism works
- ✅ Most pages have error handling
- ✅ Most pages have loading states
- ✅ Empty states implemented
- ✅ API service → backend endpoint mapping correct
- ✅ AdminDashboard properly integrated with API

### ⚠️ Findings

- ⚠️ StudentDashboard uses hardcoded data (no API integration)
- ⚠️ FacultyDashboard uses hardcoded data (no API integration)
- ⚠️ Some pages use direct API calls instead of services (architectural inconsistency)

### ✅ Overall Assessment

**Frontend is VERIFIED but has significant gaps in Student and Faculty dashboards.**

**Recommendation:** 
- **Blocking:** None - System is safe to deploy for testing
- **Before Production:** Integrate StudentDashboard and FacultyDashboard with real API data
- **Non-blocking:** Standardize API call patterns (services vs direct calls)

**The core functionality (attendance, gradebook, finance, results, etc.) is properly wired and functional. The dashboard pages are placeholders that need real data integration.**