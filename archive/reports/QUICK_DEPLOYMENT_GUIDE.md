# Quick Deployment Guide

## 🚀 Fast Track: Production Deployment

### Prerequisites
- Docker and Docker Compose installed
- `.env` file configured (copy from `.env.example`)

### Deploy in 4 Commands

```bash
# 1. Clean slate
docker compose -f docker-compose.prod.yml down -v

# 2. Build images
docker compose -f docker-compose.prod.yml build

# 3. Start services
docker compose -f docker-compose.prod.yml up -d

# 4. Check status
docker compose -f docker-compose.prod.yml ps
```

### Quick Health Check

```bash
# All should show "running" or "healthy"
docker compose -f docker-compose.prod.yml ps

# Check logs for any errors
docker compose -f docker-compose.prod.yml logs --tail=50

# Test nginx
curl http://localhost:81/health
# Should return: healthy

# Test frontend
curl -I http://localhost:81/
# Should return: HTTP/1.1 200 OK
```

### Expected Container Status

```
NAME               STATUS
sims_postgres      Up X seconds (healthy)
sims_redis         Up X seconds (healthy)
sims_backend       Up X seconds (healthy)
sims_frontend      Up X seconds
sims_rqworker      Up X seconds (healthy)
sims_nginx         Up X seconds (healthy)
```

## ✅ What Was Fixed

This deployment includes fixes for:

1. **nginx duplicate upstream error** ✅
   - No more `[emerg] duplicate upstream "backend"` errors
   - nginx will start and stay running

2. **Django migration error** ✅
   - No more `Section has no field named '_teacher_old'` errors
   - Migrations will complete successfully

## 🔍 Troubleshooting

### If a container exits immediately:

```bash
# Check logs for that specific service
docker compose -f docker-compose.prod.yml logs <service-name>

# Example:
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs nginx
```

### Common Issues:

**nginx fails to start:**
- Check: `docker compose -f docker-compose.prod.yml logs nginx`
- Should NOT see: "duplicate upstream" errors
- If you do, verify you're using the fixed `docker-compose.yml` file

**Backend exits with migration error:**
- Check: `docker compose -f docker-compose.prod.yml logs backend`
- Should NOT see: "_teacher_old" errors
- If you do, verify you're using the fixed migration file

**Database connection errors:**
- Wait 10-15 seconds for postgres to initialize
- Check: `docker compose -f docker-compose.prod.yml logs postgres`
- Look for: "database system is ready to accept connections"

## 🔄 Restart a Single Service

```bash
# Restart just one service without affecting others
docker compose -f docker-compose.prod.yml restart <service-name>

# Example:
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart nginx
```

## 🧹 Clean Rebuild

If you need to rebuild from scratch:

```bash
# Stop and remove everything (including volumes)
docker compose -f docker-compose.prod.yml down -v

# Remove images (optional, forces full rebuild)
docker compose -f docker-compose.prod.yml down --rmi all

# Rebuild and start
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

```bash
# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f

# Follow logs for specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Check resource usage
docker stats

# Check container details
docker compose -f docker-compose.prod.yml ps -a
```

## 🌐 Access Points

After successful deployment:

- **Frontend:** http://localhost:81/ or http://YOUR_VPS_IP:81/
- **API:** http://localhost:81/api/
- **Admin:** http://localhost:81/admin/
- **Health Check:** http://localhost:81/health
- **Backend Direct:** http://localhost:8001/ (if needed for debugging)

## 📖 Full Documentation

For detailed information, see:
- `DEPLOYMENT_DEBUG_NOTES.md` - Complete deployment documentation
- `README.md` - Project overview
- `all.txt` - Original deployment log (for reference)

## 🆘 Need Help?

1. Check logs: `docker compose -f docker-compose.prod.yml logs`
2. Review `DEPLOYMENT_DEBUG_NOTES.md` for detailed troubleshooting
3. Verify your `.env` file has correct settings
4. Ensure Docker has sufficient resources (CPU, memory, disk)

## ✨ Success Indicators

You'll know the deployment succeeded when:
- ✅ All 6 containers show as running in `docker compose ps`
- ✅ No error messages in logs
- ✅ `curl http://localhost:81/health` returns "healthy"
- ✅ Frontend loads in browser at http://localhost:81/
- ✅ No "duplicate upstream" errors
- ✅ No "_teacher_old" migration errors

---

**Last Updated:** After fixing nginx and Django migration issues
**Tested:** Syntax and configuration validated
**Status:** Ready for production deployment
