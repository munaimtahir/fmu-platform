# Docker Deployment Review & Recommendations

**Date:** December 2024  
**Status:** ⚠️ Issues Found - Fixes Required

## Executive Summary

The Docker deployment configuration is mostly well-structured with separate configurations for development, staging, and production. However, several critical issues were identified that could prevent successful deployment or cause runtime problems. This document outlines all issues and provides fixes.

---

## 🔴 Critical Issues

### 1. **Backend Healthcheck Uses Wrong Endpoint**

**Location:** `docker-compose.yml` and `docker-compose.prod.yml`  
**Issue:** Backend healthcheck uses `/admin/login/?next=/admin/` which is not ideal for health checks.

**Current:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/admin/login/?next=/admin/"]
```

**Problem:**
- Admin endpoint requires authentication, making it unreliable for health checks
- Should use the dedicated `/health/` or `/healthz/` endpoint

**Fix:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/healthz/"]
```

---

### 2. **nginx Healthcheck Uses `wget` Which May Not Be Available**

**Location:** All docker-compose files  
**Issue:** nginx:alpine image may not have `wget` installed.

**Current:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
```

**Problem:**
- `wget` is not included in nginx:alpine by default
- Will cause healthcheck failures

**Fix Options:**

**Option A:** Use `curl` (if available) or install wget:
```yaml
healthcheck:
  test: ["CMD", "sh", "-c", "wget --quiet --tries=1 --spider http://localhost/health || exit 1"]
```

**Option B:** Use nginx's built-in capabilities:
```yaml
healthcheck:
  test: ["CMD", "sh", "-c", "exec 3<>/dev/tcp/127.0.0.1/80 && echo -e 'GET /health HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n' >&3 && cat <&3 | grep -q '200 OK'"]
```

**Option C:** Install wget in a custom nginx image or use a different base image.

**Recommended:** Create a custom nginx image with wget installed, or use Option B.

---

### 3. **Frontend API URL Not Configured Properly**

**Location:** `docker-compose.prod.yml` and `docker-compose.staging.yml`  
**Issue:** `VITE_API_URL` build arg defaults to empty string if not provided.

**Current:**
```yaml
frontend:
  build:
    args:
      - VITE_API_URL=${VITE_API_URL:-}
```

**Problem:**
- If `VITE_API_URL` is not set in `.env`, it becomes empty string
- Frontend code uses `import.meta.env.VITE_API_URL || ''` which defaults to empty string
- API calls will fail because baseURL will be empty or relative

**Fix:**
```yaml
frontend:
  build:
    args:
      - VITE_API_URL=${VITE_API_URL:-/api}
```

**Better Fix:** Set a proper default based on environment:
- Development: `http://localhost:8000/api`
- Production: `/api` (relative, proxied through nginx)
- Staging: `/api` (relative, proxied through nginx)

**Recommended:** Update docker-compose files to require `VITE_API_URL` or provide sensible defaults.

---

### 4. **Missing `.env.example` File**

**Location:** Root directory  
**Issue:** Validation script and documentation reference `.env.example` but it doesn't exist.

**Problem:**
- Users don't know what environment variables are required
- Deployment will fail without proper configuration

**Fix:** Create `.env.example` with all required variables and documentation.

---

## 🟡 Important Issues

### 5. **Production docker-compose.yml Missing Source Code Volume**

**Location:** `docker-compose.prod.yml`  
**Status:** ✅ Actually Correct  
**Note:** Production should NOT mount source code volumes for security and performance. This is correct as-is.

---

### 6. **Staging SSL Certificate Path Hardcoded**

**Location:** `nginx/nginx.staging.conf`  
**Issue:** SSL certificate path is hardcoded to `yourdomain.com`.

**Current:**
```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

**Problem:**
- Will fail if domain doesn't match
- Should be configurable or documented

**Fix:** Document that this needs to be updated, or use environment variable substitution (requires custom nginx image).

---

### 7. **Backend Healthcheck May Fail During Migrations**

**Location:** All docker-compose files  
**Issue:** Healthcheck starts immediately, but migrations may take time.

**Current:** Healthcheck interval is 30s with 3 retries, which may not be enough for initial setup.

**Fix:** Increase `start_period` for backend healthcheck:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/healthz/"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s  # Add this - wait 60s before starting health checks
```

---

### 8. **Frontend Production Build May Fail Without API URL**

**Location:** `frontend/Dockerfile.prod`  
**Issue:** Build-time environment variable may be empty.

**Current:**
```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
```

**Problem:** If not provided, build will succeed but runtime will fail.

**Fix:** Provide a default or fail build if not set:
```dockerfile
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
```

---

## 🟢 Minor Issues & Improvements

### 9. **Missing Network Configuration in Production**

**Location:** `docker-compose.prod.yml`  
**Issue:** No explicit network definition (uses default).

**Recommendation:** Add explicit network for better isolation:
```yaml
networks:
  sims_network:
    driver: bridge
```

---

### 10. **No Restart Policies in Production**

**Location:** `docker-compose.prod.yml`  
**Issue:** Services don't have restart policies.

**Recommendation:** Add restart policies:
```yaml
restart: unless-stopped  # or 'always'
```

---

### 11. **Volume Permissions Not Handled**

**Location:** All docker-compose files  
**Issue:** Static and media volumes may have permission issues.

**Recommendation:** Add initialization step or document permission requirements.

---

### 12. **Missing Resource Limits**

**Location:** All docker-compose files  
**Issue:** No CPU/memory limits defined.

**Recommendation:** Add resource limits for production:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

---

## 📋 Recommended Fixes Priority

### High Priority (Fix Before Deployment)
1. ✅ Fix backend healthcheck endpoint
2. ✅ Fix nginx healthcheck (install wget or use alternative)
3. ✅ Fix frontend VITE_API_URL configuration
4. ✅ Create `.env.example` file

### Medium Priority (Fix Soon)
5. ✅ Add start_period to backend healthcheck
6. ✅ Add restart policies to production
7. ✅ Document SSL certificate configuration for staging

### Low Priority (Nice to Have)
8. ✅ Add explicit networks
9. ✅ Add resource limits
10. ✅ Document volume permissions

---

## 🔧 Implementation Plan

### Step 1: Fix Critical Issues

1. **Update backend healthcheck in all docker-compose files:**
   - Change from `/admin/login/?next=/admin/` to `/healthz/`

2. **Fix nginx healthcheck:**
   - Option A: Create custom nginx image with wget
   - Option B: Use alternative healthcheck method

3. **Fix frontend API URL:**
   - Update docker-compose.prod.yml and docker-compose.staging.yml
   - Set default to `/api` for production builds

4. **Create `.env.example`:**
   - Include all required environment variables
   - Add comments explaining each variable

### Step 2: Improve Configuration

5. **Add start_period to backend healthcheck**

6. **Add restart policies to production services**

7. **Document SSL setup for staging**

### Step 3: Testing

8. **Test deployment with fixes:**
   ```bash
   docker compose -f docker-compose.prod.yml config --quiet
   docker compose -f docker-compose.prod.yml up --build
   ```

9. **Verify healthchecks work:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   # All services should show "healthy"
   ```

10. **Test API connectivity:**
    ```bash
    curl http://localhost:81/health
    curl http://localhost:81/api/
    ```

---

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] All docker-compose files validate (`docker compose config --quiet`)
- [ ] Backend healthcheck uses `/healthz/` endpoint
- [ ] nginx healthcheck works (no wget errors)
- [ ] Frontend builds with proper API URL
- [ ] `.env.example` exists and is complete
- [ ] Production deployment starts successfully
- [ ] All services show as "healthy"
- [ ] Frontend can connect to backend API
- [ ] Health endpoints respond correctly

---

## 📚 Additional Recommendations

### Documentation
- Create a deployment guide that covers all three environments
- Document environment variable requirements
- Add troubleshooting section for common issues

### CI/CD Integration
- Add Docker build validation to CI pipeline
- Test docker-compose configurations in CI
- Validate environment variable requirements

### Monitoring
- Consider adding healthcheck endpoints that return more detailed status
- Add logging for healthcheck failures
- Monitor container resource usage

---

## 🎯 Conclusion

The Docker deployment configuration is well-structured but has several critical issues that need to be addressed before production deployment. The fixes are straightforward and can be implemented quickly. Once fixed, the deployment should be reliable and easy to use.

**Next Steps:**
1. Review and approve fixes
2. Apply fixes to codebase
3. Test deployment
4. Update documentation


