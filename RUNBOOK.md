# FMU Platform Runbook

This runbook provides step-by-step instructions for running and operating the FMU SIMS platform in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development (without Docker)](#local-development-without-docker)
- [Docker Development](#docker-development)
- [Production Deployment](#production-deployment)
- [Database Migrations](#database-migrations)
- [Common Operations](#common-operations)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Python**: 3.11 or 3.12
- **PostgreSQL**: 16+ (or SQLite for local testing)
- **Redis**: 7+ (optional, for background jobs)
- **Node.js**: 18+ (for frontend)
- **Docker**: 24+ (for containerized deployment)
- **Docker Compose**: 2.20+

### Required Tools

```bash
# Check versions
python --version  # Should be 3.11 or 3.12
docker --version
docker compose version
psql --version
node --version
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/munaimtahir/fmu-platform.git
cd fmu-platform
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` and set the following required variables:

```bash
# Required: Generate a new secret key
DJANGO_SECRET_KEY=your-generated-secret-key-here

# Required: Set strong database password
POSTGRES_PASSWORD=your-secure-password-here
DB_PASSWORD=your-secure-password-here

# Optional: Set debug mode (False for production)
DJANGO_DEBUG=False

# Optional: Add your domain
DJANGO_ALLOWED_HOSTS=yourdomain.com,localhost,127.0.0.1
```

**Generate a Secret Key:**

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

---

## Local Development (without Docker)

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Database

#### Option A: PostgreSQL (Recommended)

```bash
# Create database
createdb fmu_platform

# Update .env
DB_NAME=fmu_platform
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
```

#### Option B: SQLite (Quick Testing)

```bash
# For quick local testing
export DB_ENGINE=django.db.backends.sqlite3
export DB_NAME=/tmp/fmu_db.sqlite3
```

### 3. Run Migrations

```bash
cd backend
python manage.py migrate
```

### 4. Create Superuser

```bash
python manage.py createsuperuser
```

### 5. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 6. Run Development Server

```bash
python manage.py runserver
```

Access the application:
- **Admin Panel**: http://localhost:8000/admin/
- **API Root**: http://localhost:8000/api/
- **API Docs**: http://localhost:8000/api/docs/

### 7. Run Frontend (Optional)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:5173/

---

## Docker Development

### 1. Build and Start Services

```bash
# From repository root
docker compose up -d
```

This starts:
- PostgreSQL database (port 5432, internal)
- Redis (port 6379, internal)
- Backend API (http://127.0.0.1:8010)
- Frontend (http://127.0.0.1:8080)

### 2. Run Migrations

```bash
docker compose exec backend python manage.py migrate
```

### 3. Create Superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

### 4. Collect Static Files

```bash
docker compose exec backend python manage.py collectstatic --noinput
```

### 5. View Logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend
```

### 6. Stop Services

```bash
docker compose down

# Remove volumes (deletes database data)
docker compose down -v
```

---

## Production Deployment

### Prerequisites

- Caddy reverse proxy installed and configured
- PostgreSQL database running
- Redis running (optional but recommended)
- Domain configured with DNS pointing to server

### 1. Build Production Images

```bash
docker compose -f docker-compose.prod.yml build
```

### 2. Start Services

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 3. Run Migrations

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### 4. Create Initial Superuser

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 5. Collect Static Files

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### 6. Configure Caddy

See `CADDY.md` for detailed Caddy configuration.

Basic Caddyfile:

```caddyfile
yourdomain.com {
    encode gzip

    # Frontend
    handle / {
        reverse_proxy localhost:8080
    }

    # Backend API
    handle /api/* {
        reverse_proxy localhost:8010
    }

    # Admin panel
    handle /admin/* {
        reverse_proxy localhost:8010
    }

    # Static files
    handle /static/* {
        reverse_proxy localhost:8010
    }

    # Media files
    handle /media/* {
        reverse_proxy localhost:8010
    }
}
```

### 7. Verify Deployment

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# Check backend logs
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Test API
curl http://localhost:8010/api/
```

---

## Database Migrations

### Creating Migrations

```bash
# Local development
cd backend
python manage.py makemigrations

# Docker
docker compose exec backend python manage.py makemigrations
```

### Applying Migrations

```bash
# Local
python manage.py migrate

# Docker development
docker compose exec backend python manage.py migrate

# Docker production
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Migration Strategy

1. **Never delete migrations** - migrations are the source of truth for database schema
2. **Always create migrations before deploying** - run `makemigrations` in development
3. **Test migrations in staging first** - verify migrations work before production
4. **Backup database before migrations** - always backup production database
5. **Run migrations during maintenance window** - minimize risk to live system

### Checking Migration Status

```bash
# Show all migrations and their status
python manage.py showmigrations

# Check for pending migrations
python manage.py showmigrations | grep "\[ \]"
```

---

## Common Operations

### Creating Test Data

```bash
# Create sample academic periods
docker compose exec backend python manage.py shell
>>> from sims_backend.academics.models import AcademicPeriod
>>> AcademicPeriod.objects.create(name="2024", period_type="YEAR")
```

### Viewing Database Records

```bash
# Access Django shell
docker compose exec backend python manage.py shell

# Example: List all students
>>> from sims_backend.students.models import Student
>>> Student.objects.all()
```

### Backup Database

```bash
# Docker PostgreSQL backup
docker compose exec db pg_dump -U fmu_platform fmu_platform > backup_$(date +%Y%m%d).sql

# Restore from backup (replace YYYYMMDD with the actual date in the filename)
cat backup_YYYYMMDD.sql | docker compose exec -T db psql -U fmu_platform fmu_platform
```

### Viewing Logs

```bash
# Real-time logs
docker compose logs -f backend

# Last 200 lines
docker compose logs --tail=200 backend

# Filter by timestamp
docker compose logs --since 2024-12-30T10:00:00 backend
```

### Restarting Services

```bash
# Restart all services
docker compose restart

# Restart backend only
docker compose restart backend
```

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using port 8010
sudo lsof -i :8010

# Kill process
kill -9 <PID>

# Or use different port in docker-compose.yml
ports:
  - "127.0.0.1:8011:8000"
```

### Issue: Database Connection Refused

**Symptoms:**
```
psycopg2.OperationalError: connection to server at "localhost" failed
```

**Solutions:**

1. **Check PostgreSQL is running:**
   ```bash
   docker compose ps db
   ```

2. **Verify credentials in .env:**
   ```bash
   DB_HOST=db  # Use 'db' for Docker, 'localhost' for local
   DB_PORT=5432
   DB_NAME=fmu_platform
   DB_USER=fmu_platform
   DB_PASSWORD=your_password
   ```

3. **Check database logs:**
   ```bash
   docker compose logs db
   ```

### Issue: Static Files Not Loading

**Symptoms:**
- CSS/JS not loading in admin panel
- 404 errors for `/static/` files

**Solutions:**

1. **Collect static files:**
   ```bash
   docker compose exec backend python manage.py collectstatic --noinput
   ```

2. **Verify static files directory:**
   ```bash
   docker compose exec backend ls -la /app/staticfiles/
   ```

3. **Check WhiteNoise configuration in settings.py:**
   - Verify `STATICFILES_STORAGE` is set
   - Verify `WhiteNoiseMiddleware` is in `MIDDLEWARE`

### Issue: Migrations Not Applied

**Symptoms:**
```
django.db.utils.ProgrammingError: relation "..." does not exist
```

**Solutions:**

1. **Check migration status:**
   ```bash
   docker compose exec backend python manage.py showmigrations
   ```

2. **Apply migrations:**
   ```bash
   docker compose exec backend python manage.py migrate
   ```

3. **If migrations are missing:**
   ```bash
   docker compose exec backend python manage.py makemigrations
   ```

### Issue: Redis Connection Failed

**Symptoms:**
```
redis.exceptions.ConnectionError
```

**Note:** Redis is optional. The system will degrade gracefully without it, but background jobs will be disabled.

**Solutions:**

1. **Verify Redis is running:**
   ```bash
   docker compose ps redis
   ```

2. **Check Redis connection:**
   ```bash
   docker compose exec backend python -c "import redis; r=redis.Redis(host='redis', port=6379); r.ping()"
   ```

3. **If not needed, remove Redis dependency:**
   - Comment out `redis` service in `docker-compose.yml`
   - Remove `- redis` from backend's `depends_on`

### Issue: Docker Build Fails

**Common Causes:**

1. **Network/SSL issues:**
   ```bash
   # Check network connectivity
   docker build --network=host ./backend
   ```

2. **Cache issues:**
   ```bash
   # Rebuild without cache
   docker compose build --no-cache
   ```

3. **Disk space:**
   ```bash
   # Check disk space
   df -h
   
   # Clean Docker system
   docker system prune -a
   ```

### Issue: CORS Errors

**Symptoms:**
- Frontend cannot access API
- Browser console shows CORS errors

**Solutions:**

1. **Update CORS settings in .env:**
   ```bash
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com
   ```

2. **Update CSRF trusted origins:**
   ```bash
   CSRF_TRUSTED_ORIGINS=http://localhost:5173,https://yourdomain.com
   ```

3. **Restart backend after changes:**
   ```bash
   docker compose restart backend
   ```

---

## Additional Resources

- **Deployment Guide**: See `DEPLOYMENT_VERIFICATION.md`
- **Caddy Configuration**: See `CADDY.md`
- **Migration Strategy**: See `MIGRATION_STRATEGY.md`
- **Environment Variables**: See `.env.example`
- **Contributing Guide**: See `CONTRIBUTING.md`

---

## Support

For issues or questions:
1. Check this runbook first
2. Review existing documentation
3. Check application logs
4. Create an issue on GitHub with:
   - Error messages
   - Steps to reproduce
   - Environment details (OS, Docker version, etc.)
