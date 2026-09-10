# Production Runbook

## Local Run Steps

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)

### Running with Docker (Recommended)
```bash
# 1. Create .env file
cp .env.example .env

# 2. Build and Start
docker compose up -d --build

# 3. Access (Docker environment)
# Frontend: http://localhost:8080
# Backend Admin (Docker): http://localhost:8010/admin/
# API Health (Docker): http://localhost:8010/api/health/
```

### Running Manually (Development)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env to set DB settings (or use SQLite for dev)
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

#### Frontend
```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

## Server Run Steps

### Deployment
1.  **Clone Repository**:
    ```bash
    git clone <repo_url>
    cd <repo_dir>
    ```

2.  **Configuration**:
    - Ensure `.env` is populated with production secrets.
    - **CRITICAL ENV VARS**:
        - `DJANGO_SECRET_KEY`: Long random string.
        - `DJANGO_DEBUG`: `False`.
        - `POSTGRES_PASSWORD`: Secure password.
        - `DJANGO_ALLOWED_HOSTS`: Comma-separated domain list.

3.  **Start Services**:
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

4.  **Database Migration**:
    ```bash
    docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
    ```

5.  **Static Files**:
    ```bash
    docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
    ```

## Health Checks
- **API Health**: `GET /api/health/` -> `{"status": "ok", ...}`
- **Frontend**: Visit root URL, ensure loading does not error.

## Rollback Steps

> **Corrected 2026-09-11**: this section previously referenced
> `docker-compose.prod.yml`, which is **not** the live file. Production is
> confirmed (direct SSH, 2026-09-10) to run from `docker-compose.yml` + the
> VM's `.env` overrides, via the root-level `backend.sh` / `frontend.sh` /
> `both.sh` scripts (same targets as `ops/deploy.sh`). Live container names
> are `vexel_medsims_backend`, `vexel_medsims_frontend`, `vexel_medsims_db`
> (non-`_prod` names). Live host ports are `18010` (backend API) and `18080`
> (frontend), per `BACKEND_HOST_PORT`/`FRONTEND_HOST_PORT` in the VM's `.env`.

If a deployment via `backend.sh`/`frontend.sh`/`both.sh` fails or the
post-deploy health check reports a problem:

1.  **Note the pre-deploy image ID(s)** the script printed just before the
    `build --no-cache` step (added in the scripts specifically for this —
    look for the `Pre-rebuild image ID` line in the deploy output, or check
    your terminal scrollback / the operator's notes from the session).
2.  **Revert code** to the previous commit if the failure is due to a bad
    code change: `git checkout <prev_commit_sha>`.
3.  **Rebuild and restart** using the same scripts against the reverted code:
    ```bash
    ./both.sh        # both services
    # or, individually:
    ./backend.sh
    ./frontend.sh
    ```
    This runs `docker compose -f docker-compose.yml build --no-cache` and
    `up -d` for the affected service(s), the same as a normal deploy.
4.  **If reverting code isn't enough** (e.g. the git revert doesn't fix it,
    or you need to get back to the exact previous image immediately without
    waiting on a rebuild), retag and redeploy the captured pre-deploy image
    ID directly:
    ```bash
    docker tag <pre-deploy-image-id> vexel_medsims_backend:rollback
    docker compose -f docker-compose.yml stop backend
    docker run -d --name vexel_medsims_backend_rollback \
      --env-file .env vexel_medsims_backend:rollback
    # or point docker-compose.yml's backend image at the tagged image and
    # `docker compose -f docker-compose.yml up -d backend`
    ```
    (substitute `frontend` as needed). This is manual — there is no
    automated rollback command; the captured image ID is only a reference
    point for a human to act on.
5.  **If migrations broke the DB**, restore from backup (always take a DB
    backup before running a deploy — see the maintenance-window procedure
    below).
6.  **Verify** the same way a normal deploy is verified: `curl
    http://127.0.0.1:18010/api/health/` returns `{"status": "ok", ...}`,
    `curl -I http://127.0.0.1:18080/` returns 200/304, and 2-3 real
    user-facing pages load correctly (see "Deploy Dry-Run / Maintenance
    Window Procedure" below).

## Deploy Dry-Run / Maintenance Window Procedure

This is the standard procedure for running `backend.sh` / `frontend.sh` /
`both.sh` against production, including a first supervised "dry run." It
does not apply to `ops/deploy.sh` (a separate git-pull-based CI/CD path).

### 1. Who to notify
- Notify whoever else has production access / is on-call (e.g. in the
  team's chat channel) before starting, with a rough time window (deploys
  typically take a few minutes: stop → rebuild `--no-cache` → restart →
  migrate → collectstatic → health checks).
- If the deploy includes a schema migration, call that out explicitly —
  migrations run automatically as part of `backend.sh`/`both.sh` (Step 5,
  `manage.py migrate --noinput`).
- Post a start message and an end message (success or rollback) so anyone
  watching errors/support channels knows a deploy is in progress.

### 2. Pre-checks
- Confirm which commit/branch is about to be deployed (`git log -1`,
  `git status`) and that it's the intended one.
- Confirm no in-flight user sessions/exams or other time-sensitive activity
  is running, if applicable to the deploy window chosen.
- Confirm `.env` on the server is present and correct — all three scripts
  hard-fail immediately if it's missing.
- Take a DB backup before the deploy, especially if migrations are
  included (there is no automated backup step in `backend.sh`/`both.sh` —
  this is a manual pre-check).
- Confirm `docker ps` shows the expected containers currently healthy
  (`vexel_medsims_backend`, `vexel_medsims_frontend`, `vexel_medsims_db`)
  before touching anything.

### 3. Command sequence
Run from the repo root on the production host:
```bash
# Full stack:
./both.sh

# Or backend/frontend only, if the change is scoped to one side:
./backend.sh
./frontend.sh
```
Watch the output live — each script prints its pre-rebuild image ID(s) for
rollback reference (see Rollback Steps above), runs `build --no-cache`,
restarts the service(s), runs migrations/collectstatic (backend only), and
ends with health checks and a final status block.

### 4. What "success" looks like
The script's own checks are necessary but not sufficient:
- Script exits 0 (no `set -e` abort, no failed health check — backend
  health check now hard-fails the script on anything other than
  `"status": "ok"`).
- `docker compose -f docker-compose.yml ps` shows both containers `Up`.
- Manually visit and confirm 2-3 real, representative pages beyond the raw
  curl checks, e.g.:
  - The login page and a successful login.
  - A core authenticated page (e.g. a dashboard or timetable view).
  - The Django admin panel (`/admin/`) loads and authenticates.
- Confirm `https://sims.vexel.pk/api/health/` (the public URL, not just
  `127.0.0.1`) also returns `"status": "ok"` — this exercises the full
  path through Caddy, not just the container directly.

### 5. Rollback trigger criteria
Trigger the rollback procedure (see "Rollback Steps" above) if, after the
scripted deploy completes, any of the following hold:
- The script itself exited non-zero (container failed to start, health
  check failed, migration failed).
- `/api/health/` reports anything other than `"status": "ok"` (including
  `"degraded"`) once containers have had a reasonable time to settle.
- Any of the manual page checks in step 4 fail (error page, 5xx, blank
  page, broken login) that isn't clearly a pre-existing/unrelated issue.
- Logs (`docker compose -f docker-compose.yml logs -f backend` /
  `frontend`) show repeated errors/crash-looping after restart.

When any trigger fires, follow "Rollback Steps" above using the pre-deploy
image ID(s) the script printed.
