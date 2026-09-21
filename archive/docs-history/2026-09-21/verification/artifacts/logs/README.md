# Log Artifacts

This directory contains Docker logs and service logs captured during verification.

## Required Logs

### Service Status
- `docker_compose_ps.txt` - Output of `docker compose ps`
- `docker_compose_logs_backend.txt` - Backend logs (tail 200)
- `docker_compose_logs_frontend.txt` - Frontend logs (tail 200)

### Migration Logs
- `migrations_apply.txt` - Output of `python manage.py migrate`

### Test Logs
- `backend_tests.txt` - Output of `pytest`
- `frontend_tests.txt` - Output of `npm test`
- `frontend_lint.txt` - Output of `npm run lint`
- `frontend_typecheck.txt` - Output of `npm run type-check`
- `e2e_tests.txt` - Output of `npx playwright test`

## Capture Commands

```bash
# Service status
docker compose ps > artifacts/logs/docker_compose_ps.txt

# Service logs
docker compose logs --no-color --tail=200 backend > artifacts/logs/docker_compose_logs_backend.txt
docker compose logs --no-color --tail=200 frontend > artifacts/logs/docker_compose_logs_frontend.txt

# Migrations
docker compose exec backend python manage.py migrate > artifacts/logs/migrations_apply.txt

# Tests
docker compose exec backend pytest > artifacts/logs/backend_tests.txt
docker compose exec frontend npm test > artifacts/logs/frontend_tests.txt
```

## Status

**Note:** These are placeholder references. Actual logs need to be captured in proper environment with running stack.

---

**Last Updated:** 2026-01-09
