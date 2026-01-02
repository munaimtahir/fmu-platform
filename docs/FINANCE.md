# Finance Module Plan

This document captures the finance module scope implemented for SIMS.

## Core entities
- **FeeType**: reference codes (TUITION, EXAM, LIBRARY, etc).
- **FeePlan**: fee amount per program + term + fee type.
- **Voucher** / **VoucherItem**: human-facing payment request with line items.
- **LedgerEntry**: source-of-truth debits/credits (balance is derived).
- **Payment**: receipts against vouchers (verified -> credit).
- **Adjustment**: waivers/scholarships that credit after approval.
- **FinancePolicy**: gating rules for transcripts/results/enrollment.

## Workflows
- Generate vouchers from active fee plans for a program/term (bulk or student-specific).
- Record and verify payments to create ledger credits and update voucher status.
- Approve adjustments to credit ledgers without mutating voucher totals.
- Finance gating: outstanding dues block transcript generation and student result visibility.

## API surface (DRF)
- `/api/finance/fee-types/` CRUD
- `/api/finance/fee-plans/` CRUD
- `/api/finance/vouchers/` list/create + `POST /generate/` + `GET /{id}/pdf/`
- `/api/finance/payments/` create + `POST /{id}/verify/` + `GET /{id}/pdf/`
- `/api/finance/ledger/` read-only
- `/api/finance/adjustments/` CRUD + `POST /{id}/approve/`
- `/api/finance/policies/` CRUD
- `/api/finance/students/{id}/` finance summary + gating flags
- `/api/finance/reports/defaulters/`

## Demo scenario (seed_demo)
- Creates finance/finance123 user.
- Fee plans for two terms across first two programs (tuition 50,000; exam 5,000; library 2,000).
- 20 seeded students with Term 1 vouchers:
  - 10 fully paid
  - 5 partially paid
  - 5 unpaid/overdue (defaulters)
- Finance policies block transcript/results when outstanding > 0.
- Sample logins:
  - Admin: `admin/admin123`
  - Finance: `finance/finance123`
  - Registrar: `registrar/registrar123`
  - Student (clear): `student/student123`
  - Student (defaulter): `student_defaulter/student123`
