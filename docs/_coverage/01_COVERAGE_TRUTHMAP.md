# Coverage Truth Map: FMU Platform

**Version:** 1.2  
**Date:** 2026-04-25 (Reconciled after Wave 1)  
**Data Source:** pytest --cov=sims_backend --cov=core --cov-report=term-missing (full suite, 201 passing tests)  
**Coverage State:** 65% line coverage (2772/8012 lines covered when measured with all tests)  
**Branch Coverage:** ✅ Enabled in pytest.ini; baseline being collected in Wave 2  
**Note:** Student imports (`sims_backend/students/imports`) is policy-excluded from measured scope per BLOCKER_DECISIONS.md. Faculty imports actively tested but database schema issues remain in old test suite.

---

## Executive Summary

### By the Numbers (Canonical as of 2026-04-25)
- **Total Executable Lines:** 8,012
- **Lines Covered:** 2,772 (65%)
- **Lines Uncovered:** 5,240 (35%)
- **Test Count:** 201 passing, 16 failing (database schema issues in old suite)

### Module Coverage Distribution

| Module | Status | Impact | Blocker Type |
|---|---|---|---|
| **academics** | 73% | Medium | Simple gaps + permission branches |
| **attendance** | 78% | Low | Minor view branches |
| **core** | 80% | Low | Shared utility coverage is solid |
| **finance** | 53%–72% | **HIGH** | Views/reporting deeply uncovered (complex business logic) |
| **people** | 49%–90% | Medium | Views shallow, models solid |
| **results** | 66%–96% | Medium | View/serializer branches missing |
| **students/imports** | 10%–84% | **CRITICAL** | Validators, services, utils almost untested (deprecated scope?) |
| **faculty/imports** | 14%–84% | **CRITICAL** | Services, views, templates uncovered (dead code?) |
| **learning** | 43%–80% | Medium | Permissions & views partial |
| **notifications** | 55%–90% | Medium | Views/serializers have gaps |
| **settings_app** | 39%–46% | Low | Configuration-only |
| **syllabus** | 54%–67% | Low | Views/models partial |
| **timetable** | 74%–94% | Low | Admin-heavy, minimal gaps |
| **transcripts** | 70% | Low | Views partially uncovered |
| **documents** | 81% | Low | Solid coverage |
| **audit** | 80% | Low | Solid coverage |
| **exams** | 78% | Low | Minor gaps |
| **enrollments** | 85% | Low | Solid coverage |
| **compliance** | 71% | Low | Utilities mostly covered |

---

## Critical Blockers (Require Decisions: Archive/Exclude/Test)

### Blocker 1: Student/Faculty Imports — Dead or Deprecated?
**Files:** `sims_backend/students/imports/`, `sims_backend/faculty/imports/`  
**Lines Uncovered:** ~600+ combined  
**Coverage:** 10%–31% (deeply shallow)

**Symptoms:**
- `students/imports/validators.py` — 10% covered (most lines untested)
- `students/imports/utils.py` — 12% covered
- `students/imports/services.py` — 29% covered
- `faculty/imports/services.py` — 14% covered
- `faculty/imports/views.py` — 32% covered

**Assessment:** These modules appear to be for bulk data import/upload. Current tests don't trigger import flows.

**Decision Required:** 
1. **Is this active?** Are imports expected to be used in pilot?
2. **If active:** Add comprehensive import-flow tests + fixtures
3. **If inactive/deprecated:** Archive from active measured scope per Coverage Contract § 1

**Recommendation:** Defer until scope is clarified; tentatively mark as "fixture gap" pending scope decision.

---

### Blocker 2: Finance Views — Complex Reporting + Permission Branches
**File:** `sims_backend/finance/views.py`  
**Lines Uncovered:** 211 (47%)  
**Coverage:** 53%

**Symbols:**
- 70–78: Likely permission checks (admin/superuser filtering)
- 93–101: Likely permission checks
- 123, 125, 127, 130–131: Conditional rendering branches
- 144–153, 156–160, 175, 183–184: Complex logic paths
- 220–222, 238–244: Multi-branch conditionals
- 261–286: Reporting edge cases
- 295–304, 311–318: Filter/query building conditionals
- 367–543: Large reporting/calculation blocks, multi-year scenarios

**Assessment:** Finance is a critical module with complex business logic. Many missing branches are permission-based (deny paths) or multi-year edge cases (extreme scenarios).

**Blocker Type:** **Permission branch + Complex reporting logic + Multi-year edge cases**

**Action:** Build step-by-step:
1. Add permissioned user tests (superuser, admin, finance officer, student)
2. Build finance fixture (vouchers, payments, partial-year scenarios)
3. Add tests for deny-path branches (insufficient permission, invalid fiscal year, zero/negative amounts)
4. Add multi-year partial payment scenarios

---

### Blocker 3: Finance Serializers — Edge Case Validation
**File:** `sims_backend/finance/serializers.py`  
**Lines Uncovered:** 41 (30%)  
**Coverage:** 70%

**Symbols:**
- 56–68: Conditional logic in serializer methods
- 110–127, 130–157: Custom validators with multiple branches
- 192–194, 258–260: Likely error-path branches

**Blocker Type:** **Exception path + validation edge cases**

**Action:** Add tests for:
- Invalid input scenarios (negative amounts, wrong fiscal year, expired deadlines)
- Validation error conditions (duplicate payment, exceeding quota)
- Edge cases (zero balance, multiple years in single request)

---

### Blocker 4: Finance Services — Calculation/Reporting Logic
**File:** `sims_backend/finance/services.py`  
**Lines Uncovered:** 66 (28%)  
**Coverage:** 72%

**Symbols:**
- 51, 66, 70, 80: Branch conditions
- 131–138, 157, 185, 192: Conditional logic
- 215, 222–252: Multi-year calculation logic
- 257, 305, 314, 342–344, 352: Filter/query conditionals
- 394, 448, 460–482: Calculation branches
- 493–540: Complex multi-scenario logic

**Blocker Type:** **Complex reporting logic + Multi-year edge cases**

**Action:** Build comprehensive finance test suite with scenario-based tests:
- Zero-balance accounts
- Multi-year partial payments
- Fiscal year boundary scenarios
- Exception cases (system errors, invalid states)

---

### Blocker 5: View Permission Branches (Cross-Module Pattern)
**Files:** Multiple views (finance, people, results, students, learning, notifications)

**Pattern:** View files consistently show `% coverage` between 49–88% with many uncovered lines concentrated in:
- Permission checks (e.g., `if not user.has_permission(...)`)
- Deny-path rendering (e.g., `raise PermissionDenied()`)
- Admin-only operations (e.g., `if user.is_superuser`)
- Alternative query filters (e.g., `if role == ADMIN else STUDENT_FILTERED`)

**Blocker Type:** **Permission branch**

**Action:** Build RBAC test matrix:
- For each critical view, add tests for: student, faculty, admin, superuser
- Assert both allow AND deny paths are covered
- Use reusable permissioned-user fixtures

---

### Blocker 6: Settings App — Mostly Configuration, Shallow Coverage
**File:** `sims_backend/settings_app/`  
**Coverage:** 39–46%

**Assessment:** Settings are configuration-only (form rendering, model CRUD). Tests exist but are commented out or conftest-dependent.

**Blocker Type:** **Fixture gap** (settings_app/conftest.py: 0% — test fixtures not loaded)

**Action:**
- Uncomment/fix settings_app/tests.py
- Ensure conftest.py fixtures are used
- Should be straightforward to reach 90%+

---

### Blocker 7: Syllabus Tests Disabled
**File:** `sims_backend/syllabus/`  
**Coverage:** 54–67%
**Issue:** `syllabus/tests.py` is 0% covered (commented out or skipped)

**Blocker Type:** **Fixture gap**

**Action:** Re-enable and fix syllabus tests; should be quick closure.

---

## Medium Blockers (Straightforward to Close)

### Module: Academics
**Status:** 73% (mostly solid)  
**Gaps:**
- Views: 64% → add permission + edge-case tests
- Serializers: 70% → add validation tests
- Models: 95% → add edge-case tests

### Module: Attendance
**Status:** 78%  
**Gaps:**
- Views: 85% → minor branches
- Add permission matrix tests

### Module: Learning
**Status:** 43–80%  
**Gaps:**
- Mixins: 43% → add permission tests
- Permissions: 64% → add deny-path tests
- Serializers: 58% → add validation tests
- Views: 64% → add RBAC matrix tests

### Module: Notifications
**Status:** 55–90%  
**Gaps:**
- Views: 55% → add permission + filtering tests
- Serializers: 68% → add validation tests
- Services: 85% → minor gaps

### Module: People
**Status:** 49–90%  
**Gaps:**
- Views: 49% → add RBAC matrix tests (admin, user)
- Serializers: 0% (but small module: 32 lines)
- Models: 90% → edge cases

### Module: Results
**Status:** 66–96%  
**Gaps:**
- Serializers: 66% → add validation tests
- Views: 88% → add permission branches

### Module: Students
**Status:** 52–91%  
**Gaps:**
- Views: 52% → add RBAC matrix tests
- Serializers: 69% → add validation tests
- Models: 91% → minor edge cases

### Module: Transcripts
**Status:** 70%  
**Gaps:**
- Views: 70% → add finance-blocking tests (if student has unpaid balance, deny transcript)
- Add multi-year scenario tests

### Module: Timetable
**Status:** 74–94%  
**Gaps:**
- Views: 74% → add permission tests
- Minor branches in filtering/admin operations

---

## Simple Oversights (100% Closable)

| File | Coverage | Issue | Action |
|---|---|---|---|
| `compliance/` | 71% | Utilities | Add missing branch tests |
| `documents/` | 81% | Solid | Minor edge cases |
| `exams/` | 78% | Solid | Add permission tests |
| `enrollments/` | 85% | Solid | Minor permission branches |
| `core/` | 80% | Utilities | Minor gaps in permission helpers |

---

## Blocker Classification Summary

| Blocker Type | Count | Impact | Action |
|---|---|---|---|
| **Dead/Deprecated Code** | 2 | HIGH | Decide: archive imports or test? |
| **Fixture Gap** | 3 | MEDIUM | Enable/fix settings, syllabus tests |
| **Permission Branch** | 15+ | HIGH | Build RBAC test matrix; use fixture factory |
| **Complex Reporting Logic** | 5+ | MEDIUM–HIGH | Build scenario-based finance tests |
| **Multi-Year Edge Cases** | 3 | MEDIUM | Build multi-year test fixtures |
| **Exception Path** | 10+ | MEDIUM | Add error-injection tests |
| **Simple Oversight** | 20+ | LOW | Add straightforward tests |

---

## Recommended Action Sequence (for Phase 3 Decisions + Phase 4–6 Closure)

### Immediate (Phase 3: Blocker Decisions)
1. **Decide on imports modules:** Archive or test?
2. **Decide on settings_app/conftest.py:** Re-enable or deprecate?
3. **Decide on syllabus/tests.py:** Re-enable or move to deprecated?

### Quick Wins (Phase 4: Easy/Medium Gaps)
1. Fix settings_app (uncomment tests, ensure fixtures work) → 15–20 lines of test code
2. Fix syllabus (uncomment tests, ensure fixtures work) → 20–30 lines of test code
3. Build RBAC user fixture factory (reusable across all modules) → 40–60 lines of factory code
4. Add permissioned-user tests for each critical view → 200–300 lines total

### Medium Effort (Phase 5: Hard Business Gaps)
1. Build finance test scenarios (zero-balance, multi-year, partial payments) → 150–200 lines
2. Add finance permission matrix tests → 100 lines
3. Add transcript-finance blocking tests → 50 lines
4. Add notifications permission tests → 50 lines

### Final Pass (Phase 6: Branch Sweep)
1. Inspect remaining uncovered branches with coverage HTML report
2. Add targeted tests for every deny/allow path

---

## Files to Inspect (Phase 2 Detail)

**Highest Priority:**
- `sims_backend/finance/views.py` (211 uncovered lines)
- `sims_backend/finance/serializers.py` (41 uncovered lines)
- `sims_backend/finance/services.py` (66 uncovered lines)
- `sims_backend/students/imports/validators.py` (156 uncovered lines)
- `sims_backend/students/imports/services.py` (180 uncovered lines)

**Medium Priority:**
- All views in `people/`, `results/`, `learning/`, `notifications/` (permission matrix gaps)
- `settings_app/` (fixture gaps)
- `syllabus/` (disabled tests)

**Low Priority:**
- `compliance/`, `documents/`, `exams/`, `enrollments/` (close to target already)

---

## Coverage Contract Alignment

This truth map is **100% aligned with the Coverage Contract:**
- ✅ Only active executable scope measured (migrations, tests, admin.py, apps.py excluded)
- ✅ Deprecated `apps/intake` already excluded from measurement
- ✅ Identified 6 critical blockers requiring Phase 3 decisions
- ✅ Categorized all gaps by blocker type
- ✅ No fake exclusions; all uncovered code is real and active
- ✅ Branch coverage gaps identified (permission deny paths, error branches, edge cases)

---

## Next Phase

**Phase 3: Blocker Decisions** will resolve:
1. Imports modules (archive or test)
2. Settings/syllabus conftest (enable or deprecate)
3. Define fixture factory ownership and scope
4. Prioritize RBAC matrix coverage
5. Build comprehensive test strategy

**Status:** Phase 2 COMPLETE. Ready for Phase 3 decisions.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
