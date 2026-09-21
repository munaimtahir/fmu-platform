# Runtime Reset Report (Phase B)

## Status
**Completed** — runtime state reset to a clean baseline after verified snapshot.

## Actions Executed
1. Stopped project-local runtime stack (`docker compose down` and targeted container cleanup for `fmu_*` only).
2. Removed project DB volume: `fmu-platform_fmu_db_data` (full destructive DB reset).
3. Cleared runtime-generated file state:
   - `backend/media/*`
   - `backend/staticfiles/*`
4. Recreated infrastructure and backend:
   - `docker compose up -d db redis backend`
5. Rebuilt database baseline:
   - `python manage.py migrate --noinput`
6. Reseeded required system baseline data:
   - `python manage.py create_role_groups`
7. Created minimal verification accounts by role (non-demo):
   - `pilot_admin`, `pilot_registrar`, `pilot_examcell`, `pilot_coordinator`, `pilot_faculty`, `pilot_finance`, `pilot_student`, `pilot_office`

## Post-Reset Data State (Key Counts)
- `auth_user=8`
- `auth_group=8`
- `students_student=0`
- `attendance_attendance=0`
- `results_resultheader=0`
- `finance_voucher=0`
- `demo_users=0`

## Outcome
- Test/demo transactional data removed from runtime baseline.
- Demo-marked accounts removed.
- Clean migration-built baseline established.
- Minimal role-based accounts intentionally recreated for verification/pilot checks.
