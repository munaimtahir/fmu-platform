# FMU Docker Deployment Debug Notes

## Overview
This document details the issues discovered during Docker deployment and the fixes applied.

## Service Architecture

### Docker Compose Services
The production deployment (`docker-compose.prod.yml`) consists of:

1. **postgres** (container: `sims_postgres`)
   - Image: `postgres:14-alpine`
   - Role: PostgreSQL database server
   - Port: Internal only (5432)

2. **redis** (container: `sims_redis`)
   - Image: `redis:7-alpine`
   - Role: Cache and message broker for background jobs
   - Port: Internal only (6379)

3. **backend** (container: `sims_backend`)
   - Build: `./backend` with Django application
   - Role: Django REST API server
   - Port: 8001:8000 (external:internal)
   - Command: `gunicorn` WSGI server

4. **frontend** (container: `sims_frontend`)
   - Build: `./frontend` with React/Vite application
   - Role: Static frontend assets
   - Volume: Shares built files via `frontend_dist` volume

5. **rqworker** (container: `sims_rqworker`)
   - Build: Same as backend
   - Role: Background job processor (RQ worker)
   - Port: Internal only

6. **nginx** (container: `sims_nginx`)
   - Image: `nginx:alpine`
   - Role: Reverse proxy and static file server
   - Port: 81:80, 444:443 (external:internal)

## Issues Discovered from all.txt

### Issue 1: nginx Duplicate Upstream "backend"

**Error Message:**
```
fmu_nginx | 2025/11/21 13:31:58 [emerg] 1#1: duplicate upstream "backend" in /etc/nginx/conf.d/production.conf:1
fmu_nginx | nginx: [emerg] duplicate upstream "backend" in /etc/nginx/conf.d/production.conf:1
fmu_nginx exited with code 1
```

**Root Cause:**
The development `docker-compose.yml` was mounting the entire `./nginx/conf.d/` directory to `/etc/nginx/conf.d/` in the nginx container. This caused both `default.conf` and `production.conf` to be loaded simultaneously, resulting in duplicate `upstream backend` definitions.

**Files Affected:**
- `nginx/conf.d/default.conf` - Contains `upstream backend` for development
- `nginx/conf.d/production.conf` - Contains `upstream backend` for production
- `docker-compose.yml` - Mounted entire conf.d directory

**Fix Applied:**
Modified `docker-compose.yml` to mount only the specific config file needed:

**Before:**
```yaml
volumes:
  - ./nginx/conf.d:/etc/nginx/conf.d:ro
```

**After:**
```yaml
volumes:
  - ./nginx/conf.d/default.conf:/etc/nginx/conf.d/default.conf:ro
```

**Note:** The production compose file (`docker-compose.prod.yml`) was already correctly configured:
```yaml
volumes:
  - ./nginx/conf.d/production.conf:/etc/nginx/conf.d/default.conf:ro
```

**Verification:**
- Development: Only `default.conf` is loaded
- Production: Only `production.conf` is loaded (as `default.conf`)
- No duplicate upstream definitions

---

### Issue 2: Django Migration Error - Section._teacher_old

**Error Message:**
```
fmu_backend | Applying academics.0005_migrate_teacher_to_foreignkey...
fmu_backend | django.core.exceptions.FieldDoesNotExist: Section has no field named '_teacher_old'
fmu_backend | KeyError: ('academics', 'section')
fmu_backend exited with code 1
```

**Root Cause:**
The migration `academics/migrations/0005_migrate_teacher_to_foreignkey.py` was attempting to convert the `teacher` field from a CharField to a ForeignKey. However, the migration operations were not properly ordered, causing Django's migration state builder to fail when trying to reference `_teacher_old` field during `state_forwards` processing.

The original migration tried to:
1. Rename `teacher` → `_teacher_old`
2. Add `teacher_name` field
3. Copy data from `_teacher_old` to `teacher_name`
4. Add new `teacher` ForeignKey field
5. Remove `_teacher_old`
6. Update `unique_together` constraint

The issue was that Django's migration state couldn't properly track the intermediate `_teacher_old` field during state building, especially on fresh database deployments.

**Files Affected:**
- `backend/sims_backend/academics/migrations/0005_migrate_teacher_to_foreignkey.py`
- `backend/sims_backend/academics/models.py` (current Section model definition)

**Fix Applied:**
Reordered and simplified the migration operations:

1. **Remove unique_together first** - Prevents constraint violations during field changes
2. **Rename teacher to _teacher_old** - Temporarily stores old CharField data
3. **Add teacher_name field** - New CharField for display names
4. **Copy data via RunPython** - Migrates old string data to teacher_name
5. **Add new teacher ForeignKey** - New relationship to User model
6. **Remove _teacher_old** - Cleanup temporary field
7. **Re-establish unique_together** - With new ForeignKey field

**Key Changes:**
- Moved `AlterUniqueTogether` to the beginning to remove constraints before field changes
- Simplified the data migration function to avoid complex database introspection
- Ensured proper ordering so Django's state builder can track all intermediate steps

**Current Section Model Structure:**
```python
class Section(models.Model):
    course = ForeignKey(Course)
    term = CharField(max_length=32)
    teacher = ForeignKey(User, null=True, blank=True)  # NEW: ForeignKey
    teacher_name = CharField(max_length=128, blank=True)  # NEW: Display name
    capacity = PositiveIntegerField(default=30)
    
    class Meta:
        unique_together = ("course", "term", "teacher")
```

---

## Deployment Commands

### Production Deployment

```bash
# 1. Navigate to repository root
cd /path/to/fmu

# 2. Ensure .env file exists and is configured
cp .env.example .env
# Edit .env with production values

# 3. Stop and remove existing containers
docker compose -f docker-compose.prod.yml down -v

# 4. Build all images
docker compose -f docker-compose.prod.yml build

# 5. Start all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# 6. Check container status
docker compose -f docker-compose.prod.yml ps

# 7. View logs
docker compose -f docker-compose.prod.yml logs -f

# 8. Check specific service logs
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs nginx
```

### Development Deployment

```bash
# Use regular docker-compose.yml for development
docker compose up -d
docker compose logs -f
```

---

## Verification Checklist

### Container Health
- [ ] `sims_postgres` - Running and healthy (accepting connections)
- [ ] `sims_redis` - Running and healthy (responding to ping)
- [ ] `sims_backend` - Running without migration errors
- [ ] `sims_frontend` - Built successfully, files in volume
- [ ] `sims_rqworker` - Running and connected to Redis
- [ ] `sims_nginx` - Running without [emerg] errors

### Nginx Checks
- [ ] No duplicate upstream errors in logs
- [ ] Health check endpoint responds: `curl http://localhost:81/health`
- [ ] Static files accessible: `/static/`, `/media/`
- [ ] API proxying works: `/api/`, `/admin/`
- [ ] Frontend loads: `http://localhost:81/`

### Django Backend Checks
- [ ] Migrations complete successfully
- [ ] No `_teacher_old` field errors
- [ ] Admin interface loads: `http://localhost:81/admin/`
- [ ] API endpoints respond: `http://localhost:81/api/`
- [ ] Static files collected

### Database Checks
- [ ] PostgreSQL accepting connections
- [ ] All migrations applied
- [ ] Section model has correct fields (teacher ForeignKey, teacher_name CharField)

---

## Known Warnings (Non-Critical)

### Redis Warning
```
fmu_redis | WARNING overcommit_memory is set to 0!
```
**Status:** This is a performance warning, not a critical error. Redis will continue to function normally. Can be resolved by setting `vm.overcommit_memory = 1` in the host's `/etc/sysctl.conf` if needed for production optimization.

---

## Troubleshooting

### If nginx fails to start:
1. Check for duplicate upstream definitions:
   ```bash
   grep "upstream backend" nginx/conf.d/*.conf
   ```
2. Verify correct config is mounted in docker-compose file
3. Test nginx config syntax:
   ```bash
   docker compose -f docker-compose.prod.yml exec nginx nginx -t
   ```

### If backend migrations fail:
1. Check migration order:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend python manage.py showmigrations academics
   ```
2. Check for partial migrations:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend python manage.py migrate academics --plan
   ```
3. If needed, reset database (DEVELOPMENT ONLY):
   ```bash
   docker compose -f docker-compose.prod.yml down -v
   docker compose -f docker-compose.prod.yml up -d
   ```

### If containers keep restarting:
1. Check individual container logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs <service-name>
   ```
2. Check resource usage:
   ```bash
   docker stats
   ```

---

## Changes Summary

### Files Modified:
1. `docker-compose.yml` - Fixed nginx volume mount to prevent duplicate upstreams
2. `backend/sims_backend/academics/migrations/0005_migrate_teacher_to_foreignkey.py` - Reordered migration operations

### Files Created:
1. `DEPLOYMENT_DEBUG_NOTES.md` - This documentation file

### Files Not Modified (already correct):
- `docker-compose.prod.yml` - nginx configuration was already correct
- `nginx/conf.d/production.conf` - Correct upstream definition
- `nginx/conf.d/default.conf` - Correct upstream definition for dev
- `backend/sims_backend/academics/models.py` - Current model is correct

---

## Next Steps

1. ✅ Fix applied - nginx duplicate upstream resolved
2. ✅ Fix applied - Django migration issue resolved
3. ⏳ Run full deployment test
4. ⏳ Verify all containers start and stay healthy
5. ⏳ Test application functionality (frontend loads, API responds, admin works)
6. ⏳ Run code review
7. ⏳ Run security checks (CodeQL)
8. ⏳ Create PR for review

---

## Contact / Support

For issues or questions about this deployment:
- Check logs first: `docker compose -f docker-compose.prod.yml logs`
- Review this document for common issues
- Check the main README.md for project documentation
