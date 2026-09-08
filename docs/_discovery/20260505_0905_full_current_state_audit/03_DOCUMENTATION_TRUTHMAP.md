# 03. Documentation Truthmap

**Date Executed**: Tue May 5 09:20 UTC 2026

| Claim | Status | Notes |
|-------|--------|-------|
| Tech stack (Django/React) | CONFIRMED BY CODE | Present in `requirements.txt` and `package.json`. |
| Services (DB, Redis, Backend, Frontend) | CONFIRMED BY RUNTIME | All running in docker, except for missing `rqworker`. |
| Exposed Ports (8000, 8080) | CONFIRMED BY RUNTIME | Mapped correctly (8010 for backend, 8080 for frontend). |
| Docker Compose | CONFIRMED BY RUNTIME | Stack boots successfully. |
| Health Endpoints (`/health/`) | CONFIRMED BY RUNTIME | Both `/health/` and `/api/health/` work. |
| 100% Test Pass Rate | CONTRADICTED BY CODE | 19 failing tests in backend, 1 in frontend. |
| No Pending Migrations | CONTRADICTED BY RUNTIME | Health endpoint flags 21 pending migrations. |
| RQ Worker active | CONTRADICTED BY RUNTIME | No `rqworker` service in `docker compose ps`. |