# Faculty Import Suite Status: Wave 2 Assessment

**Date**: 2026-04-25  
**Assessment**: Database migration blocker identified  
**Status**: ⚠️ **BLOCKED - KEEP, FIX INFRASTRUCTURE**

---

## Current Test Suite Status

**File**: `backend/tests/test_faculty_imports.py`  
**Test Count**: ~40+ test cases  
**Pass/Fail Breakdown**:
- ✅ **20 passing tests** (endpoints that work without database state)
- ❌ **20+ failing tests** (database schema missing)

---

## Failure Pattern

### Error Message (Consistent)
```
django.db.utils.OperationalError: no such table: faculty_imports_facultyimportjob
```

### Root Cause

The test suite references database tables that should exist during test runs but don't get created:
- `faculty_imports_facultyimportjob`
- `faculty_imports_facultyimportresult`
- Related tables defined in `sims_backend/faculty/imports/models.py`

**Why**: Django test database migrations aren't running against the `faculty/imports` models before pytest executes.

### Affected Test Classes

| Test Class | Status | Error Type |
|------------|--------|-----------|
| `TestFacultyImportUpload` | ❌ Failing | DB table missing |
| `TestFacultyImportPreview` | ❌ Failing | DB table missing |
| `TestFacultyImportCommit` | ❌ Failing | DB table missing |
| `TestFacultyImportJobs` | ❌ Failing | DB table missing |
| `TestFacultyImportJobDetail` | ❌ Failing | DB table missing |
| `TestFacultyImportErrorsCSV` | ❌ Failing | DB table missing |
| `TestFacultyImportPermissions` | ❌ Failing | DB table missing |
| `TestFacultyImportUploadAuth` | ✅ Passing | No DB state required |
| `TestFacultyImportTemplateAuth` | ✅ Passing | No DB state required |
| Others (template, download endpoints) | ✅ Passing | Stateless endpoints |

---

## Decision: KEEP & FIX

### Rationale

1. **Test Suite Quality**: The 40+ tests are well-structured
   - Comprehensive endpoint coverage (upload, preview, commit, jobs, details, errors)
   - Good permission matrix (admin, coordinator, staff, unauthenticated)
   - Tests real business logic (CSV validation, job state, error tracking)

2. **Failures Are Environmental, Not Code Issues**
   - Tests themselves are valid
   - Issue is test infrastructure (database migration)
   - Fixable without rewriting tests

3. **High Value When Fixed**
   - Would unlock 20+ tests for ~5-8pp coverage gain
   - Faculty imports are active code (not deprecated)
   - Tests cover multiple layers (views, services, permissions)

### Why Not Delete

- Deleting would lose test infrastructure investment
- Faculty import feature is active (used for coordin admin workflows)
- Problem is not with tests but with pytest configuration
- Restoration cost: < 2 hours investigation + fix

---

## Fix Strategy

### Option 1: Django TestCase with Migrations (Recommended)

```python
# backend/tests/test_faculty_imports.py

from django.test import TestCase
from rest_framework.test import APIClient

class TestFacultyImportUpload(TestCase):
    """Uses Django's built-in migration runner."""
    
    def setUp(self):
        # Database tables auto-created by Django migrations
        self.client = APIClient()
        self.admin = User.objects.create_superuser(...)
```

**Pros**: Simple, uses Django defaults  
**Cons**: Slower test runs (migrations rerun per test)  
**Estimated Effort**: 30 min

### Option 2: Pytest Fixture with Explicit Migrations

```python
# backend/tests/conftest.py

@pytest.fixture(scope="session", autouse=True)
def run_migrations(django_db_setup):
    """Explicitly run all migrations before tests."""
    from django.core.management import call_command
    call_command('migrate', '--run-syncdb')
    yield
```

**Pros**: Comprehensive, runs once per session  
**Cons**: May capture unwanted migrations  
**Estimated Effort**: 15 min

### Option 3: Create Migration Fixture in conftest

```python
# backend/tests/conftest.py

@pytest.fixture(scope="session", autouse=True)
def create_faculty_imports_tables(django_db_setup, django_db_blocker):
    """Create only faculty_imports tables."""
    with django_db_blocker.unblock():
        from sims_backend.faculty.imports.models import FacultyImportJob
        FacultyImportJob._meta.db_table  # Trigger table creation
```

**Pros**: Minimal overhead, targeted  
**Cons**: May miss related tables  
**Estimated Effort**: 20 min

---

## Immediate Action

### Short-term (Next Session)

- [ ] Choose fix strategy (recommend Option 2 or 3)
- [ ] Apply fix to backend/tests/conftest.py or test_faculty_imports.py
- [ ] Verify: All 40+ tests pass
- [ ] Measure coverage delta

### Expected Outcome

If fixed properly:
- ✅ 40+ tests passing
- ✅ +5-8pp line coverage from faculty imports module
- ✅ 25+ new branch paths tested (permission matrix × job states)

---

## Current Workaround (If Needed Now)

Until infrastructure is fixed, the passing faculty import tests still provide value:
- Template endpoint tests work
- Permission denial tests work
- Unauthenticated deny tests work

The failing tests can be skipped temporarily:

```python
@pytest.mark.skip(reason="Django migration infrastructure - see 13_FACULTY_IMPORT_SUITE_STATUS.md")
class TestFacultyImportJobs:
    ...
```

Then re-enable after infrastructure fix.

---

## Why This Blocks Coverage

The faculty/imports module has 200+ uncovered lines because:
1. Import job creation not tested → service logic uncovered
2. CSV validation not tested → 60+ validator lines uncovered
3. Job state transitions not tested → 20+ state machine lines uncovered

These are high-value lines for coverage:
- **Business Logic**: CSV parsing, duplicate detection, bulk import
- **Permission Checks**: Coordinator vs admin boundaries
- **Error Handling**: Malformed CSV, duplicate emails, invalid data

---

## Module Health Check

| Aspect | Status | Note |
|--------|--------|------|
| Test Structure | ✅ Good | Well-organized test classes |
| Endpoint Coverage | ✅ Good | All endpoints tested |
| Permission Coverage | ✅ Good | Multiple roles tested |
| Database State | ❌ Missing | Migration infrastructure issue |
| Business Logic | ⚠️ Blocked | Tests exist, can't run |
| Mock/Fixture Strategy | ✅ Good | Realistic data patterns |

---

## Recommendation

**KEEP the test suite. Fix the infrastructure.**

- Invest 15-30 minutes in migration fix
- Payoff: +20 tests, +5-8pp coverage
- Implementation: Update conftest.py with migration runner
- Then proceed to Phase 6 with full faculty import coverage

**Do NOT delete** — this would be wasting structured, comprehensive tests due to a fixable environmental issue.

---

**Status**: Blocked on test infrastructure, not code quality  
**Action**: Engineering task for next session  
**Priority**: Medium (high payoff once fixed)
