# Coverage Contract: FMU Platform

**Version:** 1.0  
**Date:** 2026-04-23  
**Status:** ACTIVE (Coverage-Closure Program)

---

## Executive Summary

This contract defines the **governed, honest, deterministic 100% line + 100% branch coverage target** for the FMU Platform under feature freeze. It establishes:

1. **Exact coverage target:** 100% line coverage + 100% branch coverage
2. **Measured scope:** All active executable application code (excluding migrations, tests, generated files, pure bootstraps)
3. **Deprecated code policy:** Deprecated executable code is archived/removed from active measured scope OR excluded by documented policy OR fully tested
4. **CI enforcement:** Branch coverage is mandatory in CI; fail-under policy is set to governed threshold
5. **False exclusion prevention:** No unjustified `# pragma: no cover` tags; all exclusions are documented and policy-backed

---

## 1. Target Scope Definition

### Measured (Active Executable Scope)
**Include in coverage measurement:**
- `backend/sims_backend/` — all active domain modules (academics, attendance, core, documents, enrollments, finance, people, results, notifications, audit)
- `backend/core/` — shared utilities, permission logic, authentication, serializers
- Business logic in models, serializers, views, services, permissions helpers, reporting utilities

### Explicitly Excluded (By Policy, Not Cheating)
**Exclude from coverage measurement:**
- `*/migrations/` — database migrations (auto-generated)
- `*/tests/` / `test_*.py` — test code itself (no coverage of test infrastructure)
- `*/management/commands/` — admin/data-load scripts (maintenance, not business logic)
- `*/wsgi.py`, `*/asgi.py` — pure server bootstraps with no testable logic
- `*/apps.py` — app configuration only (no business logic)
- `*/admin.py` — Django admin registration only (maintenance UI)
- Generated files (auto-generated from migrations, schemas, etc.)

### Deprecated / Archived Scope
**Explicitly removed from active measured scope:**
- `backend/apps/intake/` — Student Intake API is formally deprecated; archived from active coverage measurement
- Legacy/archived modules in `backend/config/` — use canonical `sims_backend` paths instead

---

## 2. Honest Coverage Rules

### Rule 1: No Fake Coverage
- Every line/branch counted must be genuinely executed by a test
- No meaningless assertions that pass trivially
- No tests that only check the happy path when error paths exist
- No "coverage-only" tests that don't verify real behavior

### Rule 2: No Unjustified Exclusions
- `# pragma: no cover` used **only** for:
  - Pure exception handles that would require external system failures to trigger (e.g., OS file descriptor exhaustion)
  - Impossible branches (e.g., `else:` after `if condition: return` where condition is boolean)
  - Environment-specific bootstraps (e.g., `if TYPE_CHECKING:` blocks)
- Any other exclusion must be documented in `docs/_coverage/02_BLOCKER_DECISIONS.md` with justification

### Rule 3: Branch Coverage Matters
- Line coverage alone is insufficient
- Every `if/else`, `try/except`, `and/or`, ternary, and logical branch must be tested
- Missed branches (e.g., permission deny paths, exception handlers, multi-year edge cases) count as blockers

### Rule 4: Deprecated Code Must Be Handled
One of three options **only**:
1. **Archive/Remove:** Delete the code entirely
2. **Exclude by Policy:** Document the exclusion in `BLOCKER_DECISIONS.md` with explicit reasoning
3. **Test:** Write full tests covering all branches

No "this code is old so we skip it" without documentation.

---

## 3. CI Enforcement Policy

### Coverage Thresholds
- **Line Coverage Fail-Under:** 100% (or exact remainder if structural blocker remains, documented)
- **Branch Coverage Fail-Under:** 100% (or exact remainder if structural blocker remains, documented)

### CI Pipeline Requirements
- Backend pytest + coverage runs deterministically (no flaky tests)
- Coverage report includes **both line and branch** metrics
- Failed tests = failed CI build
- Coverage below threshold = failed CI build

### CI Test Harness
```bash
cd backend
pytest \
  --cov=sims_backend \
  --cov=core \
  --cov-report=term-missing \
  --cov-report=html \
  --cov-fail-under=100 \
  --strict-markers
```

---

## 4. Coverage Measurement Baseline

### Current State (Baseline: 2026-04-23)
- **Line Coverage:** 65%
- **Branch Coverage:** Not previously measured; to be established in Phase 2
- **Test Count:** 160 tests passing
- **Known Gaps:** Ancillary modules, reporting edges, deprecated intake handling

### Target State (End of Program)
- **Line Coverage:** 100% (honest, no fake exclusions)
- **Branch Coverage:** 100% (honest, all deny/allow/empty/full/try/except paths covered)
- **Test Count:** >= 160 (will increase significantly with gap closure)
- **Deprecated Scope Governance:** Intake and other dead surfaces explicitly handled (archived/excluded/tested)

---

## 5. Blocker Categories (For Phase 2 Truth Map)

When a line/branch is uncovered, classify as one of:

1. **Dead/Deprecated Code** → Archive, remove, or exclude by policy
2. **Fixture Gap** → Add factory/fixture, then write test
3. **Environment/Setup Dependency** → Requires special CI config or is environment-specific; document exclusion
4. **External Side Effect** → Requires mocking external systems; write isolated test
5. **Permission Branch** → Requires RBAC; write permissioned tests
6. **Exception Path** → Requires error injection; write exception-handling test
7. **Complex Reporting Logic** → Requires multi-year/multi-scenario data setup; write scenario-based test
8. **Simple Oversight** → Coverage gap due to missing simple test; add it immediately

---

## 6. Documentation and Governance

### Decision Documents
- **`01_COVERAGE_TRUTHMAP.md`** — Exact per-file/per-module uncovered inventory with blocker types
- **`02_BLOCKER_DECISIONS.md`** — Decisions for each blocker (test/refactor/archive/exclude + reasoning)
- **`03_TEST_STRATEGY.md`** — How gaps are being closed (factories, test patterns, fixture organization)
- **`04_FINAL_100_COVERAGE_REPORT.md`** — Final coverage report with before/after deltas by module

### Freeze/Debt Document Updates
- **`docs/_freeze/07_VERIFICATION_STATUS.md`** — Updated with final coverage state and CI enforcement policy
- **`docs/_freeze/08_OPEN_GAPS_AND_DEBT.md`** — Final state: all coverage blockers resolved or explicitly excluded
- **`docs/_freeze/09_RESTART_CONDITIONS.md`** — Coverage requirement added to restart conditions
- **`docs/_debt/05_OPEN_REMAINDER.md`** — Coverage complete; no coverage debt remains (except policy-excluded items)

---

## 7. Success Criteria

✅ **Phase 1 (Contract):** This document is locked and governs all work.

✅ **Phase 2 (Truth):** Exact file-by-file uncovered inventory is documented with blocker types.

✅ **Phase 3 (Decisions):** All blockers are classified and decisions are made (test/refactor/archive/exclude).

✅ **Phase 4–6 (Closure):** Tests are written for all closable gaps; deprecated surfaces are archived/excluded.

✅ **Phase 7 (CI):** Branch coverage is enforced; fail-under is 100% or documented remainder.

✅ **Phase 8 (Docs):** All governance documents updated; freeze docs reflect truth.

✅ **Final State:** 100% line + 100% branch coverage achieved honestly, or exact unresolvable remainder documented with blockers explained.

---

## 8. Authority and Enforcement

- **Freeze Authority:** Feature freeze remains active; no new product features expand scope
- **Coverage Authority:** This contract is final; coverage target is 100% or exact documented remainder
- **Test Authority:** All tests added must be meaningful (no fake tests); reviewed before merge
- **Exclusion Authority:** Any exclusion must be documented in `BLOCKER_DECISIONS.md` with explicit policy justification

---

## Change Log

| Date | Change |
|---|---|
| 2026-04-23 | **Contract created** — Establishes 100% line + 100% branch coverage target; defines measured scope; locks honest coverage rules; deprecated code handling policy; CI enforcement |

---

**Status:** LOCKED. This contract governs all coverage-closure work under feature freeze.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
