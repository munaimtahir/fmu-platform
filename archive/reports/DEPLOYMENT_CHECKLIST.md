# Deployment Checklist for 172.237.71.40 and 139.162.9.224

## Pre-Deployment Steps

### 1. Validate Configuration
```bash
# Run automated validation
./validate_docker_deployment.sh
```

Expected result: All checks pass ✅

### 2. Prepare Environment
```bash
# Create .env from template
cp .env.example .env

# Edit .env file with production values
nano .env
```

**Required changes in .env:**
- [ ] `DJANGO_SECRET_KEY` - Generate new secret key
- [ ] `DJANGO_DEBUG=False` - Must be False for production
- [ ] `DB_PASSWORD` - Set strong database password
- [ ] `DJANGO_ALLOWED_HOSTS` - Verify includes `139.162.9.224` (and any other active VPS IPs)
- [ ] `CORS_ALLOWED_ORIGINS` - Verify includes `http://139.162.9.224` and `http://139.162.9.224:81`
- [ ] `CSRF_TRUSTED_ORIGINS` - Verify includes `http://139.162.9.224` and `http://139.162.9.224:81`

**Generate Django Secret Key:**
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### 3. Choose Deployment Configuration

**For Production (Recommended):**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

**For Staging (with SSL):**
```bash
docker compose -f docker-compose.staging.yml up -d --build
```

**For Development:**
```bash
docker compose up -d --build
```

## Deployment Steps

### 1. Start Services
```bash
# For production
docker compose -f docker-compose.prod.yml up -d --build

# Monitor startup
docker compose -f docker-compose.prod.yml logs -f
```

### 2. Verify All Services Are Running
```bash
docker compose -f docker-compose.prod.yml ps
```

Expected output:
```
NAME               STATUS
sims_postgres      Up (healthy)
sims_redis         Up (healthy)
sims_backend       Up (healthy)
sims_frontend      Up
sims_rqworker      Up (healthy)
sims_nginx         Up (healthy)
```

### 3. Test Health Endpoints (example: 139.162.9.224)
```bash
# Test nginx health
curl http://139.162.9.224:81/health
# Expected: healthy

# Test backend health
curl -I http://139.162.9.224:81/api/
# Expected: HTTP/1.1 200 OK

# Test frontend
curl -I http://139.162.9.224:81/
# Expected: HTTP/1.1 200 OK
```

### 4. Create Superuser (First Time Only)
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 5. Load Demo Data (Optional)
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py seed_demo --students 50
```

## Post-Deployment Verification

### Access Points (for chosen VPS IP, e.g., 139.162.9.224)
- [ ] Frontend: `http://<VPS_IP>:81/` (e.g., `http://139.162.9.224:81/`)
- [ ] API Docs: `http://<VPS_IP>:81/api/docs/` (e.g., `http://139.162.9.224:81/api/docs/`)
- [ ] Admin Panel: `http://<VPS_IP>:81/admin/` (e.g., `http://139.162.9.224:81/admin/`)
- [ ] Health Check: `http://<VPS_IP>:81/health` (e.g., `http://139.162.9.224:81/health`)

### Test Functionality
- [ ] Can access frontend
- [ ] Can login as admin
- [ ] Can view API documentation
- [ ] Can access Django admin
- [ ] Static files load correctly
- [ ] Media files upload/download works

## Monitoring

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Check Resource Usage
```bash
docker stats
```

### Check Service Health
```bash
docker compose -f docker-compose.prod.yml ps
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs <service-name>

# Restart service
docker compose -f docker-compose.prod.yml restart <service-name>
```

### Database Connection Issues
```bash
# Check postgres is healthy
docker compose -f docker-compose.prod.yml ps postgres

# Check backend can connect
docker compose -f docker-compose.prod.yml exec backend python manage.py check
```

### nginx Not Serving Files
```bash
# Check nginx logs
docker compose -f docker-compose.prod.yml logs nginx

# Test nginx config
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Permission Issues
```bash
# Fix volume permissions
docker compose -f docker-compose.prod.yml exec backend chown -R root:root /app/static /app/media
```

## Maintenance

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations if any
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Backup Database
```bash
# Create backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U sims_user sims_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
# Restore from backup
docker compose -f docker-compose.prod.yml exec -T postgres psql -U sims_user sims_db < backup.sql
```

### View Container Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### Restart All Services
```bash
docker compose -f docker-compose.prod.yml restart
```

### Stop All Services
```bash
docker compose -f docker-compose.prod.yml down
```

### Clean Rebuild (Nuclear Option)
```bash
# Stop and remove everything
docker compose -f docker-compose.prod.yml down -v --rmi all

# Rebuild from scratch
docker compose -f docker-compose.prod.yml up -d --build
```

## Security Checklist

- [ ] `DJANGO_DEBUG=False` in .env
- [ ] Strong `DJANGO_SECRET_KEY` generated
- [ ] Strong `DB_PASSWORD` set
- [ ] `DJANGO_ALLOWED_HOSTS` restricted to actual domains/IPs
- [ ] CORS origins restricted to actual frontend URL
- [ ] CSRF trusted origins configured correctly
- [ ] Firewall configured (only ports 80, 81, 443 open)
- [ ] Regular backups scheduled
- [ ] Log monitoring set up

## Configuration Files Reference

### Docker Compose Files
- `docker-compose.yml` - Development (hot reload)
- `docker-compose.prod.yml` - Production (optimized)
- `docker-compose.staging.yml` - Staging (with SSL)

### nginx Configurations
- `nginx/nginx.conf` - Main nginx config
- `nginx/nginx.staging.conf` - Staging nginx with SSL
- `nginx/conf.d/default.conf` - Development site config
- `nginx/conf.d/production.conf` - Production site config

### Dockerfiles
- `backend/Dockerfile` - Backend container
- `frontend/Dockerfile` - Development frontend
- `frontend/Dockerfile.prod` - Production frontend (multi-stage)

## Support

For detailed information, see:
- **DOCKER_DEPLOYMENT_VERIFICATION.md** - Complete deployment report
- **README.md** - Project overview
- **Docs/SECURITY_DEPLOYMENT.md** - Security guidelines
- **QUICK_DEPLOYMENT_GUIDE.md** - Quick reference

## Deployment Status

- [x] Docker configurations validated
- [x] IP 172.237.71.40 configured
- [x] All files in place
- [x] Validation script passing
- [ ] .env file created (required before deployment)
- [ ] Services deployed
- [ ] Health checks passing
- [ ] Superuser created
- [ ] Testing completed

---
**Ready for Deployment:** ✅ YES  
**Target Server:** 172.237.71.40  
**Deployment Method:** docker compose -f docker-compose.prod.yml  
**Status:** All configurations verified and ready
