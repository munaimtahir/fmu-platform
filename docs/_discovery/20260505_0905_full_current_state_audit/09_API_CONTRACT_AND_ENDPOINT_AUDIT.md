# 09. API Contract and Endpoint Audit

**Date Executed**: Tue May 5 09:20 UTC 2026

## Available Endpoints (Partial Snapshot)
Based on runtime validation and code review:
- `/health/` and `/api/health/`: Exposed and working but returning degraded due to migrations.
- `/api/docs/` and `/api/schema/`: OpenAPI UI and schema generation work correctly.
- Application Endpoints: Present across a range of domain modules like students, results, attendance, and finance.

## Auth Contract
- JWT based (via `djangorestframework-simplejwt`).
- Typical tokens: Access and Refresh tokens.

## Mismatches
- Frontend is configured to strip `/api` from a base URL, which fails a test (`axios.test.ts`), suggesting a potential misconfiguration between `VITE_API_URL` and the expected axios prefix.