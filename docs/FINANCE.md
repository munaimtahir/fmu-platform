# Finance Module Documentation

This document captures the finance module scope and implementation for SIMS.

## Core Entities

### FeeType
Reference codes for fee categories (TUITION, EXAM, LIBRARY, etc.). Each has a code, name, and active status.

### FeePlan
Defines fee amounts for a program + term + fee type combination. Supports one-time or per-term frequency. Only one active plan per combination is allowed.

### Voucher & VoucherItem
Human-facing payment request grouped by student + term. Contains line items (VoucherItem) with fee types and amounts. `total_amount` is a snapshot; truth is derived from ledger.

**Status Flow:**
- `generated` → Initial state when voucher is created
- `partially_paid` → Some payment received but not full amount
- `paid` → Total credits >= voucher total
- `overdue` → Due date passed and still unpaid
- `cancelled` → Voucher cancelled (reversal entries created)

### LedgerEntry
**Source of truth** for all financial transactions. Immutable debit/credit entries. Balance is **always derived**, never stored.

**Entry Types:**
- `debit`: Vouchers, adjustments that increase dues
- `credit`: Payments, waivers, scholarships that reduce dues

**Reference Types:**
- `voucher`: Linked to a voucher creation
- `payment`: Linked to a verified payment
- `adjustment`: Waiver/scholarship/adjustment
- `reversal`: Compensating entry for reversals/refunds

**Key Constraint:** Never delete finance records. Use reversals with compensating ledger entries.

### Payment
Receipt details for payments. Status: `received` → `verified` (posts credit) or `rejected`. Verification creates a credit ledger entry.

**Payment Methods:**
- `cash`: Cash payment
- `bank_transfer`: Bank transfer
- `online`: Online payment gateway
- `scholarship`: Scholarship credit
- `waiver`: Approved waiver

**Reversal Workflow:**
- POST `/api/finance/payments/{id}/reverse/` creates compensating ledger entry
- Payment status set to `reversed` (if status field supports it)
- Affected vouchers reconciled

### Adjustment
Waivers/scholarships/adjustments that credit after approval. Status: `pending` → `approved` (posts credit) or `rejected`.

### FinancePolicy
Gating rules that block actions when outstanding dues exceed thresholds. Rules:
- `BLOCK_TRANSCRIPT_IF_DUES`: Blocks transcript generation
- `BLOCK_RESULTS_IF_DUES`: Blocks result viewing
- `BLOCK_ENROLLMENT_IF_DUES`: Blocks next term enrollment

## Workflows

### Voucher Generation
1. Finance user selects program/term and optionally specific students
2. System finds active fee plans for program+term
3. Creates voucher with line items from fee plans
4. Creates debit ledger entry
5. Voucher status set to `generated` (or `overdue` if due date passed)

### Payment Processing
1. Finance records payment (status: `received`)
2. Finance verifies payment → status: `verified`
3. System creates credit ledger entry
4. Voucher status reconciled (may become `partially_paid` or `paid`)

### Partial Payment Rules
- Voucher status updates: `generated` → `partially_paid` → `paid`
- "Paid" means: total credits linked/allocated >= voucher total
- If allocation is global (not voucher-specific), uses oldest voucher first allocation

### Overpayment Handling
**Option A (Implemented):** Store as unallocated credit balance. When a payment exceeds the voucher total, the excess creates a credit balance. Student summary shows "Credit balance" that can be applied to future vouchers. The ledger truth ensures balance is always derived correctly.

**Implementation Details:**
- Payment verification creates credit ledger entry for full payment amount
- Voucher reconciliation checks if credits >= voucher total (marks as paid)
- Excess credit remains in ledger as unallocated
- Student summary endpoint shows credit balance separately
- Future vouchers can reference this credit balance (manual allocation or auto-allocation can be added later)

### Payment Reversal/Refund
1. POST `/api/finance/payments/{id}/reverse/` with reason
2. System creates compensating ledger entry (debit matching the credit)
3. Payment status set to `reversed`
4. Affected vouchers reconciled
5. Audit record created

### Voucher Cancellation
1. POST `/api/finance/vouchers/{id}/cancel/` with reason
2. System creates reversal ledger entries for voucher debits
3. Voucher status set to `cancelled`
4. Reports exclude cancelled vouchers from dues by default (filter available)

### Term Lock Behavior
- If academic term's `end_date` is in the past: disallow new vouchers, payments, and adjustments for that term
- Admin can override (if `is_superuser`)
- Returns clear error: `TERM_LOCKED`

### Duplicate Prevention
- `receipt_no` must be unique
- If `reference_no` is present, enforce uniqueness per method+reference_no (configurable)
- Backend validation errors with stable codes: `DUPLICATE_RECEIPT`, `DUPLICATE_REFERENCE`

## API Endpoints

### Core CRUD
- `/api/finance/fee-types/` - GET/POST/PATCH (Finance/Admin only)
- `/api/finance/fee-plans/` - GET/POST/PATCH (Finance/Admin only)
- `/api/finance/vouchers/` - GET/POST (Students see own only)
- `/api/finance/payments/` - GET/POST (Students see own only)
- `/api/finance/ledger/` - GET (Read-only, students see own only)
- `/api/finance/adjustments/` - GET/POST (Students see own only)
- `/api/finance/policies/` - GET/POST/PATCH (Finance/Admin only)

### Actions
- `POST /api/finance/vouchers/generate/` - Bulk generate vouchers
- `GET /api/finance/vouchers/{id}/pdf/` - Download voucher PDF
- `POST /api/finance/vouchers/{id}/cancel/` - Cancel voucher (creates reversals)
- `POST /api/finance/payments/{id}/verify/` - Verify/reject payment
- `POST /api/finance/payments/{id}/reverse/` - Reverse payment (refund)
- `GET /api/finance/payments/{id}/pdf/` - Download receipt PDF
- `POST /api/finance/adjustments/{id}/approve/` - Approve/reject adjustment

### Reports
- `POST /api/finance/reports/defaulters/` - Defaulters report (filters: program, term, min_outstanding, status)
- `GET /api/finance/reports/collection/` - Daily collection report (date range, group by method)
- `GET /api/finance/reports/aging/` - Aging report (buckets: 0-7, 8-30, 31-60, 60+ days)
- `GET /api/finance/students/{id}/statement/` - Student ledger statement
- `GET /api/finance/students/{id}/statement/pdf/` - Student statement PDF

### Student Summary
- `GET /api/finance/students/{id}/` - Finance summary + gating flags

## Permissions & Access Control

### Object-Level Permissions
- **Student**: Can only see own vouchers, receipts, ledger entries, adjustments
- **Registrar**: Read-only access to student summaries (no edits)
- **Finance**: Can create/verify/reverse payments, generate vouchers, approve adjustments
- **Admin**: Full access to all finance operations

### Finance Gating
- Transcript generation blocked when outstanding > policy threshold
- Result viewing blocked when outstanding > policy threshold
- Enrollment blocked when outstanding > policy threshold
- Gating flags returned in student summary endpoint

## Demo Scenario (seed_demo)

Enhanced seed creates 5 specific demonstrator students:

1. **STUDENT_PAID** (username: `student`, password: `student123`)
   - Fully paid for Term 1
   - Can access all gated actions

2. **STUDENT_PARTIAL** (username: `student_partial`, password: `student123`)
   - Partially paid (50% of voucher)
   - Voucher status: `partially_paid`
   - May be blocked from gated actions depending on policy

3. **STUDENT_DEFAULTER** (username: `student_defaulter`, password: `student123`)
   - Unpaid, overdue voucher
   - Voucher status: `overdue`
   - Blocked from transcript/results

4. **STUDENT_WAIVER** (username: `student_waiver`, password: `student123`)
   - Approved waiver/scholarship
   - Ledger shows credit entry
   - Can access gated actions

5. **STUDENT_REVERSAL** (username: `student_reversal`, password: `student123`)
   - Has a payment that was reversed/refunded
   - Demonstrates reversal workflow

### Seed Data
- Fee plans for two terms across first two programs:
  - Tuition: 50,000 PKR
  - Exam: 5,000 PKR
  - Library: 2,000 PKR
- Finance policies block transcript/results when outstanding > 0
- 20+ total students with various payment states

### Demo User Credentials
- Admin: `admin` / `admin123`
- Finance: `finance` / `finance123`
- Registrar: `registrar` / `registrar123`
- Student (paid): `student` / `student123`
- Student (partial): `student_partial` / `student123`
- Student (defaulter): `student_defaulter` / `student123`
- Student (waiver): `student_waiver` / `student123`
- Student (reversal): `student_reversal` / `student123`

## Reports

### Defaulters Report
Filters: program (optional), term (required), min_outstanding (default >0), status (optional)
Returns: student, reg_no, outstanding_total, overdue_days, latest_voucher_no, phone/email
CSV export: `?format=csv`

### Daily Collection Report
Date range filters (required): start, end
Group by payment method (cash/bank/online/etc.)
Output: totals + count per method, optional drilldown list

### Aging Report
Buckets: 0-7, 8-30, 31-60, 60+ days
Based on voucher due_date or first unpaid voucher date
Output: counts and amounts per bucket, list view option

### Student Statement
Chronological ledger entries with running totals
Opening/closing balance for selected term or all-time
PDF export available

## Constraints & Business Rules

1. **Immutable Truth**: Never delete finance records. Use reversal/compensating ledger entries.
2. **Balance is Derived**: Never store balance as authoritative truth. Always compute from ledger.
3. **Audit Everything**: Every write action records actor + timestamp + summary (via audit middleware).
4. **Consistent Error Format**: Follow repo's standard error response shape: `{ "error": { "code": "...", "message": "..." } }`
5. **Linear Migrations**: Migrations must apply cleanly on an empty database.
6. **RBAC**: Enforce object-level permissions for student-facing endpoints and strict staff permissions for finance actions.
