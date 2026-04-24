# Blocker Decisions: FMU Platform Coverage Closure

**Version:** 1.1  
**Date:** 2026-04-24 (All decisions finalized)  
**Authority:** Coverage Contract § 4 (Deprecated Code Rule), Freeze Scope (docs/_freeze/01_FROZEN_SCOPE.md)

---

## Executive Summary

This document resolves the **6 critical blockers** identified in Phase 2, following the Coverage Contract's deprecated code policy: each blocker is classified as **Archive/Exclude**, **Exclude by Policy**, or **Test**.

**Result:** All blockers are now **decided and governed**. No coverage closure work will be done without explicit authorization in this document.

---

## Blocker Resolution Decisions

### Blocker 1: Student Intake Modules (SCOPE: apps/intake) ✅ DECIDED

**Files:**
- `backend/apps/intake/` (not in active URL routing per freeze scope)
- NOT measured in baseline coverage (already excluded per freeze)

**Current Status:**
- Frozen Scope doc: "Student Intake API (`apps.intake`) is NOT MOUNTED on active API surface"
- Frontend: Limited UI-only surface (`/apply`) exists but submission is not active
- Database: Intake records table exists but unused by active workflows

**Decision: ARCHIVE FROM MEASURED SCOPE**

**Rationale:**
1. Frozen scope explicitly marks intake API as out-of-scope for pilot
2. Replacement UI (React `/apply`) is not launched/enabled
3. Inclusion would add 200+ uncovered lines without business value
4. Restoration requires explicit feature-freeze lift + scoping decision
5. No pilot user story depends on intake API coverage

**Implementation:**
- `apps/intake/` remains in codebase (not deleted)
- Explicitly excluded from pytest coverage measurement in `pytest.ini` / Coverage Contract
- Document this exclusion in `docs/_coverage/02_BLOCKER_DECISIONS.md` ✅ (this file)
- If intake is later restored, it must be added to active measured scope AND fully tested

**Policy:** Intake is **policy-excluded from measured coverage scope**, not hidden by pragma comments. Full justification documented here.

---

### Blocker 2: Student/Faculty Imports — Active or Deprecated? 🔍 → DECIDED

**Files:**
- `sims_backend/students/imports/` — services, validators, utils: 10–29% coverage
- `sims_backend/faculty/imports/` — services, views, templates: 14–32% coverage

**Current Status:**
- Faculty imports: **ACTIVE in URL routing** (`path("", include("sims_backend.faculty.imports.urls"))`)
- Student imports: **NOT active in URL routing** (no include in urls.py)
- No tests exist for either module (coverage gap)
- Frozen scope: No bulk-import workflows mentioned as active surface

**Investigation:**
- Faculty imports expose `/api/admin/faculty/import/` endpoint (FacultyImportViewSet)
- Student imports have no mounted views (only models/services/validators)
- Both modules are clearly meant for CSV bulk-upload workflows
- These workflows are NOT listed in Frozen Scope § "Active Surface"

**Decision (Two-Part):**

#### Part A: Student Imports → ARCHIVE FROM MEASURED SCOPE
- Not in URL routing; no active workflow
- Decision: **Remove from measured coverage scope** (but keep code for future restoration)
- Implementation: Add to pytest.ini `omit` list as "sims_backend/students/imports"

**Rationale:**
- Inactive surface per freeze scope
- No route; no API exposure
- Add back to measured scope only when explicitly re-enabled as feature

#### Part B: Faculty Imports → TEST (Phase 4 Task)
- Active in URL routing; must be covered
- Decision: **Write comprehensive tests** (NOT archive)
- Build faculty import test suite:
  - Happy path: valid CSV, successful bulk upsert
  - Error cases: malformed CSV, duplicate faculty ID, validation failures
  - Permission checks: only admin can import
- Estimated effort: 80–120 lines of test code

**Implementation:** Add to Phase 4 Easy/Medium Gaps task list with medium priority.

---

### Blocker 3: Settings App — Disabled Tests ✅ DECIDED

**Files:**
- `sims_backend/settings_app/tests.py` — 54 lines, 0% covered (fixture not loaded)
- `sims_backend/settings_app/conftest.py` — 14 lines, 0% covered (fixture only)
- `sims_backend/settings_app/` overall: 39–46% coverage

**Current Status:**
- Settings app is active (models, views, serializers all work)
- Tests exist but conftest fixture is not being discovered
- Looks like `conftest.py` is malformed or test discovery is broken

**Decision: RE-ENABLE AND FIX (Phase 4 Task)**

**Rationale:**
1. Settings app is legitimate configuration surface (form building, system settings CRUD)
2. Tests are written; just need pytest discovery fix
3. Quick fix; should raise coverage to 85%+ immediately
4. Not deprecated; active admin surface

**Implementation:**
- Phase 4 task: Debug and fix conftest fixture loading
- Verify pytest can discover `settings_app/tests.py`
- Run settings tests; achieve 85%+ coverage
- Estimated effort: 20–40 lines of test/fixture work

---

### Blocker 4: Syllabus Tests — Disabled ✅ DECIDED

**Files:**
- `sims_backend/syllabus/tests.py` — 60 lines, 0% covered (not discovered)
- `sims_backend/syllabus/conftest.py` — 14 lines, 0% covered
- `sims_backend/syllabus/` overall: 54–67% coverage

**Current Status:**
- Syllabus module is active (models, views, serializers all work)
- Tests exist but conftest fixture is not being discovered (same pattern as settings_app)
- Looks like same pytest discovery issue

**Decision: RE-ENABLE AND FIX (Phase 4 Task)**

**Rationale:**
1. Syllabus is core feature (course syllabus management)
2. Tests are written; just need pytest discovery fix
3. Quick fix with high payload
4. Active surface per frozen scope

**Implementation:**
- Phase 4 task: Debug and fix conftest fixture loading (paired with settings_app fix)
- Verify pytest can discover `syllabus/tests.py`
- Run syllabus tests; achieve 85%+ coverage
- Estimated effort: 20–40 lines of test/fixture work (reuse settings_app fix pattern)

---

### Blocker 5: Finance Views — Complex Reporting + Permission Branches 🔍 → DECIDED

**Files:**
- `sims_backend/finance/views.py` — 211 uncovered lines (47% gap)
- `sims_backend/finance/serializers.py` — 41 uncovered lines (30% gap)
- `sims_backend/finance/services.py` — 66 uncovered lines (28% gap)

**Current Status:**
- Finance module is core to pilot baseline (fee plans, vouchers, payments, reporting)
- Frozen scope lists "Financial Operations" as **active surface**
- Current tests are minimal; many permission branches and edge cases untested

**Issue Analysis:**
- Lines 70–78, 93–101, 123–131: Permission checks (admin/superuser only operations)
- Lines 144–160, 220–244, 261–286: Conditional rendering and reporting logic
- Lines 367–543: Multi-year financial scenarios, edge cases
- Multi-year partial payment scenarios untested
- Deny-path branches (permission denied) untested

**Decision: TEST (Phase 5 — Hard Business Gaps)**

**Rationale:**
1. Finance is core pilot feature; cannot be excluded
2. Permission branches must be tested (security requirement)
3. Multi-year scenarios are legitimate business logic (students pay over multiple years)
4. No pragma tags; all lines are active and must be covered
5. Requires fixture depth (multi-year student data, payment scenarios)

**Implementation Plan:**

**Phase 4 subtask (Foundations):**
- Build finance test fixture factory: student with vouchers, payments, multi-year data
- Estimated effort: 60–80 lines

**Phase 5 main task (Hard Gaps):**
- Add permissioned-user tests for finance views (student, finance officer, admin, superuser)
- Add edge-case tests: zero-balance accounts, multi-year partial payments, fiscal year boundaries
- Add permission-deny tests: student cannot view other student's ledger, student cannot create voucher
- Estimated effort: 250–350 lines of test code

**Target:** 90%+ coverage on finance module by end of Phase 5.

---

### Blocker 6: RBAC Matrix — Permission Branches Across All Views 🔍 → DECIDED

**Affected Files:** (from Phase 2 truth map)
- `sims_backend/people/views.py` — 46 uncovered lines (49% gap)
- `sims_backend/results/views.py` — 15 uncovered lines (12% gap)
- `sims_backend/learning/views.py` — 48 uncovered lines (36% gap)
- `sims_backend/learning/permissions.py` — 12 uncovered lines (36% gap)
- `sims_backend/learning/mixins.py` — 12 uncovered lines (57% gap)
- `sims_backend/notifications/views.py` — 33 uncovered lines (45% gap)
- `sims_backend/academics/views.py` — 24 uncovered lines (27% gap)
- Plus 6+ more modules with permission branches

**Current Status:**
- All modules have RBAC-governed endpoints (student, faculty, admin, superuser roles)
- Current tests only cover happy path (allow cases)
- Missing: deny-path tests (permission denied), deny-role tests (wrong role)

**Pattern:** Views check `self.check_permissions()` or `has_permission()`, but tests don't cover deny branches.

**Decision: TEST (Phase 4 Foundations + Phase 5 Hard Gaps)**

**Rationale:**
1. RBAC is security-critical; both allow AND deny paths must be tested
2. Deny branches are legitimate code paths (security gates)
3. Omitting them is coverage "cheating" per Coverage Contract § 2
4. No architectural change needed; just add role-based test matrix

**Implementation Plan:**

**Phase 4 subtask (Foundations):**
- Build reusable RBAC user fixture factory: student, faculty, admin, superuser users with assigned roles
- Estimated effort: 40–60 lines (conftest.py factory function)

**Phase 4 subtask (View Test Matrix):**
- For each critical view/endpoint, add tests for:
  - Allowed role (e.g., admin can list students)
  - Denied role (e.g., student cannot list students)
  - Anonymous user (if applicable)
- Start with highest-impact views (finance, people, results, learning)
- Estimated effort: 150–200 lines

**Phase 5 completion:**
- Extend matrix to remaining modules
- Add edge cases (cross-role, boundary conditions)
- Estimated effort: 100–150 lines

**Target:** 95%+ coverage on all permission branches by end of Phase 5.

---

## Fixture Foundation (Required for Phases 4–5)

### Decision: Build Reusable Fixture Factories

**Location:** `backend/tests/fixtures.py` (new file, replaces ad-hoc factories in individual test files)

**Factories to Create:**
1. **User Factory** (10–15 lines)
   - Create users with assigned roles (student, faculty, admin, superuser)
   - Deterministic usernames/passwords for reproducible tests

2. **Role Factory** (10–15 lines)
   - Create canonical roles (student, faculty, admin, superuser)
   - Assign task-based permissions

3. **Academic Structure Factory** (20–30 lines)
   - Program, batch, academic period, department, course, section
   - Linked together correctly

4. **Student Factory** (15–20 lines)
   - Create student linked to program, batch, academic period
   - With user account

5. **Finance Factory** (25–35 lines)
   - Voucher, payment, partial payment across years
   - Multi-year scenarios (2023, 2024, 2025)

6. **Attendance Factory** (15–20 lines)
   - Attendance records for student-course-date combos
   - States: present, absent, excused

7. **Result Factory** (15–20 lines)
   - Exam, exam result entry
   - States: draft, published, frozen

8. **Notification Factory** (10–15 lines)
   - Jobs, notifications, notification recipients

**Total:** ~170–220 lines of factory code

**Ownership:** Core responsibility; should be created in Phase 3 / early Phase 4 for reuse across all gap-closure tests.

---

## Python 3.12 Runtime Alignment (Verification)

**Decision: VERIFIED — No Action Required**

**Current State:**
- `backend/pyproject.toml`: target-version = "py312" ✅
- `backend/Dockerfile`: `FROM python:3.12-slim` ✅
- `backend/.dockerignore`: Current ✅
- Host environment: Python 3.12 verified ✅
- CI: GitHub Actions uses python-3.12 (verify in Phase 7) ⏳

**Verification:** Python 3.12 is already locked in all canonical locations. No blocker.

---

## Legacy Import Normalization (Verification)

**Decision: VERIFIED — No Action Required**

**Current State:**
- Primary package: `sims_backend` (active, used in pytest.ini, docker)
- Legacy package: `config` (exists but not used in pytest.ini coverage)
- Transition: Complete; no apps reference legacy `apps.*` paths anymore

**Verification:** No legacy import blocking coverage closure. All canonical imports use `sims_backend.*` paths. ✅

---

## Summary: Blocker Decisions

| Blocker | Decision | Action | Phase | Effort |
|---|---|---|---|---|
| **Student Intake API** | Archive (policy exclusion) | Document in Coverage Contract | Phase 1 (done) | 0 |
| **Student Imports (inactive)** | Archive (policy exclusion) | Add to pytest.ini omit | Phase 3 | 1 line |
| **Faculty Imports (active)** | TEST | Write import test suite | Phase 4 | 80–120 LOC |
| **Settings App tests** | Re-enable + Fix | Debug conftest discovery | Phase 4 | 20–40 LOC |
| **Syllabus tests** | Re-enable + Fix | Debug conftest discovery | Phase 4 | 20–40 LOC |
| **Finance (complex)** | TEST | Build scenario tests + fixtures | Phase 4–5 | 250–350 LOC |
| **RBAC Matrix** | TEST | Build user fixture + role matrix | Phase 4–5 | 150–250 LOC |
| **Python 3.12** | Verified ✅ | None | - | 0 |
| **Legacy imports** | Verified ✅ | None | - | 0 |

**Total Estimated New Test Code:** 520–840 lines (across Phase 4–5)

---

## Governance: What Gets Tested vs. Excluded

### Policy-Excluded From Measured Scope (Documented)
1. `apps/intake/` — Frozen scope, API not mounted, UI-only fallback ✅
2. `sims_backend/students/imports/` — Inactive, no URL routing ✅
3. `*/migrations/` — Auto-generated (pytest.ini already excludes)
4. `*/tests/` — Test infrastructure (pytest.ini already excludes)
5. `*/management/commands/` — Admin scripts (pytest.ini already excludes)
6. `*/wsgi.py`, `*/asgi.py` — Pure bootstraps (pytest.ini already excludes)
7. `*/apps.py`, `*/admin.py` — Configuration only (pytest.ini already excludes)

### Must Be Tested (No Exclusions)
- All active views with permission branches (RBAC matrix)
- All active service/serializer logic (finance, academics, attendance, results)
- All exception paths (error handling, validation)
- All multi-branch conditionals (if/else, and/or, try/except)
- All state machine transitions (result status, attendance state)

### No unjustified `# pragma: no cover` Tags
- Any existing pragma comments will be audited in Phase 2 follow-up
- Pragmas require justification in this decision document

---

## Next Phases

**Phase 4: Easy/Medium Gaps** — Implement fixture factories + simple tests
**Phase 5: Hard Business Gaps** — Implement finance + RBAC matrix tests
**Phase 6: Final Branch Sweep** — Inspect HTML coverage report, catch remaining branches

---

**Status:** Phase 3 COMPLETE. All blockers are decided and governed. Ready for Phase 4 implementation.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
