# FMU Platform - Quick Reference

## 🌐 Access URLs

**Production Site:** https://lims.alshifalab.pk/

**Admin Panel:** https://lims.alshifalab.pk/admin/

**API Endpoint:** https://lims.alshifalab.pk/api/

**Health Check:** https://lims.alshifalab.pk/api/health/

---

## 🔐 Superuser Credentials

**Username:** `admin`  
**Password:** `admin123`  
**Email:** admin@sims.edu  
**Role:** Admin (Superuser)

---

## 📝 API Login

**Endpoint:** `POST https://lims.alshifalab.pk/api/auth/login/`

**Request:**
```json
{
    "identifier": "admin",
    "password": "admin123"
}
```

**Response:**
```json
{
    "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@sims.edu",
        "full_name": "Admin User",
        "role": "Admin",
        "is_active": true
    },
    "tokens": {
        "access": "JWT_TOKEN_HERE",
        "refresh": "REFRESH_TOKEN_HERE"
    }
}
```

---

## 🚀 Deployment Commands

### Full Stack Deployment
```bash
./both.sh
```

### Backend Only
```bash
./backend.sh
```

### Frontend Only
```bash
./frontend.sh
```

---

## 🔧 Management Commands

### Check Service Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Backend only
docker compose -f docker-compose.prod.yml logs -f backend
```

### Restart Services
```bash
# All services
docker compose -f docker-compose.prod.yml restart

# Backend only
docker compose -f docker-compose.prod.yml restart backend
```

### Run Migrations
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Create New Superuser
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### Change Admin Password
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py changepassword admin
```

---

## 📊 System Status

**Deployment Date:** January 18, 2026  
**Status:** ✅ Operational  
**Environment:** Production  
**Docker Compose File:** `docker-compose.prod.yml`

**Services:**
- Frontend (React + Vite + nginx) → Port 8080
- Backend (Django + Gunicorn) → Port 8010  
- Database (PostgreSQL 16) → Port 5432
- Cache (Redis 7) → Port 6379

---

## 📚 Documentation

- Full Report: `DEPLOYMENT_SUCCESS_REPORT.md`
- Environment Contract: `ENV_CONTRACT.md`
- Runbook: `RUNBOOK.md`

---

**Last Updated:** January 18, 2026
