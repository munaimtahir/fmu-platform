# System Baseline - Ground Truth

**Generated:** 2026-01-03  
**Repository:** fmu-platform  
**Commit:** 59838bb517389546a64d7e13d3da0429c56cb35d

## Stack Overview

### Backend
- **Framework:** Django 5.1.4
- **API Framework:** Django REST Framework (DRF)
- **Database:** PostgreSQL (production), SQLite (development)
- **Authentication:** JWT via `djangorestframework-simplejwt`
- **Token Lifetime:** 60 minutes (access), 1440 minutes (refresh)
- **Token Rotation:** Enabled (ROTATE_REFRESH_TOKENS=True)
- **API Schema:** drf-spectacular (OpenAPI/Swagger)

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **State Management:** Zustand (auth), TanStack Query (data fetching)
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS

## Authentication Mechanism

### Backend Auth Endpoints
- **Login:** `POST /api/auth/login/` (UnifiedLoginView)
- **Logout:** `POST /api/auth/logout/` (LogoutView)
- **Refresh:** `POST /api/auth/refresh/` (TokenRefreshView)
- **Me:** `GET /api/auth/me/` (MeView - returns user info with role)

### Frontend Auth Implementation
- **Base URL Configuration:** `env.apiBaseUrl` from `VITE_API_URL` environment variable
  - Default: `http://localhost:8000` (development)
  - Production: `/` (relative path)
- **Token Storage:** localStorage (`access_token`, `refresh_token`)
- **Token Injection:** Axios request interceptor adds `Authorization: Bearer <token>` header
- **Token Refresh:** Automatic on 401 responses via response interceptor
- **Auth State:** Managed via Zustand store (`authStore.ts`)

## API Base URL Expectations

### Frontend Expectation
- **Environment Variable:** `VITE_API_URL`
- **Default (dev):** `http://localhost:8000`
- **Production:** `/` (relative to frontend domain)
- **Important:** Base URL should NOT include `/api` suffix (service calls include `/api/` prefix)

### Backend API Routes
- **Base Path:** `/api/`
- **Pattern:** All DRF ViewSets register under `/api/<resource>/`
- **URL Structure:**
  - Auth: `/api/auth/...`
  - Students: `/api/students/...`
  - Academics: `/api/academics/...`
  - Attendance: `/api/attendance/...`
  - Finance: `/api/finance/...`
  - Results: `/api/results/...`
  - Exams: `/api/exams/...`
  - Timetable: `/api/timetable/...`

## Role-Based Access Control (RBAC)

### Available Roles
1. **Admin** - Full system access
2. **Registrar** - Student records, enrollment, academic management
3. **Faculty** - Course management, attendance, gradebook, assessments
4. **Student** - View own records, attendance, results, finance
5. **ExamCell** - Exam management, result publishing
6. **Finance** - Financial operations, vouchers, payments, reports
7. **Coordinator** - Academic coordination (admin-like access)
8. **Office_Assistant** - Administrative support

### Role Assignment
- **Backend:** Django Groups (`django.contrib.auth.models.Group`)
- **Groups:** Roles stored as group names (e.g., "Admin", "Faculty", "Student")
- **User Roles:** Derived from group membership via `UserSerializer.get_role()`
- **Priority Order:** Admin > Registrar > Finance > ExamCell > Faculty > Student
- **Superuser:** Always returns "Admin" role

### Permission Enforcement
- **Default Permission:** `IsAuthenticated` (all endpoints require auth)
- **Custom Permissions:** `sims_backend.common_permissions` module
  - `IsAdmin`
  - `in_group(user, group_name)` helper function
- **Frontend Guards:** `ProtectedRoute` component with `allowedRoles` prop

## Expected Role-Based Access Rules

### Student Portal (`/dashboard/student`)
- **Allowed Roles:** `['Student']`
- **Access:** View own attendance, results, gradebook, finance statements
- **Restrictions:** Cannot access admin, faculty, or registrar pages

### Faculty Portal (`/dashboard/faculty`)
- **Allowed Roles:** `['Faculty']`
- **Access:** View/input attendance, manage gradebook, view courses/sections, create assessments
- **Restrictions:** Cannot access student finance, admin panels, or registrar functions

### Admin Portal (`/dashboard/admin`)
- **Allowed Roles:** `['Admin']`
- **Access:** Full system access, user management, audit logs, student import
- **No Restrictions:** Can access all features

### Registrar Portal (`/dashboard/registrar`)
- **Allowed Roles:** `['Registrar']`
- **Access:** Student management, enrollment, academic periods, batches, programs
- **Restrictions:** Cannot access finance operations or exam cell functions

### Exam Cell Portal (`/dashboard/examcell`)
- **Allowed Roles:** `['ExamCell']`
- **Access:** Exam management, result publishing, view results
- **Restrictions:** Cannot access student management or finance

### Finance Portal (`/finance`)
- **Allowed Roles:** `['Admin', 'Finance']`
- **Access:** Fee plans, vouchers, payments, finance reports, student statements
- **Restrictions:** Cannot access academic or exam management

## Frontend Base URL Configuration

### Development
- **Frontend Dev Server:** `http://localhost:5173` (Vite default)
- **API Proxy:** `/api` → `http://localhost:8000` (configured in vite.config.ts)
- **Backend:** `http://localhost:8000`

### Production (Docker)
- **Frontend Container:** Port 8080 (nginx)
- **Backend Container:** Port 8010 (internal), exposed on 127.0.0.1:8010
- **Frontend Build:** Static files served via nginx
- **API URL:** Should be configured via `VITE_API_URL` build-time variable

## Key Business Rules (To Verify)

1. **Enrollment Uniqueness:** One student can only be enrolled once per section
2. **Attendance Uniqueness:** One attendance record per student per session (unique_together constraint)
3. **Result Publish/Freeze:** Results must be in DRAFT before PUBLISHED, published results are immutable
4. **Audit Logging:** All write operations should be logged via audit middleware
5. **Student-Faculty Relationship:** Faculty can only view/manage students in their assigned courses/sections
6. **Financial Immutability:** Vouchers and payments should be immutable after creation (voided, not deleted)

## Next Steps

This baseline document establishes the ground truth. All verification documents should reference these expectations.

- **Backend Verification:** Check models, migrations, API endpoints match these patterns
- **Frontend Verification:** Verify routes, API calls, and auth wiring match these expectations
- **Runtime Verification:** Test role-based access and API connectivity