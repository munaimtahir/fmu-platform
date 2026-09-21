# 12. Runtime Health and Smoke Tests

**Date Executed**: Tue May 5 09:20 UTC 2026

## Endpoints Tested
- **Backend Health** (`/health/` and `/api/health/`): **DEGRADED**. Returns HTTP 200, but JSON shows `"status": "degraded"` with `{"db": {"status": "ok"}, "migrations": {"status": "fail", "pending_count": 21}, "redis": {"status": "ok"}}`.
- **API Docs** (`/api/docs/`): **OK**. Swagger UI loads correctly.
- **Frontend** (`localhost:8080`): **OK**. Returns Vite React index.html.

## Observations
- The backend is successfully connected to the database and Redis.
- There are **21 pending unapplied migrations**. This is a major blocker that explains why the test suite or local dev runs might be failing, and it indicates the docker database is out of sync with the codebase.
- The endpoints are structurally functional and correctly exposed through the Docker network.