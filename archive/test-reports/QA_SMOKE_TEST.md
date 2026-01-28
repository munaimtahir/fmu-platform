# QA Smoke Test Script

**Generated:** 2026-01-03  
**Purpose:** Manual runtime smoke testing for Student Portal, Faculty Portal, and core features  
**Environment:** Local / Staging

---

## Prerequisites

- ✅ Backend server running (default: `http://localhost:8000`)
- ✅ Frontend server running (default: `http://localhost:5173`)
- ✅ Database seeded with demo data
- ✅ Browser with developer console open (F12)

---

## Test User Credentials

Use seeded demo credentials (verify these exist in your environment):

| Role | Email/Username | Password | Expected Access |
|------|---------------|----------|----------------|
| Admin | `admin@sims.edu` or `admin` | `admin123` | Full system access |
| Faculty | Faculty user from seed data | `password123` (verify) | Faculty portal, courses, attendance |
| Student | Student user from seed data | `password123` (verify) | Student portal, own data only |

**Note:** Verify actual credentials by checking seed data or database.

---

## Test Execution Checklist

### 1. Authentication Tests

#### 1.1 Login Flow
- [ ] Navigate to `/login`
- [ ] Enter valid admin credentials
- [ ] Click "Login"
- [ ] **Expected:** Redirected to `/dashboard` or role-specific dashboard
- [ ] **Check Console:** No errors in browser console
- [ ] **Check Network:** Login request returns 200, tokens received

#### 1.2 Token Storage
- [ ] Open browser DevTools → Application → Local Storage
- [ ] **Expected:** `access_token` and `refresh_token` present
- [ ] Verify tokens are valid JWT format

#### 1.3 Invalid Credentials
- [ ] Logout
- [ ] Attempt login with wrong password
- [ ] **Expected:** Error message displayed, no redirect
- [ ] **Check Console:** No JavaScript errors

#### 1.4 Token Refresh
- [ ] Logged in as any user
- [ ] Wait for token expiry OR manually clear `access_token` from localStorage
- [ ] Make any API request (e.g., navigate to Students page)
- [ ] **Expected:** Request succeeds (token automatically refreshed)
- [ ] **Check Network:** Refresh request made, new tokens received

---

### 2. Student Portal Tests

#### 2.1 Student Dashboard
- [ ] Login as Student user
- [ ] Navigate to `/dashboard/student`
- [ ] **Expected:** Student Dashboard page loads
- [ ] **Check Console:** No errors
- [ ] **Check Network:** Verify API calls (if dashboard fetches data)
- [ ] **Note:** Currently displays hardcoded data (see FRONTEND_API_WIRING_REPORT.md)

#### 2.2 Student Attendance View
- [ ] As Student, navigate to `/gradebook` or `/attendance` (if accessible)
- [ ] **Expected:** Student sees only their own attendance/gradebook data
- [ ] **Check Network:** API calls include student filter
- [ ] **Verify:** Cannot see other students' data

#### 2.3 Student Results View
- [ ] As Student, navigate to `/results`
- [ ] **Expected:** Only PUBLISHED results visible
- [ ] **Expected:** Only student's own results visible
- [ ] **Check Network:** API calls filtered by student and status=PUBLISHED
- [ ] **Verify:** DRAFT/VERIFIED results not visible

#### 2.4 Student Finance View
- [ ] As Student, navigate to `/finance/me`
- [ ] **Expected:** Student's own finance summary displayed
- [ ] **Check Network:** API calls to `/api/finance/students/{student_id}/`
- [ ] **Verify:** Cannot access admin finance pages

#### 2.5 Student Access Restrictions
- [ ] As Student, attempt to access `/students` (admin page)
- [ ] **Expected:** Redirected to Unauthorized page OR 403 error
- [ ] **Verify:** Cannot access admin/registrar/faculty-only pages

---

### 3. Faculty Portal Tests

#### 3.1 Faculty Dashboard
- [ ] Login as Faculty user
- [ ] Navigate to `/dashboard/faculty`
- [ ] **Expected:** Faculty Dashboard page loads
- [ ] **Check Console:** No errors
- [ ] **Check Network:** Verify API calls (if dashboard fetches data)
- [ ] **Note:** Currently displays hardcoded data (see FRONTEND_API_WIRING_REPORT.md)

#### 3.2 Faculty Attendance Input
- [ ] As Faculty, navigate to `/attendance/input`
- [ ] **Expected:** Attendance input page loads
- [ ] Select a session from dropdown
- [ ] Load roster
- [ ] **Expected:** Roster loads with students for that session
- [ ] Mark attendance for students (Present/Absent/Late)
- [ ] Submit attendance
- [ ] **Expected:** Success message, attendance saved
- [ ] **Check Network:** POST requests to `/api/attendance-input/live/submit/` or `/api/attendance/`
- [ ] **Check Console:** No errors

#### 3.3 Faculty Attendance Dashboard
- [ ] As Faculty, navigate to `/attendance`
- [ ] **Expected:** Attendance dashboard loads
- [ ] Select a section
- [ ] **Expected:** Attendance records for that section displayed
- [ ] **Check Network:** API calls to `/api/attendance/?section={id}`
- [ ] **Verify:** Only sees attendance for their assigned sessions

#### 3.4 Faculty Gradebook
- [ ] As Faculty, navigate to `/gradebook`
- [ ] **Expected:** Gradebook page loads
- [ ] Select a section
- [ ] **Expected:** Students and assessments displayed
- [ ] **Check Network:** API calls to `/api/assessments/`, `/api/assessment-scores/`
- [ ] **Verify:** Can view and edit grades (if functionality exists)

#### 3.5 Faculty Courses/Sections View
- [ ] As Faculty, navigate to `/courses` or `/sections`
- [ ] **Expected:** Courses/sections list loads
- [ ] **Check Network:** API calls to `/api/courses/` or `/api/sections/`
- [ ] **Verify:** Can view courses/sections assigned to them

#### 3.6 Faculty Access Restrictions
- [ ] As Faculty, attempt to access `/students` (admin page)
- [ ] **Expected:** Redirected to Unauthorized page OR 403 error
- [ ] **Verify:** Cannot access admin/student-only pages

---

### 4. Admin Portal Tests

#### 4.1 Admin Dashboard
- [ ] Login as Admin user
- [ ] Navigate to `/dashboard/admin`
- [ ] **Expected:** Admin Dashboard loads with statistics
- [ ] **Check Network:** API call to `/api/dashboard/stats/`
- [ ] **Expected:** Statistics displayed (students, programs, exams, etc.)
- [ ] **Check Console:** No errors

#### 4.2 Admin Student Management
- [ ] As Admin, navigate to `/students`
- [ ] **Expected:** Students list page loads
- [ ] **Check Network:** API call to `/api/students/`
- [ ] Verify pagination, search, filters work
- [ ] Create a new student (if functionality exists)
- [ ] **Expected:** Student created successfully
- [ ] **Check Network:** POST to `/api/students/`

#### 4.3 Admin User Management
- [ ] As Admin, navigate to `/admin/users`
- [ ] **Expected:** Users list loads
- [ ] **Check Network:** API calls to user endpoints
- [ ] Verify can view, create, edit users

#### 4.4 Admin Audit Log
- [ ] As Admin, navigate to `/admin/audit`
- [ ] **Expected:** Audit log page loads
- [ ] **Check Network:** API call to `/api/audit/`
- [ ] **Verify:** Write operations are logged (perform an action, check audit log)

---

### 5. API Endpoint Verification

#### 5.1 Health Check
- [ ] Navigate to `/health/` or `/api/health/` in browser
- [ ] **Expected:** JSON response: `{"status": "ok", "service": "SIMS Backend"}`
- [ ] **Verify:** Database and Redis status (if applicable)

#### 5.2 Core API Endpoints
Test these endpoints (via browser Network tab or Postman):

| Endpoint | Method | Expected Status | Notes |
|----------|--------|----------------|-------|
| `/api/auth/login/` | POST | 200 | Returns tokens |
| `/api/auth/me/` | GET | 200 | Returns user info |
| `/api/students/` | GET | 200 | Returns paginated students |
| `/api/attendance/` | GET | 200 | Returns attendance records |
| `/api/results/` | GET | 200 | Returns results |
| `/api/finance/vouchers/` | GET | 200 | Returns vouchers (if Finance role) |
| `/api/dashboard/stats/` | GET | 200 | Returns dashboard stats |

#### 5.3 Permission Testing
- [ ] As Student, attempt `GET /api/students/`
- [ ] **Expected:** Returns data (may be filtered)
- [ ] As Student, attempt `POST /api/students/`
- [ ] **Expected:** 403 Forbidden (if permissions enforced)

---

### 6. Error Handling Tests

#### 6.1 Network Errors
- [ ] Stop backend server
- [ ] Navigate to any page that makes API calls
- [ ] **Expected:** Error message displayed to user
- [ ] **Check Console:** Error logged but no JavaScript crashes

#### 6.2 401 Unauthorized
- [ ] Clear `access_token` from localStorage
- [ ] Navigate to any protected page
- [ ] **Expected:** Redirected to `/login` OR token refreshed automatically

#### 6.3 403 Forbidden
- [ ] As Student, attempt to access `/admin/users`
- [ ] **Expected:** Unauthorized page displayed OR 403 error

#### 6.4 404 Not Found
- [ ] Navigate to `/nonexistent-page`
- [ ] **Expected:** 404 page OR redirect to dashboard

---

### 7. Data Integrity Tests

#### 7.1 Attendance Uniqueness
- [ ] As Faculty, mark attendance for a student in a session
- [ ] Attempt to mark attendance for the same student in the same session again
- [ ] **Expected:** Existing record updated OR error if duplicate prevented
- [ ] **Verify:** Only one attendance record per student per session

#### 7.2 Enrollment Uniqueness
- [ ] As Admin/Registrar, enroll a student in a section
- [ ] Attempt to enroll the same student in the same section again
- [ ] **Expected:** Error (duplicate enrollment prevented)

#### 7.3 Result Workflow
- [ ] As Admin, create a result with status DRAFT
- [ ] Attempt to change status to PUBLISHED directly
- [ ] **Expected:** Workflow validation prevents direct DRAFT → PUBLISHED
- [ ] Change status to VERIFIED first
- [ ] Then change to PUBLISHED
- [ ] **Expected:** Workflow transitions correctly

---

### 8. Cross-Browser & Console Tests

#### 8.1 Browser Console
- [ ] Open browser console (F12)
- [ ] Navigate through all major pages
- [ ] **Expected:** No JavaScript errors
- [ ] **Expected:** No uncaught exceptions
- [ ] **Expected:** No CORS errors
- [ ] **Expected:** No 404s for missing assets

#### 8.2 Network Tab
- [ ] Open Network tab in DevTools
- [ ] Navigate through pages
- [ ] **Expected:** All API requests return 200/201 (or expected status codes)
- [ ] **Expected:** No `/api/api/` URL bugs
- [ ] **Expected:** Authorization headers present on authenticated requests

#### 8.3 CORS & Cookies
- [ ] Check Network requests
- [ ] **Expected:** CORS headers present (if applicable)
- [ ] **Expected:** Credentials included (if using cookies)

---

## Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: [ ] Local [ ] Staging [ ] Production

Test Results:
[ ] All authentication tests passed
[ ] All student portal tests passed
[ ] All faculty portal tests passed
[ ] All admin portal tests passed
[ ] All API endpoint tests passed
[ ] All error handling tests passed
[ ] All data integrity tests passed
[ ] No console errors
[ ] No network errors

Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________

Overall Status: [ ] PASS [ ] FAIL [ ] PASS WITH ISSUES
```

---

## Known Issues (Pre-Test)

Based on code verification:

1. **StudentDashboard** - Uses hardcoded data (no API integration)
2. **FacultyDashboard** - Uses hardcoded data (no API integration)
3. **Result Immutability** - PUBLISHED results can be field-updated (backend issue)

These are documented in verification reports and should be addressed but do not block deployment for testing.

---

## Success Criteria

**Minimum for Deployment:**
- ✅ All authentication flows work
- ✅ Role-based access control enforced
- ✅ Core features (attendance, results, finance) functional
- ✅ No JavaScript console errors
- ✅ No API routing bugs (`/api/api/`)
- ✅ Data integrity constraints enforced

**Before Production:**
- ✅ StudentDashboard integrated with real data
- ✅ FacultyDashboard integrated with real data
- ✅ Result immutability fully enforced
- ✅ All error cases handled gracefully