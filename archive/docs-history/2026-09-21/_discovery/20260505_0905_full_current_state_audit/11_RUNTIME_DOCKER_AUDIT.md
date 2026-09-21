# 11. Runtime Docker Audit

**Date Executed**: Tue May 5 09:19 UTC 2026

## Docker Version Info
- Docker version 29.4.2
- Docker Compose version v5.1.3

## Stack Status
The Docker Compose stack is currently running (started ~4 days ago).
- `docker compose config --quiet` returned 0 (valid configuration).

### Running Containers
| Name | Image | Service | Status | Ports |
|------|-------|---------|--------|-------|
| `fmu_backend` | `fmu-platform-backend` | `backend` | Up 4 days | `127.0.0.1:8010->8000/tcp` |
| `fmu_db` | `postgres:16-alpine` | `db` | Up 4 days | `127.0.0.1:5432->5432/tcp` |
| `fmu_frontend` | `fmu-platform-frontend` | `frontend` | Up 4 days | `127.0.0.1:8080->80/tcp` |
| `fmu_redis` | `redis:7-alpine` | `redis` | Up 4 days (healthy) | `6379/tcp` |

## Observations & Issues
- **Missing RQ Worker**: The backend requirements include `rq` and `django-rq` for background jobs, and Redis is running. However, there is no separate `rqworker` service shown in `docker compose ps`. If background jobs (like transcript generation) are meant to run, they might be blocked unless the backend container runs the worker concurrently (which is bad practice) or they are missing from `docker-compose.yml`.
- **Exposed Ports**: Backend is available on localhost:8010, Frontend on localhost:8080.
- **Nginx/Caddy**: There is no explicit Nginx or Caddy container in the base `docker-compose.yml` list. The frontend is served likely via an internal Nginx container (as typical for React frontend docker images on port 80), mapped to 8080.
