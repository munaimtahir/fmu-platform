# Issues Index

**Date:** 2026-01-10
**Status:** All Critical Issues FIXED.

## Fixed Issues

### [TASK_27_students_create_405.md](./issues/TASK_27_students_create_405.md)
- **Problem:** `POST /api/students/students/` returned 405 Method Not Allowed.
- **Root Cause:** Wrong URL path (should be `/api/students/`) AND 500 Internal Server Error masked as 405/400.
- **Underlying Cause:** Missing columns `enrollment_year` in `students_student` table due to missing migration.
- **Fix:** Created migration `students/migrations/0005...` and applied it. Verified student creation via curl.

### [Frontend API Configuration](./issues/TASK_04_frontend_api_config.md) (Implicit)
- **Problem:** Frontend E2E and Login failed with Network Error / Timeout.
- **Root Cause:** `frontend/.env` had `VITE_API_URL=http://localhost:8010/api`. Backend was on 8000. Code added extra `/api`.
- **Fix:** Updated `frontend/.env` to `http://localhost:8000`. Verified via E2E.

### [Backend Dashboard Crash](./issues/TASK_32_dashboard_crash.md) (Implicit)
- **Problem:** `GET /api/dashboard/stats/` failed with `AttributeError` for Student user.
- **Root Cause:** View referenced deleted `StudentLedgerItem.STATUS_PENDING` and invalid `Voucher` status.
- **Fix:** Updated `backend/core/views.py` to use `Voucher` model and correct constants.

### [Backend Test Failure](./issues/TASK_53_backend_test_fail.md) (Implicit)
- **Problem:** `test_student_dashboard.py` failed import.
- **Root Cause:** Import from deleted model.
- **Fix:** Updated test to use `LedgerEntry`.

## Open Issues
None.
