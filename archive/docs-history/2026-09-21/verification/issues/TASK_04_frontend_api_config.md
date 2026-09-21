# Frontend API Configuration Issue

## Problem
Frontend failed to login or load data in E2E tests and manual screenshot attempts.
Error: `Network Error` or `Timeout`.
Unit Test Failure: `src/api/axios.test.ts` - "should not have /api suffix".

## Root Cause
`frontend/.env` contained:
```
VITE_API_URL=http://localhost:8010/api
```
This caused two issues:
1.  Port 8010 is incorrect for local `python manage.py runserver` (which runs on 8000).
2.  Suffix `/api` combined with axios configuration (which adds `/api` prefix to requests) resulted in double `/api` in URLs (e.g., `http://localhost:8000/api/api/auth/login`).

## Fix
Updated `frontend/.env` to:
```
VITE_API_URL=http://localhost:8000
```

## Verification
- `src/api/axios.test.ts` PASSED.
- E2E Tests PASSED (11/11).
- Screenshots captured successfully.
