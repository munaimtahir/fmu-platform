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
If deployment fails:
1.  Revert code to previous commit: `git checkout <prev_commit_sha>`
2.  Rebuild: `docker compose -f docker-compose.prod.yml up -d --build`
3.  If migrations broke DB, restore from backup (always backup before deploy!).
