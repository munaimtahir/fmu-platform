# Finance Module Specification

## Purpose + Boundaries

**Purpose:** Financial governance, billing, and compliance.

**Owns:**
- FeeStructure (FeePlan), LedgerEntry (immutable debit/credit)
- Invoice/Receipt (Voucher), Concession/Scholarship (Adjustment), Refund (reversal entries)
- Financial reports

**Explicit Exclusions:**
- Finance does NOT control: enrollment, attendance, exams, result publishing

**Locked Decision:** Finance is ledger-based and fully audited; academic decisions are never implicitly blocked by payment state unless policy explicitly says so.

## Models

### FeeType
- `code`: CharField, unique
- `name`: CharField
- `is_active`: BooleanField

### FeePlan (FeeStructure)
- `program`: ForeignKey(Program)
- `term`: ForeignKey(AcademicPeriod)
- `fee_type`: ForeignKey(FeeType)
- `amount`: DecimalField
- `is_mandatory`: BooleanField
- `frequency`: CharField (one_time, per_term)
- `is_active`: BooleanField

### LedgerEntry (Immutable)
- `student`: ForeignKey(Student)
- `term`: ForeignKey(AcademicPeriod)
- `entry_type`: CharField (debit, credit)
- `amount`: DecimalField
- `currency`: CharField
- `reference_type`: CharField (voucher, payment, adjustment, waiver, scholarship, reversal)
- `reference_id`: CharField
- `description`: TextField
- `voucher`: ForeignKey(Voucher), optional
- `created_by`: ForeignKey(User)
- `voided_at`: DateTimeField (for reversals)
- `void_reason`: TextField

### Voucher (Invoice)
- `voucher_no`: CharField, unique
- `student`: ForeignKey(Student)
- `term`: ForeignKey(AcademicPeriod)
- `status`: CharField (generated, partially_paid, paid, overdue, cancelled)
- `issue_date`: DateField
- `due_date`: DateField
- `total_amount`: DecimalField

### Payment
- `voucher`: ForeignKey(Voucher)
- `amount`: DecimalField
- `payment_method`: CharField
- `reference_number`: CharField
- `status`: CharField (pending, verified, rejected)

### Adjustment (Concession/Scholarship)
- `student`: ForeignKey(Student)
- `term`: ForeignKey(AcademicPeriod)
- `kind`: CharField (waiver, scholarship, discount)
- `amount`: DecimalField
- `status`: CharField (pending, approved, rejected)

## APIs

### `/api/finance/fee-types/`
- CRUD with `finance.fee_types.*` permissions

### `/api/finance/fee-plans/`
- CRUD with `finance.fee_plans.*` permissions

### `/api/finance/ledger-entries/`
- Read-only list with `finance.ledger_entries.view`
- Filters: `student`, `term`, `entry_type`

### `/api/finance/vouchers/`
- CRUD with `finance.vouchers.*` permissions
- Special: `generate/` - Generate voucher from fee plans

### `/api/finance/payments/`
- CRUD with `finance.payments.*` permissions
- Special: `verify/`, `reject/`, `reverse/`

### `/api/finance/adjustments/`
- CRUD with `finance.adjustments.*` permissions
- Special: `approve/`, `reject/`

## Workflows / State Machines

**Voucher Status:**
- `generated` → `partially_paid` → `paid`
- Can become `overdue` or `cancelled`

**Payment Status:**
- `pending` → `verified` or `rejected`

**Adjustment Status:**
- `pending` → `approved` or `rejected`

## Validations + Conflict Handling

- Ledger entries are immutable (use reversals for corrections)
- All financial entries must generate ledger entries
- Reversals create new ledger entries with opposite sign

## Frontend Screens

### Admin Screens
- Fee plan management
- Voucher generation
- Payment processing
- Financial reports

### Student Screens
- View own vouchers and payments
- View ledger/statement

## Tests Required

1. CRUD tests
2. Ledger entry generation tests
3. Voucher generation tests
4. Payment verification tests
5. Adjustment approval tests
6. Reversal workflow tests
