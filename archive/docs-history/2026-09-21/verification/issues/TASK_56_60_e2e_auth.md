# Issue: E2E Test Authentication Problems (Tasks 56-60)

**Task Numbers:** 56, 57, 58, 59, 60  
**Status:** ⚠️ PARTIAL  
**Severity:** Major  
**Date:** 2026-01-09

---

## Problem Description

E2E tests are partially working but authentication issues are causing test failures and skips.

**Previous Test Results:**
- Total: 11 tests
- Passing: 7 (64%)
- Skipped: 3 (27%)
- Failed: 1 (9%)

**Affected Tests:**
1. `auth.spec.ts` - Login test failing
2. `academics-crud.spec.ts` - Create test skipped (needs auth)
3. `students-crud.spec.ts` - Create test skipped (needs auth)
4. `reload-persistence.spec.ts` - Auth persistence test skipped (needs auth)

---

## Root Cause

**Primary Issue:** Login API call not completing successfully in E2E tests.

**Evidence from Previous Run:**
- Admin user exists: ✅
- Password is set: ✅
- API endpoint: `/api/auth/login/` (may be returning 405 or other error)
- Tests show "Login may have failed, continuing anyway..."

**Possible Causes:**
1. API endpoint may require different method or headers
2. CORS issues
3. Backend authentication service may need configuration
4. Token storage/retrieval issues
5. Base URL configuration mismatch

---

## Steps to Reproduce

```bash
cd frontend
npx playwright test
```

**Expected:** All 11 tests pass  
**Actual:** 7 pass, 3 skip, 1 fail

---

## Expected vs Actual

**Expected:**
- Login API returns 200 with user and tokens
- Tests can authenticate and proceed
- All E2E tests pass

**Actual:**
- Login API call times out or fails
- Tests skip due to authentication failure
- 1 test explicitly fails on login

---

## Code References

**Login Endpoint:**
- `backend/core/views.py:43-100` - UnifiedLoginView
- `backend/core/serializers.py` - UnifiedLoginSerializer
- `backend/sims_backend/urls.py:57` - `/api/auth/login/` route

**E2E Tests:**
- `frontend/e2e/auth.spec.ts` - Authentication tests
- `frontend/e2e/academics-crud.spec.ts` - Academics tests (needs auth)
- `frontend/e2e/students-crud.spec.ts` - Student tests (needs auth)
- `frontend/e2e/reload-persistence.spec.ts` - Persistence tests (needs auth)

**Playwright Config:**
- `frontend/playwright.config.ts:25` - Base URL: `http://127.0.0.1:8080`

---

## Remediation Steps

### 1. Debug Login API

```bash
# Test login API directly
curl -X POST http://127.0.0.1:8010/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}'
```

**Check:**
- Does endpoint accept POST?
- Are CORS headers present?
- What is the actual response?

### 2. Fix API Issues (if found)

- Update endpoint if method/headers are wrong
- Fix CORS configuration if needed
- Verify backend authentication service

### 3. Update E2E Tests

- Fix login helper function
- Add retry logic
- Better error messages
- Verify token storage

### 4. Re-run Tests

```bash
cd frontend
npx playwright test --reporter=list,html
```

**Expected Result:** 11/11 tests passing

---

## Test Commands

```bash
# Manual API test
curl -X POST http://127.0.0.1:8010/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}'

# E2E test (after fix)
cd frontend
npx playwright test
```

---

## Related Tasks

- Task 9: Authentication (token flow)
- Task 10: Auth guards (frontend+backend)
- Task 47: Auth-protected routing
- Task 48: Navigation guards
- Task 49: Reload persistence

---

## Notes

- Previous E2E results documented in `docs/verification/E2E_TEST_RESULTS.md`
- Authentication code appears correct, issue may be in test setup or API configuration
- Once authentication is fixed, all dependent E2E tests should pass

---

**Last Updated:** 2026-01-09
