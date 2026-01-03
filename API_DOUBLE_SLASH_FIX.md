# API Double Slash Fix - /api/api/ Issue Resolved

**Date:** January 2, 2026  
**Issue:** Login requests failing with 404 at `/api/api/auth/login/`

---

## Problem

The login endpoint was receiving requests at:
```
https://sims.pmc.edu.pk/api/api/auth/login/
```

Notice the **double `/api/api/`** in the path!

### Root Cause

1. **Environment Variable:** `VITE_API_URL=/api` was set in `.env`
2. **Axios Base URL:** Frontend axios instance was configured with `baseURL: '/api'`
3. **API Calls:** Code was making requests to `/api/auth/login/`
4. **Result:** `/api` (baseURL) + `/api/auth/login/` (path) = `/api/api/auth/login/` ❌

---

## Solution

Changed `VITE_API_URL` from `/api` to `/` (root):

**Before:**
```env
VITE_API_URL=/api
```

**After:**
```env
VITE_API_URL=/
```

Now the URLs are constructed correctly:
- Base URL: `/`
- API Path: `/api/auth/login/`
- Final URL: `/api/auth/login/` ✅

---

## Fix Applied

1. ✅ Updated `.env` file: `VITE_API_URL=/`
2. ✅ Rebuilt frontend container without cache
3. ✅ Restarted frontend container

---

## Verification

### Test Login Endpoint

```bash
curl -X POST https://sims.alshifalab.pk/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}'
```

**Expected Response:**
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

## How It Works Now

### Frontend API Configuration

1. **Environment:** `VITE_API_URL=/` (relative URL)
2. **Axios Base URL:** `baseURL: '/'`
3. **API Calls:** All use paths starting with `/api/`
4. **Final URLs:**
   - Login: `/api/auth/login/` ✅
   - Logout: `/api/auth/logout/` ✅
   - Refresh: `/api/auth/refresh/` ✅
   - Me: `/api/auth/me/` ✅

### Example API Call

```typescript
// In auth.ts
api.post('/api/auth/login/', credentials)
// baseURL: '/' + path: '/api/auth/login/' = '/api/auth/login/'
```

---

## Important Notes

### Why `/` Instead of `/api`?

The test file comment explains:
> "The baseURL should NOT end with /api since all service calls include /api in their paths"

All API service calls already include the `/api/` prefix in their paths:
- `/api/auth/login/`
- `/api/students/`
- `/api/courses/`
- etc.

So the baseURL should be `/` (root) to avoid duplication.

### For Development

If running locally, you can use:
```env
VITE_API_URL=http://localhost:8000
```

This will make requests to `http://localhost:8000/api/auth/login/`

### For Production

Use relative URL:
```env
VITE_API_URL=/
```

This makes requests to `/api/auth/login/` which is correctly proxied by Caddy.

---

## Next Steps

1. ✅ **Clear browser cache** - Hard refresh (`Ctrl+Shift+R`)
2. ✅ **Test login** - Try logging in at https://sims.alshifalab.pk/login
3. ✅ **Verify** - Check browser Network tab to confirm requests go to `/api/auth/login/` (not `/api/api/auth/login/`)

---

## Troubleshooting

If you still see `/api/api/` in requests:

1. **Check .env file:**
   ```bash
   grep VITE_API_URL .env
   # Should show: VITE_API_URL=/
   ```

2. **Rebuild frontend:**
   ```bash
   docker compose -f docker-compose.prod.yml build --no-cache frontend
   docker compose -f docker-compose.prod.yml up -d frontend
   ```

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear cache in DevTools → Application → Clear Storage

---

**Status:** ✅ **FIXED** - Frontend rebuilt and restarted with correct API URL configuration.
