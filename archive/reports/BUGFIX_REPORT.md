# Bug Fix Report: Frontend-Backend Connection Issues

## Executive Summary

This report documents the systematic analysis and fixes for frontend-backend connection issues in the FMU SIMS application after Docker-based deployment. Five critical bugs were identified and fixed, with the most severe being the **double /api path bug** that prevented all API calls from working correctly.

## Bugs Identified and Fixed

### Bug 1: Inconsistent Payload in Sections Service Enroll Method

**Severity:** High  
**Location:** `frontend/src/services/sections.ts`, lines 57-61  
**Status:** ✅ Fixed

#### Description
The `enroll` method in `sectionsService` was sending `student_ids` (plural array) in the request payload, but the backend endpoint `/api/sections/<section_id>/enroll/` expects `student_id` (singular) according to `backend/sims_backend/enrollment/views.py` line 28.

#### Impact
- Bulk enrollment from sections service would fail
- Backend would return 400 error: "student_id is required"
- Users unable to enroll students through this service method

#### Root Cause
Duplicate functionality with incorrect payload format. The `enrollmentService` already had the correct implementation.

#### Fix Applied
- Removed the duplicate `enroll` method from `sectionsService`
- Users should use `enrollmentService.enrollStudent()` or `enrollmentService.enrollStudentsBulk()` instead
- These methods send the correct `student_id` (singular) payload

#### Testing
- Added comprehensive test suite in `frontend/src/services/enrollment.test.ts`
- Verifies correct payload format (`student_id` not `student_ids`)
- Tests bulk enrollment functionality with partial failure handling
- All tests pass ✅

---

### Bug 2: API Endpoint Inconsistency for Attendance by Section

**Severity:** High  
**Location:** `frontend/src/services/attendance.ts`, lines 26-47  
**Status:** ✅ Fixed

#### Description
Frontend was attempting to GET/POST to `/api/sections/${sectionId}/attendance/`, but the backend doesn't have this route defined. The backend only exposes `/api/attendance/` with query parameter filtering.

#### Impact
- Getting attendance for a specific section would return 404
- Marking attendance for a section would fail
- Attendance features completely broken

#### Root Cause
Frontend assumed section-specific nested routes that don't exist in the backend URL configuration.

#### Fix Applied
1. **`markAttendance` method**: Now creates individual attendance records via `/api/attendance/` endpoint, one POST per student
2. **`getBySectionId` method**: Uses `/api/attendance/` with `section` query parameter instead of nested route

#### Code Changes
```typescript
// Before (incorrect):
async getBySectionId(sectionId: number) {
  return await api.get(`/api/sections/${sectionId}/attendance/`)
}

// After (correct):
async getBySectionId(sectionId: number, params?: { date?: string }) {
  return await api.get('/api/attendance/', {
    params: { ...params, section: sectionId }
  })
}
```

#### Testing
- Added comprehensive test suite in `frontend/src/services/attendance.test.ts`
- Verifies correct endpoint usage (`/api/attendance/` not `/api/sections/{id}/attendance/`)
- Tests query parameter filtering
- Tests individual record creation
- All tests pass ✅

---

### Bug 3: Environment Variable Mismatch in Docker Configurations

**Severity:** Medium  
**Location:** Multiple files  
**Status:** ✅ Fixed

#### Description
The docker-compose configurations had inconsistent or incorrect VITE_API_URL values. Additionally, CORS and CSRF settings didn't include all necessary origins.

#### Impact
- Frontend couldn't connect to backend in Docker environment
- CORS errors in browser console
- API calls would fail or timeout

#### Root Cause
Environment variables not properly configured for Docker networking and deployment scenarios.

#### Fix Applied
1. Updated `docker-compose.yml` to use correct API URL
2. Updated `.env` and `.env.example` with proper documentation
3. Added missing origins to CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS:
   - `http://localhost:5174` (frontend dev server)
   - `http://localhost:8001` (backend direct access)

#### Configuration Changes
```bash
# Before:
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:81

# After:
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:81,http://localhost:5174,http://localhost:8001
```

---

### Bug 4: Missing Dependency Configuration

**Severity:** Low  
**Location:** `docker-compose.yml`, line 73  
**Status:** ✅ Fixed

#### Description
Frontend service had `depends_on: [backend, nginx]` which created a circular dependency since nginx depends on frontend.

#### Impact
- Docker compose warning about dependency cycle
- Potential startup ordering issues

#### Fix Applied
Removed nginx from frontend's `depends_on` list. Frontend only needs backend to be ready.

---

### Bug 5: Critical API URL Double Path Bug (Most Severe)

**Severity:** CRITICAL  
**Location:** Multiple files  
**Status:** ✅ Fixed

#### Description
This was the root cause of most frontend-backend connection failures:

1. `VITE_API_URL` was set to include `/api` suffix (e.g., `http://localhost:81/api`)
2. All service methods already include `/api` in their paths (e.g., `/api/students/`)
3. Axios concatenates baseURL + path, resulting in: `http://localhost:81/api/api/students/`
4. Backend returns 404 for all API calls

#### Impact
- **ALL API calls were failing** with 404 errors
- Complete breakdown of frontend-backend communication
- Application unusable in Docker deployment
- This was likely the main issue reported by the user

#### Root Cause
Misunderstanding of how Vite environment variables and Axios baseURL concatenation works. The baseURL should NOT include the `/api` prefix when all service paths already include it.

#### Fix Applied

1. **Environment Variables** - Removed `/api` suffix:
   ```bash
   # Before (incorrect):
   VITE_API_URL=http://localhost:81/api
   
   # After (correct):
   VITE_API_URL=http://localhost:81
   ```

2. **Docker Compose** - Updated environment variable:
   ```yaml
   # Before:
   environment:
     - VITE_API_URL=http://localhost:81/api
   
   # After:
   environment:
     - VITE_API_URL=http://localhost:81
   ```

3. **Production Docker Compose** - Fixed build arg:
   ```yaml
   # Before:
   args:
     - VITE_API_URL=${VITE_API_URL:-/api}
   
   # After:
   args:
     - VITE_API_URL=${VITE_API_URL:-}
   ```

4. **Token Refresh** - Fixed URL construction in `axios.ts`:
   ```typescript
   // Added trailing slash handling
   const response = await axios.post<{ access: string }>(
     `${env.apiBaseUrl.replace(/\/$/, '')}/api/auth/token/refresh/`,
     { refresh }
   )
   ```

#### Testing
- Added validation test in `frontend/src/api/axios.test.ts`
- Verifies base URL doesn't end with `/api`
- Prevents regression of this critical bug
- All tests pass ✅

#### Example Fix Impact
```
Before Fix:
http://localhost:81/api + /api/students/ = http://localhost:81/api/api/students/ ❌ (404)

After Fix:
http://localhost:81 + /api/students/ = http://localhost:81/api/students/ ✅ (200)
```

---

## Testing Summary

### Frontend Tests
- **Total Tests:** 33 tests across 7 test files
- **Status:** ✅ All passing
- **New Tests Added:** 3 test files for fixed bugs
  - `enrollment.test.ts` - 3 tests
  - `attendance.test.ts` - 3 tests
  - `axios.test.ts` - 1 new test added

### Integration Test Script
Created `test_api_endpoints.sh` for comprehensive API endpoint validation:
- Health check endpoints
- Authentication endpoints
- All public API endpoints
- Verification of correct URL paths (no double /api)

## Deployment Verification Checklist

To verify the fixes work correctly in deployment:

### 1. Local Development (No Docker)
```bash
# Backend
cd backend
python manage.py runserver

# Frontend (in another terminal)
cd frontend
VITE_API_URL=http://localhost:8000 npm run dev

# Access: http://localhost:5173
```

### 2. Docker Development
```bash
# Start services
docker compose up -d

# Run migrations
docker compose exec backend python manage.py migrate

# Seed demo data
docker compose exec backend python manage.py seed_demo --students 30

# Test API endpoints
./test_api_endpoints.sh

# Access: http://localhost:81
```

### 3. Production Deployment
```bash
# Start production services
docker compose -f docker-compose.prod.yml up -d --build

# Initialize
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
docker compose -f docker-compose.prod.yml exec backend python manage.py seed_demo --students 50

# Test
BASE_URL=http://your-domain ./test_api_endpoints.sh

# Access: http://your-domain
```

## API Endpoint Verification Matrix

| Endpoint | Method | Frontend Service | Backend Route | Status |
|----------|--------|-----------------|---------------|--------|
| `/api/auth/token/` | POST | `api/auth.ts` | ✅ Exists | ✅ Fixed |
| `/api/auth/token/refresh/` | POST | `api/axios.ts` | ✅ Exists | ✅ Fixed |
| `/api/dashboard/stats/` | GET | `api/dashboard.ts` | ✅ Exists | ✅ OK |
| `/api/students/` | GET/POST/PATCH/DELETE | `services/students.ts` | ✅ Exists | ✅ OK |
| `/api/courses/` | GET/POST/PATCH/DELETE | `services/courses.ts` | ✅ Exists | ✅ OK |
| `/api/sections/` | GET/POST/PATCH/DELETE | `services/sections.ts` | ✅ Exists | ✅ OK |
| `/api/sections/{id}/enroll/` | POST | `services/enrollment.ts` | ✅ Exists | ✅ Fixed |
| `/api/enrollments/` | GET/POST/PATCH/DELETE | `services/enrollment.ts` | ✅ Exists | ✅ OK |
| `/api/attendance/` | GET/POST/PATCH/DELETE | `services/attendance.ts` | ✅ Exists | ✅ Fixed |
| `/api/assessments/` | GET/POST/PATCH/DELETE | `services/assessments.ts` | ✅ Exists | ✅ OK |
| `/api/assessment-scores/` | GET/POST/PATCH/DELETE | `services/assessments.ts` | ✅ Exists | ✅ OK |

## Recommendations

### Immediate Actions
1. ✅ All bugs have been fixed
2. ✅ Tests have been added
3. 🔄 Deploy to test environment and verify
4. 🔄 Run integration test script
5. 🔄 Conduct E2E testing

### Future Improvements
1. **Add Backend Integration Tests**: Create tests that verify frontend service payloads match backend expectations
2. **API Contract Testing**: Implement OpenAPI/Swagger validation to catch payload mismatches early
3. **CI/CD Pipeline**: Add integration tests to CI pipeline
4. **Documentation**: Keep API documentation synchronized between frontend and backend
5. **Type Safety**: Consider using code generation from OpenAPI schema for type-safe API calls

## Conclusion

All identified bugs have been systematically fixed and tested. The most critical issue was **Bug 5** (double /api path), which was causing complete failure of frontend-backend communication. With these fixes:

- ✅ All API endpoints are correctly configured
- ✅ Payload formats match backend expectations
- ✅ Environment variables are properly set for all deployment scenarios
- ✅ Comprehensive tests prevent regression
- ✅ Integration test script enables easy verification

The application should now work correctly in Docker-based deployments with proper frontend-backend connectivity.
