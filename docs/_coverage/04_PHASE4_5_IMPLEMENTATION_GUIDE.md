# Phase 4–5 Implementation Guide: Gap Closure

**Date:** 2026-04-23  
**Objective:** Close 400–600 LOC of easy/medium gaps using fixture factories from Phase 3

---

## Quick Start

### Before Starting
```bash
cd /home/munaim/srv/apps/fmu-platform/backend
python -m pytest --collect-only  # Verify pytest finds all tests
python -m pytest tests/ -v --tb=short  # Run baseline
```

### Fixture Foundation Ready
All fixtures in `backend/tests/conftest.py` are available for import in test files:
- `admin_user`, `admin_client`
- `student_user`, `student_client`
- `faculty_user`, `faculty_client`
- `finance_user`, `finance_client`
- `registrar_user`, `registrar_client`
- `program`, `batch`, `academic_period`, `department`, `course`, `course_section`
- `student`, `another_student`
- `voucher`, `payment`, `multi_year_student_data`
- `attendance`, `exam`, `exam_result`
- `populated_academic_structure`, `populated_students`

---

## Task 1: Fix Settings App Tests (20–40 LOC)

**File:** `sims_backend/settings_app/`  
**Issue:** `conftest.py` exists but tests aren't discovered  
**Action:**

1. Check `settings_app/conftest.py` — is it properly structured?
2. Check `settings_app/tests.py` — does it have `class SettingsTest(TestCase):`?
3. Verify conftest is being loaded:
   ```bash
   pytest sims_backend/settings_app/tests.py -v
   ```
4. If fixture not found, check imports — should use standard pytest patterns

**Expected Outcome:**
- Settings tests run and pass
- Coverage rises from 39–46% → 85%+

**Estimated Effort:** 15–30 minutes

---

## Task 2: Fix Syllabus Tests (20–40 LOC)

**File:** `sims_backend/syllabus/`  
**Issue:** Same pattern as settings app  
**Action:**

1. Verify `syllabus/conftest.py` is properly structured
2. Verify `syllabus/tests.py` test class exists
3. Run:
   ```bash
   pytest sims_backend/syllabus/tests.py -v
   ```
4. Debug any fixture loading issues

**Expected Outcome:**
- Syllabus tests run and pass
- Coverage rises from 54–67% → 85%+

**Estimated Effort:** 15–30 minutes

---

## Task 3: Faculty Imports Test Suite (80–120 LOC)

**File:** `backend/tests/test_faculty_imports.py` (NEW)

**Test Cases to Write:**

```python
import pytest
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

class FacultyImportTests:
    
    # Test 1: Admin can import valid faculty CSV
    def test_faculty_import_valid_csv(self, admin_client):
        """Test successful faculty bulk import."""
        # TODO: Prepare valid CSV data
        # POST to /api/admin/faculty/import/
        # Assert: 201 Created, faculty records created
    
    # Test 2: Student cannot import faculty
    def test_faculty_import_student_denied(self, student_client):
        """Test permission denied for non-admin."""
        # POST to /api/admin/faculty/import/
        # Assert: 403 Forbidden
    
    # Test 3: Unauthenticated user cannot import
    def test_faculty_import_unauthenticated_denied(self, unauthenticated_client):
        """Test permission denied for anonymous."""
        # POST to /api/admin/faculty/import/
        # Assert: 401 Unauthorized
    
    # Test 4: Invalid CSV format rejected
    def test_faculty_import_invalid_csv(self, admin_client):
        """Test error handling for malformed CSV."""
        # POST malformed CSV
        # Assert: 400 Bad Request
    
    # Test 5: Duplicate faculty ID handled
    def test_faculty_import_duplicate_id(self, admin_client):
        """Test duplicate key handling."""
        # Create faculty
        # Import CSV with same faculty ID
        # Assert: 409 Conflict or upsert behavior
```

**Expected Outcome:**
- Faculty imports: 14–32% → 70%+ coverage
- Permission branches tested

**Estimated Effort:** 60–90 minutes

---

## Task 4: RBAC Permission Matrix (150–200 LOC)

**File:** `backend/tests/test_rbac_matrix.py` (NEW)

**Pattern:**
For each critical view/endpoint, add tests for allow + deny:

```python
class TestFinanceViewsRBAC:
    """Test RBAC matrix for finance views."""
    
    # Test: Student can view own ledger
    def test_student_view_own_ledger(self, student, student_client):
        """Student should see own payment ledger."""
        response = student_client.get(f'/api/finance/ledger/?student={student.id}')
        assert response.status_code == 200
    
    # Test: Student CANNOT view other student's ledger
    def test_student_deny_other_ledger(self, student_client, another_student):
        """Student should NOT see other student's ledger."""
        response = student_client.get(f'/api/finance/ledger/?student={another_student.id}')
        assert response.status_code == 403
    
    # Test: Finance officer can view all ledgers
    def test_finance_officer_view_all_ledgers(self, finance_client, student):
        """Finance officer should see any ledger."""
        response = finance_client.get(f'/api/finance/ledger/?student={student.id}')
        assert response.status_code == 200
    
    # Test: Admin can view all ledgers
    def test_admin_view_all_ledgers(self, admin_client, student):
        """Admin should see any ledger."""
        response = admin_client.get(f'/api/finance/ledger/?student={student.id}')
        assert response.status_code == 200


class TestPeopleViewsRBAC:
    """Test RBAC matrix for people views."""
    
    # Add similar allow/deny tests for:
    # - Student list (admin can, student cannot)
    # - Employee list (faculty can, student cannot)
    # - Role assignment (admin only)


class TestResultsViewsRBAC:
    """Test RBAC matrix for results views."""
    
    # Add similar tests for:
    # - Result creation (examcell only)
    # - Result publication (examcell only)
    # - Result viewing (student own, faculty class, admin all)


class TestLearningViewsRBAC:
    """Test RBAC matrix for learning views."""
    
    # Add similar tests for course/section access
```

**Expected Outcome:**
- Permission deny paths all tested
- Finance views: 53% → 80%+ coverage
- People views: 49% → 80%+ coverage
- Results views: 88% → 95%+ coverage
- Learning views: 43–64% → 85%+ coverage

**Estimated Effort:** 120–180 minutes

---

## Task 5: Finance Multi-Year Scenarios (150–200 LOC)

**File:** `backend/tests/test_finance_scenarios.py` (NEW)

**Test Cases:**

```python
class TestFinanceMultiYearScenarios:
    """Test complex multi-year finance logic."""
    
    # Test 1: Multi-year partial payment
    def test_multi_year_partial_payment(self, multi_year_student_data):
        """Test partial payment tracking across years."""
        # multi_year_student_data contains 3 years with partial payments
        # Query balance for 2024 payment (should be 40k remaining)
        # Query balance for 2025 payment (should be 40k remaining)
        # Assert: Balances calculated correctly per year
    
    # Test 2: Zero balance account
    def test_zero_balance_account(self, student, academic_period):
        """Test reporting for zero-balance account."""
        # Create voucher + full payment
        # Query ledger
        # Assert: Balance = 0, status = "paid"
    
    # Test 3: Fiscal year boundary
    def test_fiscal_year_boundary(self, student):
        """Test filtering at year boundary."""
        # Create vouchers for 2024-12-31 and 2025-01-01
        # Query ledger with year_filter=2024
        # Assert: Only 2024 vouchers returned
    
    # Test 4: Negative amount rejection
    def test_negative_payment_rejected(self, voucher):
        """Test validation rejects negative payments."""
        # POST payment with amount=-1000
        # Assert: 400 Bad Request
    
    # Test 5: Overpayment handling
    def test_overpayment_rejection(self, voucher):
        """Test validation rejects overpayment."""
        # Voucher amount = 100k
        # Attempt payment of 150k
        # Assert: 400 Bad Request or 422 Unprocessable Entity
    
    # Test 6: Finance report generation
    def test_finance_report_multi_year(self, student):
        """Test report aggregation across years."""
        # Create multi-year data
        # Generate report
        # Assert: Report shows 3 years of data
    
    # Test 7: Exceptional exception handling
    def test_payment_duplicate_error(self, payment, voucher):
        """Test idempotency guard."""
        # Create same payment twice
        # Assert: Duplicate rejected or handled gracefully
```

**Expected Outcome:**
- Finance views: 53% → 90%+ coverage
- Finance serializers: 70% → 95%+ coverage
- Finance services: 72% → 95%+ coverage

**Estimated Effort:** 120–180 minutes

---

## Task 6: Transcript-Finance Blocking (30–50 LOC)

**File:** `backend/tests/test_transcript_finance_blocking.py` (NEW)

```python
class TestTranscriptFinanceBlocking:
    """Test transcript generation blocked if finance unpaid."""
    
    # Test: Student with unpaid balance cannot generate transcript
    def test_transcript_blocked_unpaid_balance(self, student, student_client, voucher):
        """Test transcript generation is blocked for unpaid students."""
        # Voucher created, no payment made (balance = 100k)
        # POST /api/transcripts/generate/
        # Assert: 402 Payment Required or 403 Forbidden
    
    # Test: Student with paid balance can generate transcript
    def test_transcript_allowed_paid_balance(self, student, student_client, payment):
        """Test transcript generation allowed for fully paid."""
        # Voucher fully paid
        # POST /api/transcripts/generate/
        # Assert: 200 OK, transcript generated
    
    # Test: Admin can generate transcript regardless of payment
    def test_transcript_admin_override(self, admin_client, student, voucher):
        """Test admin can generate transcript even if unpaid."""
        # Voucher unpaid
        # POST as admin
        # Assert: 200 OK, transcript generated
```

**Expected Outcome:**
- Transcripts: 70% → 100% coverage
- Finance deny paths fully tested

**Estimated Effort:** 30–45 minutes

---

## Phase 4–5 Execution Checklist

- [ ] Task 1: Settings app tests fixed (target: 85%+)
- [ ] Task 2: Syllabus tests fixed (target: 85%+)
- [ ] Task 3: Faculty imports tests added (target: 70%+)
- [ ] Task 4: RBAC permission matrix added (target: 80%+ for all views)
- [ ] Task 5: Finance multi-year scenarios added (target: 90%+)
- [ ] Task 6: Transcript-finance blocking added (target: 100%)
- [ ] Run full coverage report
- [ ] Measure delta vs 65% baseline
- [ ] Proceed to Phase 6 if coverage ≥ 90%

---

## Running Tests & Measuring Coverage

```bash
# Phase 4: Run after each task
cd /home/munaim/srv/apps/fmu-platform/backend
pytest tests/ --cov=sims_backend --cov=core --cov-report=term-missing -v

# After completing all Phase 4–5 tasks:
pytest --cov=sims_backend --cov=core --cov-report=html

# View HTML report:
open htmlcov/index.html
```

---

## Expected Coverage Delta

### Baseline (65%)
- Before: 2,824 / 8,012 lines covered

### After Phase 4–5 (Target: 90%+)
- Estimated gain: +25–30% (additional 2,000–2,400 lines covered)
- Expected new total: ~4,800–5,200 / 8,012 lines covered
- Expected final: 90%+ coverage

---

## Notes

- **Fixture Reuse:** All fixtures are designed for reuse across test files. Import from `conftest.py` in any test module.
- **Parallel Work:** Tasks 1–6 can be done in parallel (each in separate file/module).
- **No Coverage Cheating:** Every test must verify meaningful behavior, not just exercise code paths.
- **Permission Testing Critical:** Deny paths (403, 401 errors) are where security lives; they must be tested.

---

**Next Phase:** Phase 6 (Final Branch Sweep) — inspect HTML coverage report, catch remaining branches.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
