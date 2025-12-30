# FMU Platform - Operations Runbook

**Version:** 1.0  
**Last Updated:** 2025-12-30  
**Purpose:** Complete operational guide for running, maintaining, and troubleshooting the FMU Platform MVP

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Environment Variables](#environment-variables)
5. [Database Migrations](#database-migrations)
6. [Common Operational Tasks](#common-operational-tasks)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Health Checks & Monitoring](#health-checks--monitoring)

---

## Prerequisites

### Required Software
- **Docker & Docker Compose** (recommended for deployment)
  - Docker 20.10+
  - Docker Compose 2.0+
  
- **Local Development** (alternative to Docker)
  - Python 3.12+
  - PostgreSQL 14+
  - Redis 6+ (optional, graceful degradation if unavailable)
  - Node.js 20+ (for frontend)

### System Requirements
- **Memory:** 2GB minimum, 4GB recommended
- **Disk:** 10GB free space
- **Network:** Internet access for package installation

---

## Local Development Setup

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment
cp ../.env.example ../.env
# Edit .env with your local database credentials

# Verify Django configuration
python manage.py check

# Create migrations (if needed)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create role groups
python manage.py shell
```

**In Django shell:**
```python
from django.contrib.auth.models import Group

roles = ['ADMIN', 'COORDINATOR', 'FACULTY', 'FINANCE', 'STUDENT', 'OFFICE_ASSISTANT']
for role in roles:
    Group.objects.get_or_create(name=role)
    print(f"✓ Created group: {role}")
exit()
```

```bash
# Create superuser
python manage.py createsuperuser

# Assign superuser to ADMIN group
python manage.py shell
```

**In Django shell:**
```python
from django.contrib.auth.models import User, Group
user = User.objects.get(username='your_username')  # Replace with actual username
admin_group = Group.objects.get(name='ADMIN')
user.groups.add(admin_group)
print(f"✓ Added {user.username} to ADMIN group")
exit()
```

```bash
# Run development server
python manage.py runserver
```

The backend will be available at: http://localhost:8000

### Frontend Setup (Optional)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your backend URL (default: http://localhost:8000)

# Start development server
npm run dev
```

The frontend will be available at: http://localhost:5173

---

## Docker Deployment

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd fmu-platform

# Configure environment
cp .env.example .env
# Edit .env with production values
# IMPORTANT: Set DJANGO_DEBUG=False, generate strong DJANGO_SECRET_KEY

# Build and start services
docker compose up -d --build

# Wait for services to start (10-15 seconds)
sleep 15

# Create migrations
docker compose exec backend python manage.py makemigrations

# Apply migrations
docker compose exec backend python manage.py migrate

# Create role groups
docker compose exec backend python manage.py shell
```

**In Docker shell:**
```python
from django.contrib.auth.models import Group
roles = ['ADMIN', 'COORDINATOR', 'FACULTY', 'FINANCE', 'STUDENT', 'OFFICE_ASSISTANT']
for role in roles:
    Group.objects.get_or_create(name=role)
exit()
```

```bash
# Create superuser
docker compose exec backend python manage.py createsuperuser

# Assign to ADMIN group
docker compose exec backend python manage.py shell
```

**In Docker shell:**
```python
from django.contrib.auth.models import User, Group
user = User.objects.get(username='your_username')
user.groups.add(Group.objects.get(name='ADMIN'))
exit()
```

### Service Management

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Restart backend
docker compose restart backend

# Rebuild after code changes
docker compose up -d --build

# Check service status
docker compose ps
```

### Accessing Services

- **Backend API:** http://localhost:8010 (mapped to 127.0.0.1:8010)
- **Frontend:** http://localhost:8080 (mapped to 127.0.0.1:8080)
- **Admin Panel:** http://localhost:8010/admin/
- **API Documentation:** http://localhost:8010/api/schema/swagger-ui/
- **Health Check:** http://localhost:8010/health/

---

## Environment Variables

### Critical Variables (Must Set)

```bash
# Security
DJANGO_SECRET_KEY=<strong-random-key-50+-characters>
DJANGO_DEBUG=False  # ALWAYS False in production

# Database
DB_NAME=fmu_platform
DB_USER=fmu_platform
DB_PASSWORD=<strong-password>
DB_HOST=db  # 'db' for Docker, 'localhost' for local
DB_PORT=5432
POSTGRES_PASSWORD=<same-as-DB_PASSWORD>

# Allowed Hosts (production domains)
DJANGO_ALLOWED_HOSTS=yourdomain.com,localhost,127.0.0.1

# CSRF & CORS (with HTTPS in production)
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,http://localhost
CORS_ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:5173
```

### Optional Variables

```bash
# Redis (for background jobs - gracefully degrades if unavailable)
REDIS_HOST=redis  # 'redis' for Docker, 'localhost' for local
REDIS_PORT=6379

# JWT Token Lifetimes (in minutes)
JWT_ACCESS_TOKEN_LIFETIME=60        # 1 hour
JWT_REFRESH_TOKEN_LIFETIME=1440     # 24 hours

# Email (for notifications)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend  # Dev
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend   # Prod
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**See `.env.example` for complete list with explanations.**

---

## Database Migrations

### Creating Migrations

```bash
# Local
cd backend
python manage.py makemigrations

# Docker
docker compose exec backend python manage.py makemigrations
```

### Applying Migrations

```bash
# Local
python manage.py migrate

# Docker
docker compose exec backend python manage.py migrate
```

### Checking Migration Status

```bash
# Local
python manage.py showmigrations

# Docker
docker compose exec backend python manage.py showmigrations
```

### Migration Best Practices

1. **Always create migrations before deploying code changes**
2. **Test migrations on a copy of production data first**
3. **Never delete or modify existing migrations** (as per MVP constraints)
4. **Back up database before applying migrations in production**

---

## Common Operational Tasks

### Creating Users

```bash
# Via admin panel (recommended)
# 1. Navigate to http://localhost:8010/admin/
# 2. Log in with superuser credentials
# 3. Go to Users → Add User
# 4. Fill in details and assign to role group

# Via Django shell
docker compose exec backend python manage.py shell
```

```python
from django.contrib.auth.models import User, Group

# Create user
user = User.objects.create_user(
    username='newuser',
    email='user@example.com',
    password='secure_password',
    first_name='First',
    last_name='Last'
)

# Assign to role
role = Group.objects.get(name='FACULTY')  # or ADMIN, COORDINATOR, etc.
user.groups.add(role)
print(f"✓ Created user: {user.username}")
```

### Collecting Static Files

```bash
# Local
cd backend
python manage.py collectstatic --noinput

# Docker (automatically run in entrypoint.sh)
docker compose exec backend python manage.py collectstatic --noinput
```

### Backing Up Database

```bash
# Docker PostgreSQL backup
docker compose exec db pg_dump -U fmu_platform fmu_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker compose exec -T db psql -U fmu_platform fmu_platform < backup_20251230_120000.sql
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Backend only (last 200 lines)
docker compose logs --tail=200 backend

# Database logs
docker compose logs db

# Follow logs in real-time
docker compose logs -f backend
```

---

## Troubleshooting Guide

### Issue: "Connection refused" to database

**Symptoms:** Backend cannot connect to PostgreSQL

**Solutions:**
1. Check database container is running: `docker compose ps`
2. Verify DB_HOST in .env matches service name ('db' for Docker)
3. Check database logs: `docker compose logs db`
4. Ensure POSTGRES_PASSWORD matches DB_PASSWORD in .env
5. Restart database: `docker compose restart db`

### Issue: "ImportError" or "ModuleNotFoundError"

**Symptoms:** Python module cannot be imported

**Solutions:**
1. Verify dependencies installed: `pip list` or rebuild Docker image
2. Check INSTALLED_APPS in settings.py includes all required apps
3. Ensure all app directories have `__init__.py` files
4. Check for circular imports in models
5. Restart backend: `docker compose restart backend`

### Issue: Migration conflicts

**Symptoms:** "Conflicting migrations detected"

**Solutions:**
1. Check migration status: `python manage.py showmigrations`
2. Review migration files for conflicts
3. See MIGRATION_STRATEGY.md for detailed resolution steps
4. **Never delete existing migrations** (per MVP constraints)

### Issue: 403 Forbidden on API endpoints

**Symptoms:** API returns 403 even with valid token

**Solutions:**
1. Verify user is assigned to correct role group
2. Check token is valid and not expired
3. Verify Authorization header format: `Authorization: Bearer <token>`
4. Check CORS_ALLOWED_ORIGINS includes your frontend domain
5. Review permission classes in view

### Issue: Static files not loading

**Symptoms:** Admin panel has no styling

**Solutions:**
1. Run collectstatic: `python manage.py collectstatic --noinput`
2. Check STATIC_ROOT and STATIC_URL in settings.py
3. Verify WhiteNoise middleware is enabled
4. In Docker: ensure volume mapping is correct in docker-compose.yml
5. Check browser console for 404 errors

### Issue: Docker build fails with SSL certificate errors

**Symptoms:** "certificate verify failed" during pip install

**Solutions:**
1. This is typically a network/firewall issue in CI environment
2. For local builds: check network connectivity
3. For CI: may need to configure pip to trust certificates
4. Alternative: build locally and push images to registry

### Issue: Redis connection errors

**Symptoms:** "Error connecting to Redis"

**Solutions:**
1. Redis is **optional** - system should degrade gracefully
2. Check REDIS_HOST and REDIS_PORT in .env
3. Verify redis container is running: `docker compose ps`
4. Background jobs won't work without Redis, but core features will
5. If not using Redis, you can ignore these warnings

---

## Health Checks & Monitoring

### Health Endpoint

```bash
# Check backend health
curl http://localhost:8010/health/

# Expected response
{
  "status": "ok",
  "service": "SIMS Backend",
  "timestamp": "2025-12-30T12:00:00Z"
}
```

### System Checks

```bash
# Run Django system checks
docker compose exec backend python manage.py check

# With deployment checks
docker compose exec backend python manage.py check --deploy
```

### Database Connectivity

```bash
# Test database connection
docker compose exec backend python manage.py dbshell
# Should open PostgreSQL shell
# Type \q to exit
```

### Smoke Test Checklist

- [ ] Health endpoint returns 200: `curl http://localhost:8010/health/`
- [ ] Admin panel loads: Visit http://localhost:8010/admin/
- [ ] Can log in to admin with superuser
- [ ] API endpoint responds: `curl http://localhost:8010/api/academics/programs/`
- [ ] Static files load (admin panel has styling)
- [ ] Database queries work (can view data in admin)

---

## Security Reminders

1. **NEVER** commit `.env` file to git
2. **ALWAYS** use strong, unique DJANGO_SECRET_KEY in production
3. **ALWAYS** set DJANGO_DEBUG=False in production
4. **ALWAYS** use HTTPS in production (configure in Caddy/reverse proxy)
5. **ALWAYS** keep dependencies updated (check for security updates)
6. **ALWAYS** use strong database passwords
7. **ALWAYS** restrict database access to backend only

---

## Production Deployment Notes

When deploying to production:

1. **Use Caddy or nginx as reverse proxy** (see CADDY.md)
2. **Backend binds to 127.0.0.1** (already configured in docker-compose.yml)
3. **Use HTTPS** (Caddy handles TLS automatically)
4. **Set environment-specific values** in .env
5. **Use PostgreSQL** (not SQLite)
6. **Back up database regularly**
7. **Monitor logs** for errors
8. **Set up health checks** in orchestrator/load balancer

---

## Additional Resources

- **Environment Variables:** See `.env.example` and `ENV_CONTRACT.md`
- **Migration Strategy:** See `MIGRATION_STRATEGY.md`
- **Setup Guide:** See `MVP_SETUP_GUIDE.md`
- **Caddy Configuration:** See `CADDY.md`
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`
- **Verification Steps:** See `VERIFICATION_CHECKLIST.md`

---

## Getting Help

1. Check this runbook first
2. Review error messages carefully
3. Check logs: `docker compose logs backend`
4. Review relevant documentation files
5. Verify configuration in `.env` matches requirements

---

**End of Runbook**
