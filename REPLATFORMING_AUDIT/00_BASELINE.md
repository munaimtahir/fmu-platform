# Baseline

- Repository: `/home/munaim/srv/apps/fmu-platform`
- Branch: `main`
- Start SHA: `7a603e95bd0785cfe486d71ad74e25b63b4f3209`
- Worktree: clean at discovery; implementation branch created as `codex/vexel-medsims-identity-generalisation`
- Django check: PASS
- Django migrations: application check could not connect to local PostgreSQL (`sims_user` password authentication failed)
- Backend pytest: PostgreSQL run blocked by the same connection; SQLite fallback completed with existing failures in faculty-import migration setup and finance/results tests
- Frontend type-check: PASS
- Frontend lint: PASS
- Frontend tests: PASS, 49 tests
- Frontend build: PASS
- Docker Compose validation: PASS for development and production files
