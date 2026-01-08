# Operations Runbook

## System Architecture

The SIMS system consists of the following services:

### Core Services
- **Backend (Django):** REST API on port 8000 (exposed on 127.0.0.1:8010)
- **Frontend (React/Vite):** UI on port 5173 (dev) / served by frontend container (prod)
- **PostgreSQL:** Database on port 5432
- **Redis:** Cache and message broker on port 6379
- **RQ Worker:** Background task processor
- **Caddy (Host-level):** Reverse proxy on host, handles TLS termination (not in Docker)

### Current Deployment Pattern
- **Reverse Proxy**: Caddy running on host (not in Docker container)
- **TLS Termination**: Caddy automatically handles SSL/TLS certificates
- **App Exposure**: Django container bound to `127.0.0.1:8010` (Docker Pattern A)
- **Public Access**: `https://sims.alshifalab.pk` → Caddy → `127.0.0.1:8010` → Django

**Note:** The `nginx/` directory exists for reference but is **not used** in the current Caddy-based deployment pattern.

### Service Dependencies
```
Frontend → Backend → PostgreSQL
              ↓
            Redis → RQ Worker
```

## Service Management

### Starting Services
```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d backend
docker compose up -d rqworker

# View logs
docker compose logs -f backend
docker compose logs -f rqworker
```

### Stopping Services
```bash
# Stop all services
docker compose down

# Stop specific service
docker compose stop rqworker
```

### Service Health Checks

**Health Endpoint:** `GET /health/`

Returns:
```json
{
  "status": "ok",
  "service": "SIMS Backend",
  "components": {
    "database": "ok",
    "redis": "ok",
    "rq_queue": "ok"
  }
}
```

**Status Values:**
- `ok` - All components healthy
- `degraded` - One or more components unhealthy

### Background Jobs (RQ Worker)

The RQ worker processes asynchronous tasks like transcript generation and email notifications.

**Monitor Worker:**
```bash
# Check worker logs
docker compose logs -f rqworker

# Check queue status (inside backend container)
docker exec -it sims_backend python manage.py rqstats
```

**Common Background Jobs:**
- `generate_and_email_transcript` - Generate PDF transcript and email
- `batch_generate_transcripts` - Bulk transcript generation

**Enqueue Job Example:**
```bash
POST /api/transcripts/enqueue/
{
  "student_id": 123,
  "email": "student@example.com"
}
```

## Staging Deployment

### Prerequisites
- Docker and Docker Compose installed
- Domain name configured (for SSL)
- Environment variables set in `.env`

### Initial Setup
```bash
# Clone repository
git clone https://github.com/munaimtahir/Fmu.git
cd Fmu

# Copy environment template
cp .env.example .env

# Edit .env with production values
nano .env

# Build and start staging services
docker compose -f docker-compose.staging.yml up -d

# Run migrations
docker exec sims_backend_staging python manage.py migrate

# Create superuser
docker exec -it sims_backend_staging python manage.py createsuperuser

# Seed demo data (optional)
docker exec sims_backend_staging python manage.py seed_demo --students=50
```

### SSL Certificate Setup

**Current Deployment (Caddy):**
Caddy automatically handles SSL/TLS certificates via Let's Encrypt. No manual certificate setup is required. Configure Caddy on the host to:
- Automatically obtain certificates for your domain
- Handle certificate renewal
- Proxy requests to `127.0.0.1:8010`

**Alternative Deployment (Nginx + Certbot):**
The following instructions are for **alternative deployment patterns** using nginx/certbot (not used in current Caddy deployment):

```bash
# Update nginx.staging.conf with your domain
nano nginx/nginx.staging.conf
# Replace 'yourdomain.com' with your actual domain

# Initial certificate request
docker compose -f docker-compose.staging.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com -d www.yourdomain.com

# Restart nginx
docker compose -f docker-compose.staging.yml restart nginx
```

**Certificate Auto-Renewal (Nginx/Certbot):**
The certbot container automatically renews certificates every 12 hours.

### Staging Environment Variables
```env
# Production settings
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
SECRET_KEY=<generate-strong-secret-key>

# Database
POSTGRES_DB=sims_db
POSTGRES_USER=sims_user
POSTGRES_PASSWORD=<strong-password>

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=<app-password>

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

## Backups

### Automated Backup (Nightly)
The staging deployment includes automated nightly backups via GitHub Actions workflow:
- Runs daily at 2 AM UTC
- Creates compressed PostgreSQL dump
- Uploads as GitHub artifact (7-day retention)
- Manual trigger available via workflow dispatch

### Manual Database Backup
```bash
# Create backup directory
mkdir -p backups

# Backup to file
docker exec sims_postgres_staging pg_dump -U sims_user -Fc sims_db > backups/backup_$(date +%Y%m%d_%H%M%S).dump

# Compress (if using SQL format)
gzip backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore
```bash
# Stop backend and worker
docker compose -f docker-compose.staging.yml stop backend rqworker

# Restore from backup
docker exec -i sims_postgres_staging pg_restore -U sims_user -d sims_db -c backups/backup_20251022.dump

# Or from SQL file
gunzip -c backups/backup_20251022.sql.gz | docker exec -i sims_postgres_staging psql -U sims_user sims_db

# Restart services
docker compose -f docker-compose.staging.yml start backend rqworker

# Verify health
curl https://yourdomain.com/healthz
```

### Media Files Backup
```bash
# Backup uploaded files
docker run --rm -v sims_media_volume:/data -v $(pwd)/backups:/backup alpine \
  tar czf /backup/media_$(date +%Y%m%d).tar.gz -C /data .

# Restore
docker run --rm -v sims_media_volume:/data -v $(pwd)/backups:/backup alpine \
  tar xzf /backup/media_20251022.tar.gz -C /data

# Or using docker cp
docker cp sims_backend_staging:/app/media ./media_backup
docker cp ./media_backup sims_backend_staging:/app/media
```

### Weekly Snapshot
```bash
# Create complete backup (database + media)
./backup.sh

# Verify backup
ls -lh backups/
```

**Backup Script (backup.sh):**
```bash
#!/bin/bash
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database
docker exec sims_postgres_staging pg_dump -U sims_user -Fc sims_db > $BACKUP_DIR/db_$DATE.dump

# Media files
docker run --rm -v sims_media_volume:/data -v $(pwd)/$BACKUP_DIR:/backup alpine \
  tar czf /backup/media_$DATE.tar.gz -C /data .

echo "Backup completed: $DATE"
ls -lh $BACKUP_DIR/*$DATE*
```

## Monitoring

### Health Endpoints
- **API Health:** `GET /health/` - Overall system health
- **Database:** Checked via health endpoint
- **Redis/RQ:** Checked via health endpoint
- **Frontend:** Static file availability

### Log Management
```bash
# View logs
docker compose logs -f [service_name]

# Backend logs
docker compose logs -f backend

# Worker logs
docker compose logs -f rqworker

# All logs
docker compose logs -f

# Save logs to file
docker compose logs > logs_$(date +%Y%m%d).txt
```

**Log Rotation:**
- Rotate daily
- Keep 14 days hot
- Archive monthly backups

### Error Tracking
- **Sentry (optional):** Configure `SENTRY_DSN` environment variable
- **Health Check Monitoring:** Monitor `/health/` endpoint every 30 seconds

### Metrics to Monitor
- API response times
- Background job queue length
- Database connections
- Memory usage
- Disk space
- Failed background jobs

## Incidents

### Incident Response Process
1. **Triage:** Assess severity and impact
2. **Communication:** Notify stakeholders via #ops-fmu
3. **Investigation:** Check logs, health endpoints, metrics
4. **Mitigation:** Apply temporary fix
5. **Resolution:** Implement permanent fix
6. **Postmortem:** Document incident and learnings

### Severity Levels
- **P1 (Critical):** System down, data loss risk
- **P2 (High):** Major feature broken, degraded performance
- **P3 (Medium):** Minor feature broken, workaround available
- **P4 (Low):** Cosmetic issue, enhancement request

### Common Issues

#### Backend Service Not Starting
```bash
# Check logs
docker compose logs backend

# Check database connection
docker exec sims_backend python manage.py check --database default

# Run migrations
docker exec sims_backend python manage.py migrate
```

#### RQ Worker Not Processing Jobs
```bash
# Check worker logs
docker compose logs rqworker

# Check Redis connection
docker exec sims_backend python manage.py rqstats

# Restart worker
docker compose restart rqworker
```

#### High Memory Usage
```bash
# Check container stats
docker stats

# Restart services
docker compose restart backend rqworker

# Scale workers
docker compose up -d --scale rqworker=3
```

## Restore Procedures

### Complete System Restore
1. **Stop all services:**
   ```bash
   docker compose down
   ```

2. **Restore database:**
   ```bash
   docker compose up -d postgres
   docker exec -i sims_postgres psql -U sims_user sims_db < backup.sql
   ```

3. **Restore media files:**
   ```bash
   tar -xzf media_backup.tar.gz -C ./
   ```

4. **Start services:**
   ```bash
   docker compose up -d
   ```

5. **Verify health:**
   ```bash
   curl http://localhost:8000/health/
   docker compose ps
   ```

6. **Run smoke tests:**
   ```bash
   # Test API
   curl http://localhost:8000/api/students/
   
   # Test frontend
   curl http://localhost:5173/
   ```

## Maintenance

### Database Maintenance
```bash
# Vacuum database
docker exec sims_postgres vacuumdb -U sims_user -d sims_db -v

# Reindex
docker exec sims_postgres reindexdb -U sims_user -d sims_db

# Check statistics
docker exec sims_postgres psql -U sims_user -d sims_db -c "SELECT * FROM pg_stat_activity;"
```

### Cleanup
```bash
# Remove old logs
docker compose logs > /dev/null

# Clean Docker system
docker system prune -a --volumes

# Clear old backups (keep last 30 days)
find /backups -type f -mtime +30 -delete
```

## Security

### SSL Certificate Renewal
```bash
# Renew Let's Encrypt certificate
# For Caddy deployment: Certificates are automatically renewed by Caddy
# No manual renewal needed

# For alternative nginx/certbot deployment:
# docker exec sims_nginx certbot renew
# docker exec sims_nginx nginx -s reload
```

### Security Scanning
- **Trivy:** Automated in CI/CD pipeline
- **CodeQL:** Automated in CI/CD pipeline
- **Manual scan:**
  ```bash
  # Scan Docker image
  trivy image sims-backend:latest
  ```

## Legacy Module Configuration

### Environment Flags

The platform includes two environment flags to control legacy module behavior:

#### ENABLE_LEGACY_MODULES
- **Default**: `false`
- **Purpose**: Controls whether legacy endpoints are mounted at all
- **When `false`**: Legacy routes are not included in URL routing (recommended for production)
- **When `true`**: Legacy routes are mounted under `/api/legacy/` prefix
- **Production Recommendation**: Set to `false` to prevent legacy code from being accessible

#### ALLOW_LEGACY_WRITES
- **Default**: `false`
- **Purpose**: Controls whether write operations (POST/PUT/PATCH/DELETE) are allowed on legacy endpoints
- **When `false`**: All write operations on `/api/legacy/` endpoints are blocked (recommended)
- **When `true`**: Write operations are allowed (NOT recommended for production)
- **Note**: Only applies if `ENABLE_LEGACY_MODULES=true`
- **Production Recommendation**: Set to `false` to prevent data corruption from legacy modules

### Configuration Example

```bash
# Production settings (recommended)
ENABLE_LEGACY_MODULES=false
ALLOW_LEGACY_WRITES=false

# Development/testing (if legacy compatibility needed)
ENABLE_LEGACY_MODULES=true
ALLOW_LEGACY_WRITES=false  # Still block writes for safety
```

### Legacy Module List

The following modules are considered legacy and are gated behind these flags:
- `enrollment` - Use `students` enrollment features instead
- `assessments` - Use `exams` + `results` instead
- `requests` - Administrative requests (may be re-evaluated later)

See [Canonical Modules Documentation](CANONICAL_MODULES.md) for full details on canonical vs legacy modules.

## Contact

- **Triage channel:** #ops-fmu
- **On-call rota:** See internal wiki
- **Postmortem template:** See internal wiki
