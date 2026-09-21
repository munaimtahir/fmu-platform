# Artifact Index

**Date Executed**: Tue May 5 09:20 UTC 2026

## Report Files
- `00_EXECUTIVE_SUMMARY.md`: Executive overview and verdict.
- `01_REPOSITORY_DISCOVERY.md`: Directory structure and major observations.
- `02_BRANCH_AND_GIT_STATUS.md`: Git status and commit context.
- `03_DOCUMENTATION_TRUTHMAP.md`: Alignment of docs vs reality.
- `04_CODEBASE_ARCHITECTURE_MAP.md`: Backend/frontend tech stack breakdown.
- `05_ENVIRONMENT_AND_CONFIG_AUDIT.md`: `.env` and `docker-compose` observations.
- `06_BACKEND_AUDIT.md`: Django backend test failures and code quality.
- `07_FRONTEND_AUDIT.md`: React frontend test status.
- `08_DATABASE_AND_MIGRATION_AUDIT.md`: 21 pending migrations identified.
- `09_API_CONTRACT_AND_ENDPOINT_AUDIT.md`: Available endpoints and auth mechanisms.
- `10_AUTH_RBAC_AND_PERMISSION_AUDIT.md`: Role and access control structure.
- `11_RUNTIME_DOCKER_AUDIT.md`: Docker stack status and missing `rqworker`.
- `12_RUNTIME_HEALTH_AND_SMOKE_TESTS.md`: Degraded health endpoints via CURL.
- `13_FRONTEND_RUNTIME_BROWSER_AUDIT.md`: React frontend successfully served.
- `14_E2E_AND_USER_FLOW_AUDIT.md`: E2E status (Blocked by migrations).
- `15_SECURITY_DRY_AUDIT.md`: Security config and 12 NPM vulnerabilities.
- `16_TEST_RESULTS_AND_COVERAGE.md`: Test summaries.
- `17_CI_CD_AND_WORKFLOW_AUDIT.md`: GitHub actions discovery.
- `18_DATA_GOVERNANCE_AND_AUDIT_LOG_AUDIT.md`: Audit logging (`django-simple-history`).
- `19_RISKS_GAPS_AND_BLOCKERS.md`: P0 and P1 issues.
- `20_RECOMMENDED_NEXT_SPRINTS.md`: Actionable stabilization sprints.
- `21_FINAL_GO_NO_GO_VERDICT.md`: Conditional Go verdict.
- `COMMAND_LOG.md`: Log of executed shell commands.
- `ARTIFACT_INDEX.md`: This file.

## Raw Logs (`raw_logs/`)
- Contains test outputs, migration traces, docker outputs, and git status captures generated during the audit process.