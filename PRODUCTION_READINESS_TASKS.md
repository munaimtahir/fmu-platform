# Production Readiness Task List (Agent Handoff)

Created: 2026-09-21. Source: readiness review of web app, backend and Android app against
`docs/PROJECT_ENVRIONMENT_CONTEXT.md`.
Read that context doc first. This file does not replace it.

## 0. Ground rules for the agent picking this up

- **Do not create Python venvs, install dependencies, or run backend/DB/Docker work on the laptop.**
  The user directed that all server-side, test-environment and deployment work happens on the VPS VM
  (`ssh test`, repo at `/home/munaim/srv/apps/fmu-platform`). Frontend commands that only need the
  existing `frontend/node_modules` are fine locally. Android work stays on the laptop as per the context doc.
- Live Git state is authoritative. Run `git status`, `git fetch origin`, `git log -5 --oneline` first.
  At time of writing: local `main` = `741d1ce` (behind `origin/main` = `a225b3a`, which is what production runs),
  with 18 uncommitted files (see task P1-3).
- Production stack: `vexel_medsims_*` containers via the canonical `docker-compose.yml` and `./both.sh`
  (never `docker-compose.prod.yml`). Other containers on the VM belong to unrelated apps: never touch them.
- **Never write secrets** (passwords, tokens, keys, DB dumps) into the repo, docs, logs or reports.
- **Ask the user before** any outward-facing or hard-to-reverse action. These are marked `[USER APPROVAL]`:
  rewriting Git history / force-push, changing repo visibility, rotating or disabling accounts,
  production deploys, Caddy changes, deleting backups.
- Mutation checks against production must stay inside rollback-only transactions with a temp `MEDIA_ROOT`.
  Never enqueue Redis jobs during verification.
- Follow the user's commit attribution rule; stage files explicitly (never `git add -A`; `backups/` stays untracked).

Status legend: `[ ]` open, `[~]` in progress, `[x]` done. Update this file as you go.

---

## P0: Release blockers (do first, in this order)

### P0-1 Rotate / disable the shared pilot credentials `[USER APPROVAL]`
**Why:** `pending work.md` states all 8 Frozen Pilot Baseline accounts use the documented baseline
password, and `pilot_admin` is a superuser. Anyone reading the public repo knows it.
**Do:**
- [ ] Ask the user which accounts are still needed and who owns them.
- [ ] On the VM, inside `docker exec -i vexel_medsims_backend python manage.py shell`, set strong unique
      passwords for retained accounts (deliver out-of-band, never in the repo/logs) and set
      `is_active=False` on the rest; demote or remove superuser from `pilot_admin` if it stays.
- [ ] Remove the baseline password from all docs (grep for it; also `seed_pilot_baseline` output and e2e data).
      E2E must read credentials from environment variables, not committed constants.
- [ ] Blacklist outstanding refresh tokens for those users.
**Accept:** no account authenticates with the baseline password (verify by checking password hashes
in the shell with `check_password`, not by logging in over HTTPS); docs contain no reusable password.

### P0-2 Purge production DB dumps from the public repo history `[USER APPROVAL]`
**Why:** `munaimtahir/fmu-platform` is **public**. Eight `backups/*.sql.gz` dumps (60 users' data plus
password hashes) were committed in `741d1ce`; `a225b3a` only deleted them from the tip. They remain in history
and in any clone/fork.
**Do:**
- [ ] Confirm with the user: purge history (`git filter-repo` on a fresh mirror clone, force-push all refs,
      including tags) and/or make the repo private. Ask about forks and cached clones.
- [ ] Verify no other sensitive blobs exist in history: `.jks`, `signing.properties`, `.env`, `*.sql*`,
      auth-state JSON, tokens (use `git log --all --diff-filter=A --name-only`, and a secret scanner).
      `android/play/upload_certificate.pem` is a public certificate and is fine.
- [ ] Treat every password hash in those dumps as leaked: complete P0-1 for every real account and
      rotate `DJANGO_SECRET_KEY` (this invalidates all JWTs; schedule it deliberately).
- [ ] Ensure `backups/` is in `.gitignore` (it is on `origin/main`; confirm) and add a pre-commit or CI check
      that rejects `*.sql`, `*.sql.gz`, `.env`, `*.jks`.
**Accept:** `git log --all -- 'backups/*'` returns nothing on the remote; fresh clone contains no dumps;
user has confirmed the visibility decision.

### P0-3 Ship the API hardening that is currently uncommitted
**Why:** production has **no login/refresh throttling** (committed `settings.py` has no throttle or cache
config). The fix exists as uncommitted local changes.
**Files:** `backend/core/{throttling,metrics,async_ops}.py`, `backend/tests/test_hardening.py`, edits in
`backend/core/views.py`, `backend/sims_backend/{settings,urls,test_settings}.py`, `attendance/input_views.py`,
`faculty/imports/views.py`, `students/imports/views.py`, `notifications/views.py`, `transcripts/views.py`,
`backend/requirements.txt` (adds `prometheus-client`), plus doc edits (`docs/ENV.md`, `docs/OPERATIONS.md`,
`docs/KNOWN_LIMITATIONS.md`, `android/docs/*`, `pending work.md`).
**Do:**
- [ ] Review the diff (`git diff`), run ruff on touched files, and run the full backend suite **on the VM**
      (last local run before this handoff: 417 passed). Do not install anything on the laptop.
- [ ] Before deploying, on the VM check the real `.env`:
      - `EMAIL_BACKEND` must be a real SMTP backend if `DJANGO_ENV=production`, or the new startup guard
        raises `ImproperlyConfigured` and the backend will not boot. Decide with the user: configure SMTP first
        (see P1-1) or adjust the guard.
      - Set `METRICS_TOKEN` (secret, bearer-token protected) or leave metrics disabled.
      - Confirm Redis is reachable; the cache and throttle counters use DB 1
        (`REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`).
- [ ] Re-generate/validate OpenAPI by the delta method in `pending work.md` history (Postgres engine env vars);
      run `backend/scripts/check_openapi_schema.sh` and `python3 android/scripts/check_parity_register.py`.
- [ ] Commit (own commit, clear message), push, then deploy on the VM per the checklist in P0-5. Rebuild and
      restart the worker (`worker` service, container `vexel_medsims_rq_worker`) as well; confirm whether
      `both.sh` does it. If not, run `docker compose -f docker-compose.yml build worker && up -d worker`.
- [ ] Verify after deploy: repeated bad logins return 429; `/api/health/` ok and `version` equals the new SHA;
      `/metrics` requires the bearer token (currently the public URL returns SPA HTML for `/metrics`,
      which means the route is not deployed); worker healthy; no new exceptions in logs.
**Accept:** login throttling proven in production; health green; new SHA live.

### P0-4 Real backup and restore regime on the VM `[USER APPROVAL for schedule/location]`
**Why:** the docs describe `scripts/backup_db.sh` and `scripts/restore_db.sh` but neither exists in the repo;
docs reference old container names (`fmu_db`, `fmu_platform`). Existing backups are manual, on the same VM,
and were leaking into Git.
**Do:**
- [ ] Write `scripts/backup_db.sh` and `scripts/restore_db.sh` for the real names
      (`vexel_medsims_db`, `POSTGRES_USER`/`POSTGRES_DB` from the container env; no passwords on the
      command line or in logs). Include `gzip -t` verification and retention.
- [ ] Also back up `backend/media` (uploaded documents, compliance files), not only the DB.
- [ ] Schedule (systemd timer or cron on the VM) and ship copies **off-host** (object storage or another
      machine). Ask the user for the destination and encryption approach.
- [ ] Rehearse a full restore into a throwaway Postgres on an unused port (recipe is in git history of
      `pending work.md`; use `127.0.0.1:15499`, remove the container afterwards) and record the RPO/RTO.
- [ ] Fix `docs/OPERATIONS.md` backup/restore sections to match reality.
**Accept:** a scheduled job produced a verified dump plus media archive off-host, and a restore rehearsal
succeeded and is documented.

### P0-5 Standard deploy and rollback checklist (use for every production release)
Follow section 8.3 of the old handoff (in git history of `pending work.md`, commit `93be5ed`..`3f0bfa4`) and
`docs/PRODUCTION_RUNBOOK.md`:
- [ ] Preflight: branch, HEAD, `git status` on the VM, container state, `/api/health/`, disk space.
- [ ] Tag rollback images (`fmu-platform-backend:rollback-<sha>`, frontend and worker too), take a verified backup.
- [ ] `./both.sh`, then rebuild/restart the worker, then verify health/version/logs/permission-task count (179).
- [ ] Record results. On failure: re-tag rollback images and restart; restore DB only if a migration caused DB damage.

---

## P1: Should be done before real users

### P1-1 Email delivery
- [ ] Configure a real SMTP backend on the VM (`EMAIL_BACKEND`, host, user, from-address; secrets only in the
      VM `.env`). Send test messages: transcript email and a notification with `send_now`.
- [ ] Confirm the RQ worker processes the email/notification jobs; add a failed-job visibility check.
**Accept:** delivered test email observed; docs updated (currently "unverified in production-like environment").

### P1-2 Restrict public surface via Caddy `[USER APPROVAL]`
Currently publicly reachable: `/api/schema/`, `/api/docs/` (Swagger/Redoc), `/admin/login/`.
- [ ] Decide with the user: require auth/IP allow-list for schema/docs and the Django admin.
- [ ] Follow the Caddy rule in the context doc: edit `/home/munaim/srv/config/caddy/CaddyFile` first, validate,
      sync to `/etc/caddy/Caddyfile`, reload, verify all production routes stay healthy.
- [ ] Set `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` and CSRF trusted origins to `sims.vexel.pk` only on the
      VM; remove stale hard-coded IPs from `docs/ENV.md` defaults. Confirm `DJANGO_DEBUG=False` on the VM.

### P1-3 Reconcile Git state
- [ ] Local `main` is behind `origin/main` and has uncommitted changes; fast-forward safely (do not discard the
      uncommitted work; it is P0-3). Confirm the VM checkout equals `origin/main` and is clean.
- [ ] Refresh stale docs: `docs/KNOWN_LIMITATIONS.md` (Student/Faculty dashboards now call
      `/api/dashboard/stats/`; test-hang claims did not reproduce), `docs/ENV.md`, and
      `ANDROID_AUDIT/FINAL_REPORT.md` (still says "FOUNDATION: NOT READY").

### P1-4 Data-seeded end-to-end verification (isolated stack on the VM)
**Why:** production holds zero business data; mutation flows have never run end to end.
- [ ] Build a disposable stack on the VM (unused ports, own Postgres, temp `MEDIA_ROOT`, own secret key).
      Never use `docker-compose.dev.yml` (it binds host 5432, loads the production `.env`, and mounts
      production media). See old handoff section 8.1.
- [ ] Seed demo/timetable data as `.github/workflows/e2e.yml` does, then run the full Playwright suite and the
      new workflow specs from P2-1.
- [ ] Tear everything down afterwards.

### P1-5 Monitoring and alerting
- [ ] After P0-3, scrape `/metrics` with Prometheus (or equivalent) using the bearer token.
- [ ] Add uptime checks on `/api/health/` and alerts for: health degraded, RQ queue depth, failed jobs, disk
  above 85%, backup job failure, certificate expiry.

### P1-6 Documentation consolidation and cleanup
**Why:** The repository contains multiple overlapping runbooks, generated admin reports, one-time
verification packs, discovery dumps, and superseded instructions. These make it difficult to identify
the current operational truth and increase the chance of following obsolete deployment or security guidance.

- [x] Create a single active documentation index in `docs/README.md`.
- [x] Move historical report trees and one-time documentation out of the active `docs/` surface into
      `archive/docs-history/2026-09-21/`, with an archive disclaimer and inventory.
- [x] Update surviving links and source comments that referenced the moved active paths.
- [x] Move superseded setup, architecture, CI/CD, security-deployment, user-guide, verification, and
      root-level runbook guides into `archive/docs-history/2026-09-21/superseded-guides/`.
- [ ] Review remaining root-level API summaries and historical audits and either reconcile them with
      the canonical docs or move them to the archive.
- [ ] Update current documentation after every readiness milestone: security exposure, SMTP/worker,
      backups/RPO/RTO, deployment/rollback, monitoring, web/backend tests, and Android acceptance.
- [ ] Remove stale credentials, URLs, container names, compose commands, dates, and superseded claims
      from all active documentation.
- [ ] Add a documentation reference/link check to the release gate and document the rule that generated
      one-time reports and session artifacts do not belong in active documentation paths.

**Accept:** a new contributor can identify the current setup, security, deployment, backup, testing,
and Android-release procedures from `docs/README.md`; archived material is clearly non-authoritative;
active documentation contains no stale secret or deployment guidance.

---

## P2: Web app quality gaps

### P2-1 Replace the placeholder web tests
`frontend/parity/workflows/*.json`: 45 of 47 workflows cite `src/workflowSmoke.test.tsx` (two assertions about
landing paths and route registry). Only 9 of 113 page/feature files have sibling tests. The 104 Playwright tests
are mostly page-load and access-denial checks on an empty DB.
- [ ] Per workflow, write real Vitest tests (permission-gated buttons, confirmation flows with required reason,
      field-level validation errors, upload/download calls, 401/403/404/error states) and point the workflow's
      `tests` entry at them. Priorities: finance (voucher, payment verify/reverse, cancel), results
      (publish/freeze/corrections), compliance review, exams/gradebook, RBAC, people/students.
- [ ] Extend `scripts/check_web_parity.py --strict` to reject a shared smoke file as the sole test for a
      workflow.
- [ ] Add Playwright mutation specs (run only in the isolated stack, P1-4) for at least one write per major
      module and per role.
- [ ] Configure frontend coverage reporting (Vitest coverage) and set a floor.

### P2-2 Known web bugs and gaps
- [ ] `frontend/src/pages/admin/StudentsImportPage.tsx:291`: "View details" is a `console.log` no-op. Build the
      job-detail dialog (status, counts, per-row errors, error CSV download).
- [ ] `frontend/src/pages/ProfilePage.tsx:177`: session management is a `TODO`. Implement (list/revoke sessions
      if the backend supports it; otherwise remove the placeholder and document).
- [ ] Transcripts: add a preview UI and job-status polling for enqueued generation
      (`services/transcripts.ts` already handles `job_id`).
- [ ] Voucher cancel: replace the `[REVERSED]` note convention with a real reversal marker in the data model, so
      cancelling a voucher that had a reversed payment is safe; then revisit the `PAYMENTS_EXIST` guard.
- [ ] Timetable recurrence (deferred by design; confirm with the user whether it is in scope).
- [ ] Standardise remaining direct API calls onto the service layer.

### P2-3 Backend quality
- [ ] Measure backend coverage on the VM and raise it toward the documented 80% target; re-enable or delete the
      `tests_disabled/` files.
- [ ] Fix `utcnow()` and naive-datetime warnings in `sims_backend/finance/pdf.py` and the finance tests.
- [ ] Resolve the 4 uncollectable `sims_backend/` test files (package-name collision) if still present.
- [ ] Legacy modules (enrollment, assessments, requests) are gated off: decide to remove or finish migration.

---

## P3: Android app (work on the laptop; backend changes go through the VM flow)

Current: 1.2.0 (versionCode 6) is a signed candidate, **not submitted**. Only 1.0.4 (Student) was uploaded to
internal testing. Evidence below comes from repo docs, not re-run.

### P3-1 Re-validate against the current backend
- [ ] 1.2.0 was verified against backend `5fb8d8b`. Production is now on the task-based RBAC model
      (`/api/core/users/me/` returns effective roles/tasks; learning/notifications/transcripts task-gated;
      voucher cancel; biometric gate). Run the Android unit tests, lint, and the 20 instrumented tests on the `sims`
      AVD, then smoke each role against the current API (read-only, or rollback-only transactions on the VM).
- [ ] Update `android/api/openapi-current.yaml` only via the delta method and keep it byte-identical to
      `docs/openapi-schema.yaml`.

### P3-2 Staff-role acceptance
Only Faculty has a recorded production acceptance. Produce evidence (sanitised emulator screenshots, API
contract results) for Registrar, Coordinator, ExamCell, Finance and Admin, and record it in
`android/play/RELEASE_CHECKLIST_1.2.0.md` and `ANDROID_AUDIT/`.

### P3-3 Test depth
- [ ] The parity register has 1–2 tests per workflow and there are 11 unit test files. Add ViewModel and
      repository tests for staff workflows (confirmation flows, permission-denied and error states, pagination).
- [ ] Add the missing pieces to the register so "implemented" cannot pass with a single smoke test.

### P3-4 Missing features
- [ ] Office Assistant: no Android workflow. Decide scope with the user, then implement from the web
      `routeAccess` for that role.
- [ ] Import-job history/status screens and transcript-enqueue polling (both listed as deferred in
      `android/docs/API_CONTRACT.md`).
- [ ] Push notifications (none exist; no Firebase). Needs a backend device-token endpoint and a Play data-safety
      update, so confirm scope first.
- [ ] Expanded/tablet layouts beyond the minimal adaptive layout; test an older supported API level as well as
      API 36.
- [ ] Offline reads via Room/WorkManager (offline writes are forbidden by policy).

### P3-5 Release housekeeping
- [ ] Close the unticked "Post-approval TODO" items for 0.1.0 in `android/play/PLAY_RELEASE_HISTORY.md`.
- [ ] Decide the Play rollout plan for 1.1.0/1.2.0. Play Console upload is manual and operator-controlled;
      reuse the existing upload key from `$HOME/.config/vexel/medsims-signing/` and never commit signing material.
- [ ] Consider splitting the large staff screen files for maintainability
      (`StaffScreens.kt`, `OperationalToolScreens.kt`).

---

## Suggested execution order
1. P0-1 and P0-2 (security exposure), with user approvals.
2. P0-3 with P1-1 (email must be decided before the hardening deploy), then P0-5 for the deploy itself.
3. P0-4 (backups).
4. P1-6 documentation consolidation after each operational change, with the final link/reference check
   before release sign-off.
4. P1-2, P1-3, P1-5.
5. P1-4 together with P2-1, then P2-2 and P2-3.
6. P3 after the backend is stable.

## Reporting back
When you finish a task, tick it here, add a one-line result and evidence (command, commit SHA, health output),
and note any deviation from the plan. Never paste secrets into this file.
