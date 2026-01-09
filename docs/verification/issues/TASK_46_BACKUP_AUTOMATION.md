# Issue: Automated Backup Scripts Missing

**Task**: Task 46 (Backup/restore hooks)  
**Severity**: Minor  
**Status**: Recommendation  
**Date**: 2026-01-09

## Description

While manual backup capability exists (PostgreSQL + Docker volumes), there are no automated backup scripts or scheduled jobs for regular database backups.

## Current State

**Manual Backup Capability** ✅:
- PostgreSQL database with persistent volume
- Django `dumpdata`/`loaddata` commands available
- Backup file exists: `fmu_platform_backup_20260102_120323.dump`
- Docker volume: `fmu_db_data`

**Missing** ⚠️:
- Automated backup script
- Scheduled backups (cron/systemd timer)
- Backup rotation/retention policy
- Automated restore testing
- Off-site backup sync

## Recommended Implementation

### Backup Script

```bash
#!/bin/bash
# scripts/backup.sh - Automated database backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="fmu_platform_backup_${TIMESTAMP}.dump"
S3_BUCKET="${S3_BUCKET:-}"

echo "🔄 Starting backup at $(date)"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database using pg_dump
docker compose exec -T db pg_dump \
  -U "${POSTGRES_USER:-fmu_platform}" \
  -d "${POSTGRES_DB:-fmu_platform}" \
  -Fc \
  > "${BACKUP_DIR}/${BACKUP_FILE}"

# Verify backup
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
  SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
  echo "✅ Backup created: ${BACKUP_FILE} (${SIZE})"
else
  echo "❌ Backup failed!"
  exit 1
fi

# Compress backup (optional)
gzip "${BACKUP_DIR}/${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Upload to S3 (if configured)
if [ -n "$S3_BUCKET" ]; then
  echo "📤 Uploading to S3..."
  aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" \
    "s3://${S3_BUCKET}/backups/${BACKUP_FILE}"
fi

# Remove old backups (retention policy)
echo "🧹 Cleaning old backups (retention: ${RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -name "fmu_platform_backup_*.dump*" \
  -mtime +${RETENTION_DAYS} -delete

# Create backup metadata
cat > "${BACKUP_DIR}/${BACKUP_FILE}.meta" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "size": "$(stat -f%z "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}")",
  "database": "${POSTGRES_DB:-fmu_platform}",
  "version": "$(docker compose exec -T backend python -c 'import django; print(django.VERSION)')"
}
EOF

echo "✅ Backup completed at $(date)"
```

### Restore Script

```bash
#!/bin/bash
# scripts/restore.sh - Restore from backup

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  echo "Available backups:"
  ls -lh /backups/fmu_platform_backup_*.dump* | tail -5
  exit 1
fi

echo "⚠️  WARNING: This will REPLACE the current database!"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 0
fi

echo "🔄 Starting restore from ${BACKUP_FILE}..."

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "📦 Decompressing backup..."
  gunzip -c "$BACKUP_FILE" > /tmp/restore.dump
  RESTORE_FILE="/tmp/restore.dump"
else
  RESTORE_FILE="$BACKUP_FILE"
fi

# Stop backend to prevent connections
echo "⏸️  Stopping backend..."
docker compose stop backend

# Drop and recreate database
echo "🗑️  Dropping existing database..."
docker compose exec -T db psql -U "${POSTGRES_USER:-fmu_platform}" <<SQL
DROP DATABASE IF EXISTS ${POSTGRES_DB:-fmu_platform};
CREATE DATABASE ${POSTGRES_DB:-fmu_platform};
SQL

# Restore from backup
echo "📥 Restoring database..."
docker compose exec -T db pg_restore \
  -U "${POSTGRES_USER:-fmu_platform}" \
  -d "${POSTGRES_DB:-fmu_platform}" \
  -Fc \
  < "$RESTORE_FILE"

# Clean up temp file
if [ "$RESTORE_FILE" = "/tmp/restore.dump" ]; then
  rm /tmp/restore.dump
fi

# Start backend
echo "▶️  Starting backend..."
docker compose start backend

# Run migrations (in case of schema updates)
echo "🔄 Running migrations..."
docker compose exec backend python manage.py migrate

# Run integrity check
echo "✅ Running data integrity check..."
docker compose exec backend python manage.py check_data_integrity || true

echo "✅ Restore completed at $(date)"
```

## Scheduling

### Cron (Linux)

```bash
# /etc/cron.d/fmu-backup
# Daily backup at 2 AM
0 2 * * * root /opt/fmu-platform/scripts/backup.sh >> /var/log/fmu-backup.log 2>&1

# Weekly cleanup
0 3 * * 0 root find /backups -name "*.dump*" -mtime +30 -delete
```

### Systemd Timer (Linux)

```ini
# /etc/systemd/system/fmu-backup.timer
[Unit]
Description=FMU Platform Daily Backup
Requires=fmu-backup.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/fmu-backup.service
[Unit]
Description=FMU Platform Backup Service

[Service]
Type=oneshot
ExecStart=/opt/fmu-platform/scripts/backup.sh
User=root
StandardOutput=journal
StandardError=journal
```

Enable:
```bash
systemctl enable --now fmu-backup.timer
systemctl status fmu-backup.timer
```

### Docker-based Scheduler

```yaml
# docker-compose.backup.yml
services:
  backup:
    image: alpine:latest
    volumes:
      - ./scripts:/scripts
      - ./backups:/backups
      - /var/run/docker.sock:/var/run/docker.sock
    command: crond -f -l 2
    restart: unless-stopped
    environment:
      BACKUP_SCHEDULE: "0 2 * * *"
```

## Backup Strategy

### What to Backup

1. **Database** (Critical):
   - PostgreSQL dump
   - Custom format (`.dump`) or SQL format (`.sql`)
   - Compressed with gzip

2. **Media Files** (Important):
   - `backend/media/` - User uploads
   - `backend/staticfiles/` - Can be regenerated

3. **Configuration** (Important):
   - `.env` file (encrypted)
   - Docker compose config

4. **Logs** (Optional):
   - Application logs
   - Audit logs

### Retention Policy

- **Daily**: Keep 7 days
- **Weekly**: Keep 4 weeks
- **Monthly**: Keep 12 months
- **Yearly**: Keep 5 years

### 3-2-1 Backup Rule

- **3** copies of data
- **2** different storage types (local + cloud)
- **1** copy off-site (S3, Google Cloud Storage, etc.)

## Off-site Backup

### AWS S3

```bash
# Install AWS CLI in container
pip install awscli

# Configure
aws configure

# Upload
aws s3 cp /backups/ s3://my-bucket/fmu-backups/ --recursive

# Sync
aws s3 sync /backups/ s3://my-bucket/fmu-backups/
```

### Google Cloud Storage

```bash
# Install gsutil
pip install gsutil

# Upload
gsutil cp /backups/*.dump.gz gs://my-bucket/fmu-backups/
```

### SFTP/rsync

```bash
# Sync to remote server
rsync -avz /backups/ backup-server:/backups/fmu/
```

## Monitoring

### Backup Success Check

```python
# backend/core/management/commands/check_backup_health.py
from datetime import timedelta
from pathlib import Path
from django.core.management.base import BaseCommand
from django.utils import timezone

class Command(BaseCommand):
    def handle(self, *args, **options):
        backup_dir = Path('/backups')
        latest_backup = max(
            backup_dir.glob('fmu_platform_backup_*.dump*'),
            key=lambda p: p.stat().st_mtime,
            default=None
        )
        
        if not latest_backup:
            self.stderr.write("❌ No backups found!")
            return
        
        age = timezone.now() - timezone.datetime.fromtimestamp(
            latest_backup.stat().st_mtime
        )
        
        if age > timedelta(days=2):
            self.stderr.write(f"⚠️  Latest backup is {age.days} days old!")
        else:
            self.stdout.write(f"✅ Latest backup: {age.seconds // 3600}h ago")
```

### Alerts

```bash
# Add to backup script
if [ $? -ne 0 ]; then
  # Send alert email
  echo "Backup failed!" | mail -s "FMU Backup Failed" admin@example.com
  
  # Send Slack notification
  curl -X POST https://hooks.slack.com/services/YOUR/HOOK/URL \
    -d '{"text":"⚠️ FMU Platform backup failed!"}'
fi
```

## Testing

### Test Backup

```bash
# Run backup script
./scripts/backup.sh

# Verify backup file exists
ls -lh /backups/fmu_platform_backup_*.dump.gz

# Check backup size (should be > 0)
```

### Test Restore

```bash
# Create test backup
./scripts/backup.sh

# Get latest backup
LATEST=$(ls -t /backups/fmu_platform_backup_*.dump.gz | head -1)

# Restore
./scripts/restore.sh "$LATEST"

# Verify data
docker compose exec backend python manage.py shell
>>> from sims_backend.students.models import Student
>>> Student.objects.count()  # Should match pre-restore count
```

## Priority

**MEDIUM** - Important for production, but manual backup capability exists

## Implementation Time

- **Backup script**: 1 hour
- **Restore script**: 1 hour
- **Scheduling**: 30 minutes
- **Testing**: 1 hour
- **Documentation**: 30 minutes

**Total**: ~4 hours

## Files to Create

- `scripts/backup.sh` - Backup script
- `scripts/restore.sh` - Restore script
- `scripts/test_backup.sh` - Backup testing script
- `.env.backup.example` - Backup configuration template
- `docs/BACKUP_RESTORE.md` - Backup/restore documentation
- `/etc/cron.d/fmu-backup` - Cron schedule (production)

## Status

**Open** - Recommendation for production deployment

## Related Tasks

- Task 45 (Data integrity) - Run after restore
- Task 44 (Audit logging) - Log backup/restore operations

## Next Steps

1. Implement backup script
2. Test backup and restore
3. Set up automated scheduling
4. Configure off-site backup
5. Document procedures
6. Test disaster recovery scenario
