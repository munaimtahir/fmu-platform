# 19. Risks, Gaps, and Blockers

**Date Executed**: Tue May 5 09:20 UTC 2026

| Risk ID | Severity | Area | Finding | Impact | Recommended Action |
|---------|----------|------|---------|--------|--------------------|
| R01 | P0 | Backend DB | 21 Unapplied Migrations in docker environment. | Degraded health, prevents E2E testing and accurate dev. | Run `python manage.py migrate` in the docker container. |
| R02 | P1 | Testing | 19 Backend Test Failures (faculty imports, wave 2 logic). | Regressions in business logic and file handling. | Fix the underlying causes in `tests/test_faculty_imports.py` and `tests/test_wave2_business_logic.py`. |
| R03 | P1 | Testing | 1 Frontend Test Failure (`axios.test.ts`). | Contract mismatch or env config issue. | Fix Vite URL parsing/stripping logic or update the test. |
| R04 | P2 | Code Quality | 189 Ruff Errors. | CI likely fails; high technical debt. | Run `ruff check --fix .`. |
| R05 | P2 | Deployment | `rqworker` missing from `docker-compose.ps` output. | Background jobs (like transcripts) might hang. | Verify `docker-compose.yml` includes an `rqworker` service. |
| R06 | P4 | Repo Health | Excessive `archive/` directories. | Causes AI/dev confusion and slows down searches. | Add to `.geminiignore` or clean up. |