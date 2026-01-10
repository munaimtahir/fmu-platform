# Issue: E2E Auth Login API Failure

**Task**: Task 9 (Authentication token flow), Task 56 (Auth E2E coverage)  
**Severity**: Major  
**Status**: Needs Investigation  
**Date**: 2026-01-09

## Description

The E2E authentication test "should login successfully with valid credentials" is failing due to a timeout/error when calling the login API. This causes 1 E2E test to fail and 3 other tests to skip (due to missing authentication).

## Test Results

From `docs/verification/E2E_TEST_RESULTS.md`:
- ⚠️ `should login successfully with valid credentials` - **FAILED**
- ✅ `should show error with invalid credentials` - **PASSED**
- ✅ `should redirect to login when accessing protected route` - **PASSED**
- ⏭️ `should create a new Program` - **SKIPPED** (needs auth)
- ⏭️ `should create a new student` - **SKIPPED** (needs auth)
- ⏭️ `should maintain authentication after reload` - **SKIPPED** (needs auth)

**Pass Rate**: 2/3 auth tests passing (67%)  
**Overall E2E**: 7/11 tests passing (64%)

## Evidence

From E2E test output:
```
Error: Login timeout (authentication still not completing)
Note: Admin user exists and password is set, but login API may have issues
```

## Root Cause Analysis

### What Works ✅
1. Admin user exists in database
2. Password is correctly set
3. Error handling for invalid credentials works
4. Redirect to login page works
5. Protected route guards work

### What's Broken ⚠️
1. Login API call not completing successfully
2. Test shows "Login may have failed, continuing anyway..."

### Possible Causes

1. **API Endpoint Issue**:
   - Endpoint may return 405 Method Not Allowed
   - May require specific headers (Content-Type, Accept)
   - CORS configuration issue

2. **Token Generation**:
   - JWT token not being generated
   - Token not being returned in response

3. **Response Format**:
   - Response may not match expected format
   - Token may be in different field than expected

4. **Authentication Backend**:
   - SimpleJWT configuration issue
   - Token lifetime too short
   - Secret key mismatch

## Steps to Reproduce

```bash
# 1. Start the stack
docker compose up -d

# 2. Run E2E tests
cd frontend
npx playwright test e2e/auth.spec.ts

# 3. Check test output
# Should see login test failing
```

## Expected Behavior

```javascript
// POST /api/auth/login/
{
  "identifier": "admin",
  "password": "admin123"
}

// Expected response:
{
  "access": "eyJ0eXAiOiJKV1Q...",
  "refresh": "eyJ0eXAiOiJKV1Q...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "first_name": "Admin"
  }
}
```

## Actual Behavior

Request times out or returns error (exact error needs logging)

## Debug Steps

### 1. Test Login API Directly

```bash
# Test if backend is running
curl http://127.0.0.1:8010/api/

# Test login endpoint
curl -X POST http://127.0.0.1:8010/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}' \
  -v

# Check response status and body
```

### 2. Check Backend Logs

```bash
docker compose logs backend | grep -i "login\|auth\|error" | tail -50
```

### 3. Verify User Exists

```bash
docker compose exec backend python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> admin = User.objects.get(username='admin')
>>> admin.check_password('admin123')  # Should return True
```

### 4. Check JWT Configuration

```python
# In backend/sims_backend/settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    # ... other settings
}
```

### 5. Verify URL Configuration

```python
# Check backend/sims_backend/urls.py
# Should have auth login endpoint configured
```

## Impact

- **E2E Tests**: 4 tests affected (1 failing, 3 skipped)
- **Manual Testing**: Login should work via browser (frontend handles errors gracefully)
- **Production**: May work in production if it's a test environment issue
- **Core Auth**: Basic auth system works (error handling, redirects working)

## Remediation

### Immediate Fix (If API Method Issue)

```python
# In backend auth view
@api_view(['POST'])  # Ensure POST is allowed
def login(request):
    # ...
```

### Alternative: Update E2E Test

```typescript
// If response format is different
const response = await page.request.post('/api/auth/login/', {
  data: { identifier, password },
  headers: { 'Content-Type': 'application/json' }
});

// Check response status
if (response.ok()) {
  const data = await response.json();
  // Store token from actual response structure
}
```

### Long-term Fix

1. Add better error logging to identify exact failure
2. Add backend unit tests for login endpoint
3. Add integration tests for auth flow
4. Document expected request/response format

## Files to Check

- `backend/sims_backend/urls.py` - Auth URL patterns
- `backend/core/views.py` or `backend/auth/views.py` - Login view
- `backend/sims_backend/settings.py` - JWT configuration
- `frontend/e2e/auth.spec.ts` - E2E test definition
- `frontend/src/api/` - Frontend API client

## Related Issues

- None

## Testing After Fix

```bash
# 1. Apply fix
# 2. Restart backend
docker compose restart backend

# 3. Run E2E tests
cd frontend
npx playwright test e2e/auth.spec.ts

# Expected: 3/3 auth tests passing
```

## Success Criteria

- ✅ Login test passes
- ✅ Create tests no longer skip
- ✅ Overall E2E pass rate: 10-11/11 (91-100%)

## Priority

**HIGH** - Affects 4 E2E tests and core authentication functionality

## Status

**Open** - Needs debugging and fix
