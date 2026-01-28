# Frontend-Backend Mismatch Report

**Audit Date:** January 15, 2026  
**Repository:** FMU SIMS Platform  
**Purpose:** Identify frontend violations of backend API contracts

## Executive Summary

The frontend implementation shows strong alignment with backend API contracts in most areas. Authentication, token handling, and endpoint paths are correctly implemented. However, significant mismatches exist in data model field definitions, particularly for Student and Program entities.

## Critical Findings

### 🔴 HIGH PRIORITY - Data Model Field Mismatches

#### 1. Student Model Field Inconsistencies
**Location:** `frontend/src/types/models.ts:22-38`

| Frontend Field | Frontend Type | Backend Field | Backend Type | Status |
|----------------|---------------|---------------|--------------|---------|
| `batch_year` | `number` | `batch` | ForeignKey (ID) | ❌ **MISMATCH** |
| `current_year` | `number` | - | Not exists | ❌ **MISSING** |
| - | - | `batch_name` | `string` (read-only) | ❌ **MISSING** |
| - | - | `group` | ForeignKey (ID) | ❌ **MISSING** |
| - | - | `group_name` | `string` (read-only) | ❌ **MISSING** |

**Impact:** Frontend will fail to properly display student batch and group information.

#### 2. Program Model Field Inconsistencies
**Location:** `frontend/src/types/models.ts:6-19`

| Frontend Field | Frontend Type | Backend Field | Backend Type | Status |
|----------------|---------------|---------------|--------------|---------|
| `level` | `'undergraduate' \| 'postgraduate' \| 'diploma' \| 'other'` | - | Not exists | ❌ **INVALID** |
| `level_display` | `string` | - | Not exists | ❌ **INVALID** |
| `category` | `string` | - | Not exists | ❌ **INVALID** |
| `category_display` | `string` | - | Not exists | ❌ **INVALID** |
| `duration_years` | `number` | - | Not exists | ❌ **INVALID** |
| `full_name` | `string` | - | Not exists | ❌ **INVALID** |
| - | - | `structure_type` | `'YEARLY' \| 'SEMESTER' \| 'CUSTOM'` | ❌ **MISSING** |
| - | - | `is_finalized` | `boolean` | ❌ **MISSING** |
| - | - | `period_length_months` | `number \| null` | ❌ **MISSING** |
| - | - | `total_periods` | `number \| null` | ❌ **MISSING** |

**Impact:** Frontend Program components will not display correct program structure information.

## Authentication & Authorization

### ✅ CORRECT - Endpoint Paths
**Status:** All authentication endpoints correctly implemented

| Endpoint | Frontend Usage | Backend Implementation | Status |
|----------|----------------|-----------------------|---------|
| `/api/auth/login/` | ✅ Used in `api/auth.ts:54` | ✅ `UnifiedLoginView` | ✅ **CORRECT** |
| `/api/auth/logout/` | ✅ Used in `api/auth.ts:88` | ✅ `LogoutView` | ✅ **CORRECT** |
| `/api/auth/refresh/` | ✅ Used in `api/auth.ts:110` | ✅ `TokenRefreshView` | ✅ **CORRECT** |
| `/api/auth/me/` | ✅ Used in `api/auth.ts:133` | ✅ `MeView` | ✅ **CORRECT** |
| `/api/auth/change-password/` | ✅ Used in `api/auth.ts:174` | ✅ `ChangePasswordView` | ✅ **CORRECT** |

### ✅ CORRECT - Payload Shapes

#### Login Request
```typescript
// Frontend (api/auth.ts:52)
{ identifier: string, password: string }

// Backend (core/serializers.py:75-83)
{ identifier: string, password: string }
```
**Status:** ✅ **PERFECT MATCH**

#### Login Response
```typescript
// Frontend (features/auth/types.ts:34-38)
{
  user: User,
  tokens: { access: string, refresh: string }
}

// Backend (core/views.py:97-103)
{
  "user": {...},
  "tokens": {"access": "...", "refresh": "..."}
}
```
**Status:** ✅ **PERFECT MATCH**

### ✅ CORRECT - User/Role Fields

#### User Interface
**Frontend:** `features/auth/types.ts:5-13`
```typescript
interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  student_id?: number
}
```

**Backend:** `core/serializers.py:29-48`
```python
class UserSerializer(serializers.ModelSerializer):
    fields = ["id", "username", "email", "full_name", "role", "student_id", "is_active"]
```

**Status:** ✅ **PERFECT MATCH**

### ✅ CORRECT - Token Handling

#### Token Refresh Response
**Frontend:** `features/auth/types.ts:41-44`
```typescript
interface TokenRefreshResponse {
  access: string
  refresh?: string
}
```

**Backend:** `core/serializers.py:162-187`
```python
def validate(self, attrs):
    # Returns: {"access": "...", "refresh": "..." } (if rotation enabled)
```

**Status:** ✅ **CORRECT** (refresh is optional as per backend rotation settings)

## API Client Patterns

### ✅ CORRECT - Base URL Configuration
**Status:** Environment variable usage is correct

```typescript
// frontend/src/lib/env.ts:8
apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000'

// frontend/src/api/axios.ts:19
baseURL: env.apiBaseUrl.replace(/\/api\/?$/, ''),
```

**Backend Documentation:** API endpoints are prefixed with `/api/`
**Status:** ✅ **CORRECT**

### ✅ CORRECT - HTTP Client Implementation
**Status:** Axios interceptors properly handle authentication tokens

- ✅ Request interceptor adds `Authorization: Bearer ${token}`
- ✅ Response interceptor handles 401 errors with automatic token refresh
- ✅ Single-flight refresh queue prevents multiple simultaneous refresh attempts
- ✅ Token storage in localStorage with proper cleanup

## Dashboard & Core Endpoints

### ✅ CORRECT - Dashboard Stats
**Endpoint:** `/api/dashboard/stats/`
**Status:** ✅ **CORRECTLY USED** in `api/dashboard.ts:85`

**Response Shape:** Matches backend `dashboard_stats` view in `core/views.py:251-395`

## Academics Module

### ⚠️ MEDIUM PRIORITY - Academics Endpoints
**Status:** Frontend uses `/api/academics/` prefix, backend provides these endpoints

**Potential Issue:** Frontend `academicsNew.ts` uses new Academics module endpoints that may not be fully integrated:

- `/api/academics/programs/` ✅ (Backend: `ProgramViewSet`)
- `/api/academics/periods/` ✅ (Backend: `PeriodViewSet`)
- `/api/academics/tracks/` ✅ (Backend: `TrackViewSet`)
- `/api/academics/blocks/` ✅ (Backend: `LearningBlockViewSet`)
- `/api/academics/modules/` ✅ (Backend: `ModuleViewSet`)
- `/api/academics/departments/` ✅ (Backend: `DepartmentViewSet`)

**Recommendation:** Verify these endpoints are production-ready and documented in API.md

## Finance Module

### ✅ CORRECT - Finance Endpoints
**Status:** All finance endpoints correctly prefixed with `/api/finance/`

**Used Endpoints:**
- `/api/finance/fee-types/` ✅
- `/api/finance/fee-plans/` ✅
- `/api/finance/vouchers/` ✅
- `/api/finance/payments/` ✅
- `/api/finance/students/{id}/` ✅
- `/api/finance/reports/*` ✅

## Documentation Issues

### 🔴 CRITICAL - Outdated Documentation
**Location:** `frontend/README.md:162-168`

**Issue:** Login process documentation references deprecated endpoint
```markdown
3. On submit, credentials are sent to `/api/auth/token/`  # ❌ WRONG
```

**Correct:** Should reference `/api/auth/login/` with `identifier` field

## Recommendations

### Immediate Actions Required

1. **Fix Student Model Interface** (`frontend/src/types/models.ts`)
   - Replace `batch_year: number` with `batch: number` and `batch_name?: string`
   - Remove `current_year: number` (field doesn't exist in backend)
   - Add `group?: number` and `group_name?: string`

2. **Fix Program Model Interface** (`frontend/src/types/models.ts`)
   - Remove legacy fields: `level`, `level_display`, `category`, `category_display`, `duration_years`, `full_name`
   - Add backend fields: `structure_type`, `is_finalized`, `period_length_months`, `total_periods`

3. **Update Documentation**
   - Fix `frontend/README.md` to reference correct auth endpoints
   - Update API documentation to reflect current backend structure

### Testing Recommendations

1. **Data Model Tests:** Add tests to verify frontend interfaces match backend serializers
2. **API Contract Tests:** Implement contract tests that validate frontend requests against backend schemas
3. **Integration Tests:** Ensure Student/Program components work with actual API data

### Long-term Improvements

1. **Type Generation:** Consider generating TypeScript interfaces from backend OpenAPI schema
2. **API Client Codegen:** Use OpenAPI specification to generate API client code
3. **Contract Testing:** Implement automated tests that validate frontend-backend contracts

## Conclusion

The FMU SIMS frontend shows excellent compliance with backend authentication and API patterns. The primary issues are outdated data model interfaces that don't reflect current backend structure. These mismatches will cause runtime errors and incorrect data display.

**Priority:** Fix data model interfaces immediately, then update documentation.