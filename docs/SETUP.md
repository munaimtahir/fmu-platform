# SIMS Setup Guide

This document shows how to run the SIMS project in three modes:
- **Local** (bare Python/Node)
- **Docker** (recommended for development)
- **Production** (Docker + Nginx + SSL)

---

## Prerequisites

- **Python** 3.12+
- **Node.js** 18+
- **PostgreSQL** 14+ (for production) or SQLite (for development)
- **Redis** 6+ (for background jobs)
- **Docker** & Docker Compose v2 (optional but recommended)
- **GNU Make** (optional but recommended)

---

## Quick Start (Docker Development)

```bash
# 1. Clone repository
git clone https://github.com/munaimtahir/Fmu.git
cd Fmu

# 2. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start services
docker compose up --build -d

# 4. Run migrations
docker compose exec backend python manage.py migrate

# 5. Create superuser
docker compose exec backend python manage.py createsuperuser

# 6. Start RQ worker (for background jobs)
docker compose exec backend python manage.py rqworker default
```

**Access Points:**
- Backend API: http://localhost:8000
- Frontend: http://localhost:3000 (if frontend is running)
- Admin Panel: http://localhost:8000/admin
- API Documentation: http://localhost:8000/api/docs (Swagger)
- API Documentation: http://localhost:8000/api/redoc (ReDoc)
- Health Check: http://localhost:8000/health/

---

## Local Development (Without Docker)

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
export DB_ENGINE=django.db.backends.sqlite3
export DB_NAME=db.sqlite3
export DJANGO_SECRET_KEY=your-secret-key-here
export DJANGO_DEBUG=True

# 5. Run migrations
python manage.py migrate

# 6. Create superuser
python manage.py createsuperuser

# 7. (Optional) Load demo data
python manage.py shell < seed/seed_demo_data.py

# 8. Start development server
python manage.py runserver
```

**Start RQ Worker (separate terminal):**
```bash
# Make sure Redis is running
redis-server

# Start worker
cd backend
source .venv/bin/activate
python manage.py rqworker default
```

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit VITE_API_BASE_URL to point to backend (http://localhost:8000)

# 4. Start development server
npm run dev
```

---

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage report
pytest --cov=. --cov-report=html --cov-report=term-missing

# Run specific test file
pytest tests/test_enrollment_crud.py

# Run specific test
pytest tests/test_results_workflow.py::TestResultPublish::test_publish_result

# Check coverage threshold (must be ≥85%)
pytest --cov=. --cov-fail-under=85
```

### Linting & Type Checking

```bash
cd backend

# Ruff linting
ruff check .

# Type checking
mypy .

# Django system checks
python manage.py check
```

---

## Database Management

### Migrations

```bash
# Create new migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations

# Rollback to specific migration
python manage.py migrate <app_name> <migration_name>
```

### Backup & Restore

**Create Backup (PostgreSQL):**
```bash
# Manual backup
pg_dump -h localhost -U sims_user -d sims_db -F c -f backup_$(date +%Y%m%d).dump

# Or use the automated nightly backup workflow
# See .github/workflows/nightly-backup.yml
```

**Restore from Backup:**
```bash
# Using restore script
./restore.sh backup_20251021.sql.gz

# Or manually
gunzip -c backup_20251021.sql.gz | pg_restore -h localhost -U sims_user -d sims_db --clean --if-exists
```

---

## Production Deployment

### Environment Configuration

```bash
# Production .env settings
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<generate-strong-secret-key>
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=sims_db
DB_USER=sims_user
DB_PASSWORD=<strong-password>
DB_HOST=postgres
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Email (configure your SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-email-password

# Legacy Module Configuration (recommended production values)
ENABLE_LEGACY_MODULES=false
ALLOW_LEGACY_WRITES=false
```

**Note**: See [Canonical Modules Documentation](../docs/CANONICAL_MODULES.md) and [Operations Documentation](../docs/OPERATIONS.md) for details on legacy module flags.

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set up Redis for background jobs
- [ ] Configure email backend
- [ ] Set up SSL/TLS certificates
- [ ] Configure Nginx as reverse proxy
- [ ] Set up nightly database backups
- [ ] Configure monitoring and logging
- [ ] Set up systemd services for persistence
- [ ] Implement rate limiting
- [ ] Configure CORS properly
- [ ] Set up media file storage (S3 or similar)

### Docker Compose Production

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Run migrations
docker compose exec backend python manage.py migrate

# Monitor logs
docker compose logs -f backend
```

---

## Troubleshooting

### Common Issues

**Database Connection Error:**
```
Solution: Ensure PostgreSQL is running and credentials are correct
- Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env
- Test connection: psql -h localhost -U sims_user -d sims_db
```

**Redis Connection Error:**
```
Solution: Ensure Redis is running
- Check REDIS_HOST and REDIS_PORT in .env
- Test connection: redis-cli ping (should return PONG)
```

**Migration Conflicts:**
```
Solution: Ensure migrations are linear
- python manage.py showmigrations
- Resolve conflicts by merging or reordering migrations
```

**Import Errors:**
```
Solution: Check PYTHONPATH and virtual environment
- Ensure you're in the backend directory
- source .venv/bin/activate
- pip install -r requirements.txt
```

**Permission Denied on restore.sh:**
```
Solution: Make script executable
- chmod +x restore.sh
```

---

## Additional Resources

- **API Documentation**: http://localhost:8000/api/docs
- **Architecture**: See `Docs/ARCHITECTURE.md`
- **Data Model**: See `Docs/DATAMODEL.md`
- **API Reference**: See `Docs/API.md`
- **Contributing**: See `CONTRIBUTING.md`
- **Data Governance**: See `Docs/DATA-GOVERNANCE.md`
