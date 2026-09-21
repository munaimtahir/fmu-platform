# Backend Test Failure

## Problem
`pytest` failed to collect `tests/test_student_dashboard.py`.
Error: `ImportError: cannot import name 'StudentLedgerItem' from 'sims_backend.finance.models'`.

## Root Cause
The test was importing `StudentLedgerItem` which was deleted in migration `finance.0002`.

## Fix
Updated `tests/test_student_dashboard.py` to use `LedgerEntry` and updated test logic.

## Verification
- `pytest tests/test_student_dashboard.py` PASSED.
