# Frontend Regression Checklist

**Last Updated:** 2026-01-03  
**Purpose:** Checklist for frontend regression protection. Protects wiring, not visuals.

---

## 1. Router Tests

### 1.1 Student Routes ✅
**Requirement:** Student routes must render correctly

**Routes to Test:**
- ✅ `/dashboard/student` - Student dashboard
- ✅ `/gradebook` - Gradebook (student view)
- ✅ `/results` - Results (student view)
- ✅ `/finance/me` - Student finance page
- ✅ `/attendance` - Attendance (student view - own records only)

**Test Status:** 
- Existing tests in `frontend/src/features/auth/ProtectedRoute.test.tsx`
- Need to add route rendering tests

**Action Items:**
- [ ] Add route rendering tests for student routes
- [ ] Verify routes redirect to login if not authenticated
- [ ] Verify routes show 403 if wrong role

---

### 1.2 Faculty Routes ✅
**Requirement:** Faculty routes must render correctly

**Routes to Test:**
- ✅ `/dashboard/faculty` - Faculty dashboard
- ✅ `/attendance` - Attendance input (faculty view)
- ✅ `/sections` - Sections (assigned only)
- ✅ `/gradebook` - Gradebook (faculty view)
- ✅ `/assessments` - Assessments

**Test Status:**
- Existing ProtectedRoute tests cover basic access
- Need route-specific rendering tests

**Action Items:**
- [ ] Add route rendering tests for faculty routes
- [ ] Verify faculty cannot access student-only routes
- [ ] Verify faculty cannot access admin routes

---

## 2. API Integration Tests

### 2.1 Frontend Service → Backend Endpoint Alignment ✅

**Critical Services to Test:**

#### Auth Service
- ✅ `POST /api/auth/login/` - Login endpoint
- ✅ `POST /api/auth/logout/` - Logout endpoint
- ✅ `POST /api/auth/refresh/` - Token refresh
- ✅ `GET /api/auth/me/` - Current user

**Test:** Verify service calls match backend endpoints

#### Student Services
- ✅ `GET /api/attendance/` - Student's own attendance
- ✅ `GET /api/results/` - Student's own published results
- ✅ `GET /api/finance/students/{id}/` - Student's own finance

**Test:** Verify endpoints are correct and return expected data shape

#### Faculty Services
- ✅ `GET /api/sections/` - Assigned sections only
- ✅ `GET /api/attendance/` - Attendance for assigned sections
- ✅ `POST /api/attendance/sessions/{id}/mark/` - Mark attendance

**Test:** Verify endpoints filter by faculty assignment

**Test Status:**
- Some integration tests exist in `frontend/src/services/attendance.test.ts`
- Need comprehensive service → endpoint alignment tests

**Action Items:**
- [ ] Add tests for all service methods
- [ ] Verify no hardcoded fake data
- [ ] Verify API base URL configuration

---

### 2.2 No Hardcoded Fake Data ✅

**Requirement:** All API calls must hit real backend endpoints, not mock data

**Files to Check:**
- `frontend/src/services/*.ts` - All service files
- `frontend/src/pages/**/*.tsx` - All page components
- `frontend/src/features/**/*.tsx` - All feature components

**Known Issues:**
- ⚠️ `StudentDashboard.tsx` may use hardcoded data (per FRONTEND_API_WIRING_REPORT.md)

**Action Items:**
- [ ] Audit all service files for hardcoded data
- [ ] Replace hardcoded data with API calls
- [ ] Add tests to prevent hardcoded data in future

---

### 2.3 API Base URL Configuration ✅

**Requirement:** 
- `VITE_API_URL` must NOT include `/api` suffix
- Base URL should be `/` (relative) or `http://localhost:8000` (dev)
- All service calls include `/api/` prefix

**Configuration:**
```typescript
// frontend/src/api/axios.ts
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

**Test:** Verify no `/api/api/` URLs in network requests

**Status:** ✅ Fixed (per API_DOUBLE_SLASH_FIX.md)

**Action Items:**
- [ ] Add build-time check for `/api/api/` in URLs
- [ ] Add runtime check in axios interceptor

---

## 3. Build-Time Failures

### 3.1 Undefined Environment Variables ✅

**Requirement:** Build must fail if required env vars are missing

**Required Variables:**
- `VITE_API_URL` - API base URL (optional, has default)

**Current Status:**
- ⚠️ Build does not fail if `VITE_API_URL` is undefined (uses default)

**Action Items:**
- [ ] Add build-time validation for required env vars
- [ ] Fail build if critical vars missing

**Implementation:**
```typescript
// vite.config.ts or build script
if (!process.env.VITE_API_URL && process.env.NODE_ENV === 'production') {
  throw new Error('VITE_API_URL is required in production')
}
```

---

### 3.2 Missing API Base URL ✅

**Requirement:** API base URL must be defined in production

**Test:** Build should fail if `VITE_API_URL` is missing in production

**Action Items:**
- [ ] Add build validation
- [ ] Document required env vars

---

### 3.3 Broken Imports ✅

**Requirement:** TypeScript compilation must catch broken imports

**Current Status:**
- ✅ TypeScript strict mode enabled
- ✅ `npm run build` includes type checking

**Test:** 
```bash
npm run type-check  # Should fail on broken imports
npm run build       # Should fail on broken imports
```

**Action Items:**
- [x] Verify type-check runs in CI
- [x] Verify build fails on type errors

---

## 4. Runtime Checks

### 4.1 API Response Validation ✅

**Requirement:** Frontend should validate API response shapes

**Implementation:**
- Use TypeScript types for API responses
- Use Zod schemas for runtime validation (if implemented)

**Action Items:**
- [ ] Add runtime validation for critical API responses
- [ ] Log warnings if response shape doesn't match expected

---

### 4.2 Error Handling ✅

**Requirement:** All API errors must be handled gracefully

**Current Status:**
- ✅ Axios interceptors handle 401 (token refresh)
- ✅ Error boundaries catch React errors

**Action Items:**
- [ ] Verify all API calls have error handling
- [ ] Verify user-friendly error messages

---

## 5. Test Coverage

### Current Test Status

| Category | Tests | Status |
|----------|-------|--------|
| Router Tests | Partial | ⚠️ |
| API Integration | Partial | ⚠️ |
| Build-Time Checks | Partial | ⚠️ |
| Runtime Checks | Good | ✅ |

### Required Test Files

- [ ] `frontend/src/routes/__tests__/appRoutes.test.tsx` - Route rendering tests
- [ ] `frontend/src/services/__tests__/api-alignment.test.ts` - Service → endpoint alignment
- [ ] `frontend/src/api/__tests__/env-validation.test.ts` - Env var validation

---

## 6. CI Integration

### Frontend CI Checks

**Current:** `.github/workflows/frontend-ci.yml`
- ✅ Lint
- ✅ Test
- ✅ Build

**Missing:**
- ⚠️ Type check (should be explicit step)
- ⚠️ API alignment tests
- ⚠️ Env var validation

**Action Items:**
- [ ] Add explicit type-check step to CI
- [ ] Add API alignment tests to CI
- [ ] Add env var validation to CI

---

## 7. Pre-Deploy Checklist

Before deploying frontend:

- [ ] All router tests pass
- [ ] All API integration tests pass
- [ ] Build succeeds with production env vars
- [ ] No hardcoded fake data
- [ ] No `/api/api/` URLs in network requests
- [ ] TypeScript compilation succeeds
- [ ] All imports resolve correctly

---

## 8. Known Issues

### High Priority
1. **StudentDashboard hardcoded data** - Needs API integration
2. **Missing route rendering tests** - Need comprehensive route tests
3. **Missing API alignment tests** - Need service → endpoint tests

### Medium Priority
1. **Build-time env var validation** - Should fail if missing
2. **Runtime API response validation** - Should validate response shapes

### Low Priority
1. **Error message improvements** - More user-friendly errors
2. **Loading state improvements** - Better loading indicators

---

## Maintenance

### Adding New Routes

When adding new routes:

1. Add route to `appRoutes.tsx`
2. Add route policy to `navConfig.ts`
3. Add route rendering test
4. Add API integration test if route makes API calls
5. Update this checklist

### Adding New Services

When adding new services:

1. Create service file in `src/services/`
2. Add API alignment test
3. Verify no hardcoded data
4. Verify correct endpoint URLs
5. Update this checklist

---

**Status:** ⚠️ **PARTIAL COVERAGE** - Core functionality protected, but comprehensive tests needed
