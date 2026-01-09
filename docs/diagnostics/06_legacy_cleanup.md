# Phase 4: Legacy Module Cleanup

**Date:** 2026-01-03  
**Purpose:** Document legacy module status and cleanup actions

## Legacy Module Status

### Backend - Legacy Apps in INSTALLED_APPS

#### Currently Enabled (With Gating)
1. **sims_backend.admissions** - ✅ Kept at `/api/` (not gated) for student application form compatibility
   - **Status:** Active, not gated (required for public `/apply` form)
   - **Endpoints:** `/api/students/`, `/api/student-applications/`, `/api/application-drafts/`
   - **Notes:** Uses legacy `admissions.Student` model (different from canonical `students.Student`)

2. **sims_backend.enrollment** - ⚠️ Gated behind `ENABLE_LEGACY_MODULES`
   - **Status:** Gated, write operations blocked via middleware
   - **Endpoints:** `/api/legacy/api/enrollments/` (only when `ENABLE_LEGACY_MODULES=True`)
   - **Write Blocking:** ✅ Middleware blocks POST/PUT/PATCH/DELETE when `ALLOW_LEGACY_WRITES=False`

3. **sims_backend.assessments** - ⚠️ Gated behind `ENABLE_LEGACY_MODULES`
   - **Status:** Gated, write operations blocked via middleware
   - **Endpoints:** `/api/legacy/api/assessments/` (only when `ENABLE_LEGACY_MODULES=True`)
   - **Write Blocking:** ✅ Middleware blocks POST/PUT/PATCH/DELETE when `ALLOW_LEGACY_WRITES=False`

4. **sims_backend.requests** - ⚠️ Gated behind `ENABLE_LEGACY_MODULES`
   - **Status:** Gated, write operations blocked via middleware
   - **Endpoints:** `/api/legacy/api/requests/` (only when `ENABLE_LEGACY_MODULES=True`)
   - **Write Blocking:** ✅ Middleware blocks POST/PUT/PATCH/DELETE when `ALLOW_LEGACY_WRITES=False`

5. **sims_backend.documents** - ✅ Active (not legacy)
   - **Status:** Canonical module for document generation
   - **Endpoints:** Document generation endpoints

6. **sims_backend.notifications** - ✅ Active (not legacy)
   - **Status:** Canonical module for notifications
   - **Endpoints:** Notification endpoints

### Backend Configuration

**Settings (`settings.py`):**
```python
ENABLE_LEGACY_MODULES = os.getenv("ENABLE_LEGACY_MODULES", "False").lower() == "true"
ALLOW_LEGACY_WRITES = os.getenv("ALLOW_LEGACY_WRITES", "False").lower() == "true"
```

**URL Routing (`urls.py`):**
- Legacy routes are conditionally included:
```python
if settings.ENABLE_LEGACY_MODULES:
    urlpatterns += [
        path("api/legacy/", include("sims_backend.enrollment.urls")),
        path("api/legacy/", include("sims_backend.assessments.urls")),
        path("api/legacy/", include("sims_backend.requests.urls")),
    ]
```

**Middleware:**
- `BlockLegacyWritesMiddleware` - Blocks write operations on `/api/legacy/` endpoints

### Frontend - Legacy Route Handling

#### Legacy Routes Marked
In `frontend/src/config/navConfig.ts`:
```typescript
export const LEGACY_ROUTES: Set<string> = new Set([
  '/assessments',
  '/requests',
  '/enrollment/bulk',
  '/academics/programs-legacy',
])
```

#### Legacy Route Guard
- **Component:** `LegacyRouteGuard` (`frontend/src/components/layout/LegacyRouteGuard.tsx`)
- **Features:**
  - Shows red warning banner with "LEGACY MODULE - DO NOT USE" message
  - Disables all mutation actions (CSS + JS blocking)
  - Links to canonical modules documentation

#### Routes Wrapped with LegacyRouteGuard
1. `/assessments` - ✅ Wrapped in `appRoutes.tsx`
2. `/requests` - ✅ Wrapped in `appRoutes.tsx`
3. `/enrollment/bulk` - ⚠️ Route exists but not in navigation (hidden)

**Note:** `/enrollment/bulk` is marked as legacy but route still exists. Should be removed from route config if not needed.

## Cleanup Actions Taken

### ✅ Completed
1. ✅ Legacy routes gated behind `ENABLE_LEGACY_MODULES` flag
2. ✅ Write operations blocked via middleware
3. ✅ Frontend warning banners for legacy routes
4. ✅ Mutation actions disabled on legacy frontend pages
5. ✅ Legacy routes documented in `LEGACY_ROUTES` set

### ⚠️ Remaining Issues

#### 1. `/enrollment/bulk` Route
**Issue:** Route still exists in `appRoutes.tsx` but is marked as legacy  
**Action:** Should be removed if not needed, or wrapped with `LegacyRouteGuard` if kept

#### 2. Admissions Module Duplication
**Issue:** Two Student models exist:
- `admissions.Student` (legacy, used for application form)
- `students.Student` (canonical, used for enrolled students)

**Recommendation:**
- Keep `admissions` for public application form only
- Migrate application data to canonical `students` module after acceptance
- Document the migration path

#### 3. Legacy Routes in Navigation
**Issue:** Some legacy routes may still appear in navigation if accessed directly  
**Action:** Navigation config already filters legacy routes, but verify all routes are hidden

## Recommendations

### Immediate Actions
1. ✅ Verify `ENABLE_LEGACY_MODULES=False` in production environment
2. ✅ Verify `ALLOW_LEGACY_WRITES=False` in production environment
3. ⚠️ Remove `/enrollment/bulk` route if not needed, or add `LegacyRouteGuard`
4. ⚠️ Document migration path from `admissions.Student` to `students.Student`

### Future Actions (Phase 2)
1. Migrate remaining data from legacy modules to canonical modules
2. Remove legacy module code after migration verification
3. Consolidate `admissions` module with canonical `students` module

## Environment Configuration

### Production Settings
```bash
ENABLE_LEGACY_MODULES=False
ALLOW_LEGACY_WRITES=False
```

### Development/Testing (if needed)
```bash
ENABLE_LEGACY_MODULES=True  # Only if testing legacy routes
ALLOW_LEGACY_WRITES=False   # Keep writes blocked even in dev
```

## Verification Checklist

- [x] Legacy routes gated behind environment flag
- [x] Write operations blocked via middleware
- [x] Frontend warning banners implemented
- [x] Mutation actions disabled on legacy pages
- [x] Legacy routes documented
- [ ] `/enrollment/bulk` route cleaned up
- [ ] All legacy routes hidden from navigation
- [ ] Migration path documented for admissions module

## Summary

**Status:** ✅ **Mostly Complete**

Legacy modules are properly gated and write-protected. Frontend has warning banners and mutation blocking. Minor cleanup needed for `/enrollment/bulk` route and admissions module migration path documentation.
