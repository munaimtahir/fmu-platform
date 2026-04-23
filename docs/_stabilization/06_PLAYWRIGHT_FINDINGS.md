# Playwright Findings

## Failing-Before Patterns

- Auth setup wrote storage state to the wrong directory and could leave empty auth state files.
- Global setup looked up ExamCell through dead `/api/users/`.
- Local/CI frontend API origin assumptions could bypass the nginx `/api/` proxy or trigger HTTP-to-HTTPS redirects.
- Forbidden route assertions looked for stale text and sampled lazy-loaded Access Denied pages too early.
- Nav assertions assumed every sidebar item was an anchor; grouped nav parents are buttons.
- Admin email in test data did not match the seeded admin user.

## Environment Noise Removed

- Auth setup now fails fast instead of creating empty auth states.
- Auth state files resolve under `frontend/e2e/auth/.auth`.
- ExamCell setup uses `/api/admin/users/` and role payloads.
- `DJANGO_SECURE_SSL_REDIRECT=False` is wired for local compose and E2E workflow contexts.
- Playwright tests now use the proxy-compatible frontend base URL and backend setup URL.

## Product Defects Found and Fixed

- Transcript verification backend auth boundary was wrong for a public verify route.
- Results publish/freeze FE called dead collection endpoints.
- Student own-ledger backend permission blocked before queryset filtering.
- Attendance mark endpoint imported a removed helper and did not accept the single-record payload used by regression tests.
- Demo seed advertised a voucher scenario but did not create the voucher.

## After-Fix Interpretation

- Critical slices pass: public, auth, ExamCell, RBAC, Faculty, Registrar, Student.
- Full Playwright alias passes: 85/85.
- Remaining E2E gap is admissions submit/review coverage, blocked by missing backend API contract rather than harness instability.
