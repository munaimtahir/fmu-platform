# Cleanup Sprint Reset Scope (Phase A)

## Objective
Perform a destructive-but-safe cleanup to remove test/demo/runtime clutter and rebuild a trusted clean baseline without adding features.

## Scope Boundaries
- **In scope:** runtime reset (DB/media/cache/artifacts), repository clutter cleanup, and truth-aligned verification/reporting.
- **Out of scope:** feature additions, UI beautification, architecture rewrites, speculative refactors.

## Environment Safety Constraints
- This host contains multiple active Docker stacks unrelated to this repository.
- Destructive operations are restricted to **project-local resources only**:
  - Containers: `fmu_db`, `fmu_backend`, `fmu_frontend`, `fmu_redis` (and dev variants if present)
  - Volumes: `fmu-platform_fmu_db_data` (and project-specific runtime outputs in repo tree)
- No global docker prune / broad host cleanup.

## Pre-Reset Audit Summary
- Runtime artifacts present:
  - `frontend/playwright-report/`
  - `frontend/test-results/`
  - `e2e-results.json`
  - `frontend/e2e-results.json`
  - `docs/verification/artifacts/**`
  - `docs/admin-runtime-report/screenshots/**`
- DB contains demo/test markers:
  - `auth_user=54`, `students_student=44`
  - demo markers: `demo_users=22`, `demo_students=20`
- Runtime media currently minimal (`backend/media` nearly empty), but still treated as resettable runtime state.

## Backup/Snapshot Verification (Required Before Purge)
- Snapshot path:
  - `/home/munaim/.copilot/session-state/c7848e9d-4a04-4303-8312-46b1cfa8b1f7/files/backups/fmu-cleanup-20260421T052107Z`
- Captured:
  - PostgreSQL dump: `pre_cleanup.dump`
  - Media archive: `backend-media.tgz`
  - Compose/env snapshots: `docker-compose.yml`, `docker-compose.dev.yml`, `.env.snapshot`
  - Working tree snapshot: `git-status-before-reset.txt`
  - Integrity file: `checksums.sha256`
- Snapshot pointer:
  - `/home/munaim/.copilot/session-state/c7848e9d-4a04-4303-8312-46b1cfa8b1f7/files/backups/LATEST_SNAPSHOT_PATH.txt`

Destructive reset can proceed after matrix approval recorded in `01-preserve-vs-delete-matrix.md`.
