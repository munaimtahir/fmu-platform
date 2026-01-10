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

**Canonical Health/Readiness Endpoint:** `GET /api/health/`

The health endpoint is the canonical source of truth for service readiness. It is available at:
- `/api/health/` (canonical - recommended)
- `/health/` (legacy alias)
- `/healthz/` (alternative alias)

**Response Schema:**
```json
{
  "status": "ok" | "degraded",
  "checks": {
    "db": {
      "status": "ok" | "fail",
      "latency_ms": 12.34
    },
    "migrations": {
      "status": "ok" | "fail",
      "pending_count": 0  // only present if status is "fail"
    },
    "redis": {
      "status": "ok" | "fail" | "skipped"
    }
  },
  "version": "abc12345"  // git SHA (first 8 chars) or APP_VERSION env var
}
```

**Status Values:**
- `ok` - All critical components healthy (database accessible, migrations applied)
- `degraded` - Database or migrations check failed (service not ready)

**Check Details:**
- **db**: Database connectivity check with latency measurement (in milliseconds)
- **migrations**: Verifies all migrations are applied (fails if pending migrations exist)
- **redis**: Redis/RQ queue check (optional - does not affect readiness status)

**Usage:**
```bash
# Check health via curl
curl -s http://localhost:8010/api/health/ | jq

# Check health via docker compose
docker compose exec backend curl -s http://localhost:8000/api/health/

# Wait for readiness (useful in scripts)
timeout 120 bash -c 'until curl -sf http://localhost:8010/api/health/ | jq -e ".checks.db.status == \"ok\" and .checks.migrations.status == \"ok\""; do sleep 2; done'
```

**Environment Variables:**
- `APP_VERSION` or `VERSION`: Set application version (defaults to git SHA if available)

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

### Automated Database Backup

Use the `backup_db.sh` script for automated backups with retention:

```bash
# Basic backup (default: 7 days retention)
./scripts/backup_db.sh

# Custom retention period (14 days)
RETENTION_DAYS=14 ./scripts/backup_db.sh

# Custom backup directory
BACKUP_DIR=/mnt/backups/db ./scripts/backup_db.sh
```

**Script Features:**
- Creates timestamped backups: `fmu_platform_YYYYMMDD_HHMMSS.sql.gz`
- Automatic retention policy (default: 7 days)
- Detects database container automatically (`fmu_db` or `fmu_db_prod`)
- Works with docker compose
- Supports both custom format and plain SQL backups
- Off-host friendly: writes to `backups/db/` (can be rsynced or mounted)

**Backup Location:**
- Default: `backups/db/`
- Configurable via `BACKUP_DIR` environment variable
- Suitable for off-host sync (rsync, mounted volumes, etc.)

**Retention Policy:**
- Default: Keeps last 7 days of backups
- Configurable via `RETENTION_DAYS` environment variable
- Older backups are automatically deleted

**Manual Backup (Advanced):**
```bash
# Create backup directory
mkdir -p backups/db

# Direct pg_dump via docker exec (custom format)
docker exec fmu_db pg_dump -U fmu_platform -Fc fmu_platform | gzip > backups/db/fmu_platform_$(date +%Y%m%d_%H%M%S).sql.gz

# Or plain SQL format
docker exec fmu_db pg_dump -U fmu_platform -Fp fmu_platform | gzip > backups/db/fmu_platform_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Database Restore

Use the `restore_db.sh` script for safe database restore:

```bash
# Basic restore (with confirmation prompts)
./scripts/restore_db.sh backups/db/fmu_platform_20250103_120000.sql.gz

# Skip confirmation (FORCE mode - use with caution!)
FORCE=1 ./scripts/restore_db.sh backups/db/fmu_platform_20250103_120000.sql.gz

# Restore from relative path
./scripts/restore_db.sh fmu_platform_20250103_120000.sql.gz
```

**Script Features:**
- Safety checks and confirmation prompts (unless `FORCE=1`)
- Option to create pre-restore backup
- Automatically stops backend/worker services during restore
- Supports both custom format and plain SQL backups
- Detects backup format automatically
- Runs migrations after restore
- Restarts services and verifies health

**Restore Process:**
1. Validates backup file exists and is readable
2. Prompts for confirmation (unless `FORCE=1`)
3. Offers to create pre-restore backup (recommended)
4. Stops backend and worker services
5. Drops existing database connections
6. Restores database from backup
7. Runs migrations to ensure schema is current
8. Restarts services and verifies health endpoint

**Manual Restore (Advanced):**
```bash
# Stop backend and worker
docker compose stop backend rqworker

# Drop connections and recreate database
docker exec fmu_db psql -U fmu_platform -d postgres -c "DROP DATABASE IF EXISTS fmu_platform;"
docker exec fmu_db psql -U fmu_platform -d postgres -c "CREATE DATABASE fmu_platform;"

# Restore from backup (custom format)
gunzip -c backups/db/fmu_platform_20250103_120000.sql.gz | docker exec -i fmu_db pg_restore -U fmu_platform -d fmu_platform -c

# Or plain SQL format
gunzip -c backups/db/fmu_platform_20250103_120000.sql.gz | docker exec -i fmu_db psql -U fmu_platform -d fmu_platform

# Run migrations
docker compose exec backend python manage.py migrate

# Restart services
docker compose start backend rqworker

# Verify health
curl -s http://localhost:8010/api/health/ | jq
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

### Automated Backup Scheduling

**Recommended: Cron Job for Daily Backups**

Add to crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/fmu-platform && ./scripts/backup_db.sh >> /var/log/fmu-backup.log 2>&1

# Weekly backup with longer retention (every Sunday at 2 AM)
0 2 * * 0 cd /path/to/fmu-platform && RETENTION_DAYS=30 ./scripts/backup_db.sh >> /var/log/fmu-backup-weekly.log 2>&1
```

**Off-Host Backup Sync**

The backup directory (`backups/db/`) is designed to be off-host friendly. Common sync methods:

**Method 1: rsync to remote server**
```bash
# Sync backups to remote server daily
rsync -avz --delete backups/db/ user@backup-server:/backups/fmu-platform/db/
```

**Method 2: Mounted volume (Docker/Kubernetes)**
```yaml
# In docker-compose.yml, mount backup directory
volumes:
  - /mnt/external-backups/fmu:/app/backups
```

**Method 3: S3/Object Storage (using s3cmd/aws-cli)**
```bash
# Sync to S3
aws s3 sync backups/db/ s3://your-bucket/fmu-platform/backups/db/ --delete

# Or using s3cmd
s3cmd sync backups/db/ s3://your-bucket/fmu-platform/backups/db/ --delete-removed
```

**Recommended Backup Strategy:**
1. **Daily backups**: Keep 7 days locally
2. **Weekly backups**: Keep 4 weeks remotely
3. **Monthly backups**: Keep 12 months in cold storage
4. **Test restores**: Verify restore process quarterly

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
