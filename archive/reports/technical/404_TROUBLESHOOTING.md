# 404 Error Troubleshooting Guide

**Date:** January 2, 2026

---

## Issue

Getting "Request failed with status code 404" error.

---

## Root Cause

The frontend API base URL was incorrectly configured. The `.env` file had:
```
VITE_API_BASE_URL=http://localhost:8010/api
```

This causes the frontend to try to make requests to `http://localhost:8010/api` which doesn't work in production.

---

## Solution

### Fixed Configuration

The frontend should use a relative URL `/api` in production, which works correctly with the Caddy reverse proxy.

**Updated `.env`:**
```
VITE_API_URL=/api
```

**Docker Compose Configuration:**
The `docker-compose.prod.yml` already correctly sets:
```yaml
VITE_API_URL: ${VITE_API_URL:-/api}
```

---

## Verification

### Test API Endpoints

1. **Health Check:**
   ```bash
   curl https://sims.alshifalab.pk/api/health/
   ```

2. **Login Endpoint:**
   ```bash
   curl -X POST https://sims.alshifalab.pk/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin","password":"admin123"}'
   ```

### Expected Response

Login should return:
```json
{
  "user": {
    "id": 910,
    "username": "admin",
    "email": "admin@sims.edu",
    ...
  },
  "tokens": {
    "access": "...",
    "refresh": "..."
  }
}
```

---

## Common 404 Causes

### 1. Frontend API Base URL Misconfiguration

**Symptom:** All API requests return 404

**Fix:** Ensure `VITE_API_URL=/api` in `.env` and rebuild frontend:
```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### 2. Backend Route Not Found

**Symptom:** Specific endpoint returns 404

**Check:** Verify the route exists:
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py shell
>>> from django.urls import get_resolver
>>> resolver = get_resolver()
>>> # Check if route exists
```

### 3. Caddy Reverse Proxy Misconfiguration

**Symptom:** Frontend loads but API calls fail

**Check:** Verify Caddy configuration:
```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### 4. Frontend Route Not Found (SPA)

**Symptom:** Browser shows 404 for frontend routes

**Fix:** Ensure nginx is configured for SPA routing (all routes should serve `index.html`)

---

## Login Endpoint Details

### Correct Request Format

**Endpoint:** `POST /api/auth/login/`

**Request Body:**
```json
{
  "identifier": "admin",  // Can be username or email
  "password": "admin123"
}
```

**Note:** The field is `identifier`, not `username`!

### Response Format

**Success (200):**
```json
{
  "user": {
    "id": 910,
    "username": "admin",
    "email": "admin@sims.edu",
    "full_name": "admin",
    "role": "Admin",
    "is_active": true
  },
  "tokens": {
    "access": "eyJhbGc...",
    "refresh": "eyJhbGc..."
  }
}
```

**Error (400):**
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid request data."
  }
}
```

---

## Rebuild Frontend After Config Change

After updating `.env`:
```bash
cd /home/munaim/srv/apps/fmu-platform
docker compose -f docker-compose.prod.yml up -d --build frontend
```

---

## Check Current Configuration

```bash
# Check .env
grep VITE_API .env

# Check running container
docker compose -f docker-compose.prod.yml exec frontend env | grep VITE

# Test API
curl https://sims.alshifalab.pk/api/health/
```

---

**Last Updated:** January 2, 2026
