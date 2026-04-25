# Branch Coverage Baseline: Wave 2 Launch Point

**Date**: 2026-04-25  
**Measurement Tool**: pytest --cov=sims_backend --cov-branch --cov-report=json  
**Data Source**: 201 passing tests, 16 failing (full backend suite)

---

## Executive Summary

Branch coverage measurement is now **active and quantified**. The baseline reveals that while line coverage is 65%, **branch coverage is only 32.5%** (565/1742 branches). This significant gap means:

- Many conditional branches (if/else, try/except, permission checks) are not being tested
- Closing the branch gap is critical for real 100% coverage target
- Finance, results, and people modules have the worst branch coverage ratios

---

## Coverage Baseline

| Metric | Value | Note |
|--------|-------|------|
| **Line Coverage** | 65.4% (5,240 / 8,012 lines) | Measure of code statements executed |
| **Branch Coverage** | 32.5% (565 / 1,742 branches) | Measure of conditional paths taken |
| **Total Tests Passing** | 201 | Full suite (including 16 failing in old suite) |
| **New Tests (test_coverage_unblock_sprint.py)** | 20/20 passing | Permission/endpoint validation |

---

## Critical Branch Misses: Top 15 Files

### Highest Priority (>80 missed branches)

| File | Coverage | Branches | Missed | Impact |
|------|----------|----------|--------|--------|
| **academics/views.py** | 1.7% | 116 | 114 | **CRITICAL** — Heavy conditional view logic |
| **finance/views.py** | 26.6% | 128 | 94 | **CRITICAL** — Multi-condition reporting/filtering |
| **students/imports/validators.py** | 0.0% | 92 | 92 | **POLICY-EXCLUDED** — Not in measured scope |
| **faculty/imports/services.py** | 0.0% | 62 | 62 | **HIGH** — Import job service has no branch coverage |

### High Priority (30-80 missed branches)

| File | Coverage | Branches | Missed | Impact |
|------|----------|----------|--------|--------|
| **students/imports/services.py** | 19.4% | 62 | 50 | Deprecated scope; has conditional logic |
| **finance/services.py** | 51.0% | 96 | 47 | Some coverage; mostly missing validation branches |
| **people/views.py** | 7.9% | 38 | 35 | Permission checks mostly uncovered |
| **timetable/views.py** | 54.1% | 74 | 34 | Admin-heavy; superuser branches missing |
| **attendance/input_views.py** | 42.0% | 50 | 29 | Partial coverage; missing edge cases |
| **common_permissions.py** | 9.4% | 32 | 29 | **CRITICAL** — Permission helper branches |
| **academics/services.py** | 61.4% | 70 | 27 | Service-layer logic gaps |
| **students/imports/utils.py** | 0.0% | 26 | 26 | Utility validators uncovered |
| **students/views.py** | 7.7% | 26 | 24 | Student endpoint permission logic missing |
| **admin/views.py** | 0.0% | 22 | 22 | Django admin-heavy, uncovered |
| **learning/views.py** | 42.1% | 38 | 22 | Permission + endpoint branches missing |

---

## Branch Coverage by Module

### Module Summary (Top 10)

| Module | Line % | Branch % | Branches | Missed | Action |
|--------|--------|----------|----------|--------|--------|
| **academics** | 73% | 9% | 178 | 162 | Need business logic + permission tests |
| **finance** | 72% | 31% | 224 | 154 | Priority: payment/reporting branches |
| **students/imports** | 29% | 5% | 180 | 171 | Policy-excluded (but has logic) |
| **attendance** | 78% | 62% | 61 | 23 | Solid; minor gaps |
| **people** | 90% | 45% | 69 | 38 | Good line %; permission branches missing |
| **results** | 96% | 70% | 63 | 19 | Strong; state transition branches needed |
| **core** | 80% | 28% | 96 | 69 | Utility/permission branches uncovered |
| **learning** | 80% | 42% | 88 | 51 | Service + permission gaps |
| **timetable** | 94% | 54% | 74 | 34 | Admin-heavy; mostly complete |
| **transcripts** | 70% | 64% | 56 | 20 | Good coverage; minor branches missing |

---

## Branch Coverage Strategy for Wave 2

### Immediate Wins (Phase 2 & 3)
These modules benefit most from targeted business logic + permission tests:

1. **finance/views.py** (94 missed branches)
   - Multi-condition reporting filters (fiscal year, status, user role)
   - Permission checks for finance/admin/student roles
   - Estimated: 8-10 new tests → close 40-50 branches

2. **finance/services.py** (47 missed branches)
   - Validation branches in payment processing
   - Multi-year logic + balance calculations
   - Estimated: 5-6 new tests → close 25-30 branches

3. **people/views.py** (35 missed branches)
   - Role-based permission denials
   - List/retrieve/update/delete permission boundaries
   - Estimated: 6-8 new tests → close 20-25 branches

4. **common_permissions.py** (29 missed branches)
   - Permission helper function conditionals
   - Role checking + object ownership logic
   - Estimated: 3-4 new tests → close 15-20 branches

5. **results** state transitions (19 missed branches)
   - draft/published/frozen state machine
   - Forbidden edit after freeze
   - Role-based publish/freeze access
   - Estimated: 6-8 new tests → close 15-19 branches

### Realistic Wave 2 Target
- **Tests added**: 25-35 new tests in Phase 2 & 3
- **Branches closed**: 120-140 branches
- **New branch coverage**: 32.5% → 42-45%
- **New line coverage**: 65.4% → 70-72%

---

## What NOT to Target Yet (Phase 6 scope)

These have high branch counts but depend on infrastructure fixes:

1. **academics/views.py** (114 missed branches) — Needs complex data scenarios
2. **students/imports/validators.py** (92 missed branches) — Policy-excluded from measured scope
3. **faculty/imports/services.py** (62 missed branches) — Database schema issues in test suite
4. **timetable/views.py** (34 missed branches) — Heavy Django admin/superuser logic

---

## Branch vs Line Coverage Insights

### Key Findings

1. **Line coverage obscures real gaps**: 65% line coverage hides only 32.5% branch coverage
   - Conditional statements execute but not all paths taken
   - Permission checks execute successful paths but not denials

2. **High-value modules for Phase 6**:
   - Finance: 8pp line coverage potential, 15pp branch potential
   - Results: 5pp line coverage potential, 10pp branch potential
   - People: 3pp line coverage potential, 8pp branch potential

3. **False confidence areas**:
   - Results shows 96% line but only 70% branch — frozen/published transitions untested
   - Transcripts shows 70% line but only 64% branch — role overrides untested
   - Timetable shows 94% line but only 54% branch — admin-only branches untested

---

## Next Steps: Wave 2 Execution

1. Use this baseline as reference for targeting tests
2. Add business logic tests for finance/results/transcripts
3. Add permission/RBAC tests for finance/results/people
4. Re-measure branch coverage after Phase 2 & 3
5. Aim for 42-45% branch coverage at Wave 2 completion

---

**Baseline Verified**: 2026-04-25  
**Ready for Wave 2 Implementation**

