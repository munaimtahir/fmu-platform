# Backend Dashboard Crash

## Problem
`GET /api/dashboard/stats/` failed with 500 Internal Server Error when accessed by a Student user.
Logs showed `AttributeError: type object 'Voucher' has no attribute 'STATUS_PARTIALLY_PAID'`.

## Root Cause
The view `backend/core/views.py` was referencing `Voucher.STATUS_PARTIALLY_PAID` which does not exist. The correct constant is `Voucher.STATUS_PARTIAL`.
It was also referencing `StudentLedgerItem` which was deleted in migration `finance.0002`.

## Fix
Updated `backend/core/views.py` to:
1.  Use `Voucher.STATUS_PARTIAL`.
2.  Use `Voucher` count instead of `StudentLedgerItem` for pending dues.

## Verification
- Backend test `test_dashboard_stats_student_linked` PASSED.
