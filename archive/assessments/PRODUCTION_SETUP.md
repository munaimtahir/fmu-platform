# FMU SIMS - Production Setup Guide

This guide will help you set up FMU SIMS for production deployment behind Caddy.

## Prerequisites

- Docker and Docker Compose installed
- Caddy configured on host to proxy to `127.0.0.1:8010`
- Domain `sims.alshifalab.pk` pointing to your server

## Quick Start

### 1. Environment Configuration

The production `.env` file has been created with secure defaults. Review and update if needed:

```bash
# Review the .env file
cat .env

# If you need to regenerate the secret key:
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 2. Run Production Setup

The setup script will:
- Start all Docker services (PostgreSQL, Redis, Backend)
- Run database migrations
- Collect static files
- Create superuser and seed demo data

```bash
# Make script executable (if not already)
chmod +x scripts/setup_production.sh

# Run the setup
./scripts/setup_production.sh
```

### 3. Verify Services

```bash
# Check all services are running
docker compose ps

# Check backend logs
docker compose logs -f backend

# Test health endpoint
curl http://localhost:8010/health/
```

## Default Login Credentials

After running the setup script, you can log in with:

### Admin User
- **Username:** `admin`
- **Password:** `admin123`
- **Access:** Full admin access to Django admin and API

### Registrar User
- **Username:** `registrar`
- **Password:** `registrar123`
- **Access:** Registrar-level permissions

### Faculty Users
- **Username:** `faculty1`, `faculty2`, etc.
- **Password:** `faculty123`
- **Access:** Faculty-level permissions

### Student Users
- **Username:** `student1`, `student2`, etc.
- **Password:** `student123`
- **Access:** Student-level permissions

**⚠️ IMPORTANT:** Change these default passwords in production!

## Manual Setup (Alternative)

If you prefer to set up manually:

```bash
# 1. Start services
docker compose up -d

# 2. Wait for services to be healthy
sleep 15

# 3. Run migrations
docker compose exec backend python manage.py migrate

# 4. Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# 5. Create superuser (interactive)
docker compose exec -it backend python manage.py createsuperuser

# 6. Seed demo data (optional)
docker compose exec backend python manage.py seed_demo --students 30
```

## Service Management

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f redis
```

### Restart Services
```bash
docker compose restart backend
```

## Database Management

### Access Database
```bash
docker compose exec postgres psql -U sims_user -d sims_db
```

### Backup Database
```bash
docker compose exec postgres pg_dump -U sims_user sims_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
docker compose exec -T postgres psql -U sims_user sims_db < backup.sql
```

## Reseeding Demo Data

To clear and reseed demo data:

```bash
# Clear existing data and reseed with 30 students
docker compose exec backend python manage.py seed_demo --clear --students 30

# Or just add more students (without clearing)
docker compose exec backend python manage.py seed_demo --students 50
```

## Production Checklist

Before going live:

- [ ] Review and update `.env` file with production values
- [ ] Change default passwords for all demo users
- [ ] Configure email settings in `.env` (SMTP)
- [ ] Verify Caddy is configured to proxy to `127.0.0.1:8010`
- [ ] Ensure Caddy sets `X-Forwarded-Proto: https` header
- [ ] Test HTTPS access at `https://sims.alshifalab.pk`
- [ ] Test admin panel at `https://sims.alshifalab.pk/admin/`
- [ ] Test API at `https://sims.alshifalab.pk/api/`
- [ ] Set up database backups
- [ ] Configure monitoring and logging

## Troubleshooting

### Services won't start
```bash
# Check logs
docker compose logs

# Check if ports are in use
netstat -tulpn | grep -E '8010|5432|6379'
```

### Database connection errors
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Test connection
docker compose exec backend python manage.py dbshell
```

### Static files not loading
```bash
# Recollect static files
docker compose exec backend python manage.py collectstatic --noinput --clear
```

### Can't access admin panel
- Verify `DJANGO_ALLOWED_HOSTS` includes your domain
- Verify `CSRF_TRUSTED_ORIGINS` includes `https://sims.alshifalab.pk`
- Check Caddy is proxying correctly
- Check backend logs: `docker compose logs backend`

## Support

For more information, see:
- [Operations Guide](docs/OPERATIONS.md)
- [Security Deployment Guide](docs/SECURITY_DEPLOYMENT.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)

