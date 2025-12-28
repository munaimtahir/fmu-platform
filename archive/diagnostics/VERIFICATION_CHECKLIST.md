# Jazzmin Configuration Verification Checklist

This checklist can be used by reviewers or in future deployments to verify the Jazzmin admin theme is correctly configured.

## Quick Verification Commands

```bash
# 1. Check Python environment
python3 --version

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Verify Jazzmin import
python3 -c "import jazzmin; print('✅ Jazzmin import: OK')"

# 4. Run Django system check
cd backend && python3 manage.py check

# 5. Run integration test
cd backend && python3 -c "
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_backend.settings')
django.setup()
import jazzmin
from django.conf import settings
print('✅ Django setup: OK')
print('✅ Jazzmin in INSTALLED_APPS:', 'jazzmin' in settings.INSTALLED_APPS)
print('✅ Jazzmin before admin:', settings.INSTALLED_APPS.index('jazzmin') < settings.INSTALLED_APPS.index('django.contrib.admin'))
print('✅ JAZZMIN_SETTINGS defined:', hasattr(settings, 'JAZZMIN_SETTINGS'))
"

# 6. Run linters
cd backend && ruff check .
cd backend && mypy .
```

## Configuration Files Checklist

### ✅ backend/requirements.txt
- [ ] Contains `django-jazzmin==3.0.1` (correct package name)
- [ ] No duplicate or incorrect entries
- [ ] Version is pinned

**Current content:**
```
django-jazzmin==3.0.1
```

### ✅ backend/sims_backend/settings.py
- [ ] `'jazzmin'` is in INSTALLED_APPS
- [ ] `'jazzmin'` appears BEFORE `'django.contrib.admin'`
- [ ] Jazzmin configuration is imported from `core.jazzmin`

**Current INSTALLED_APPS order:**
```python
INSTALLED_APPS = [
    "jazzmin",                   # Index 0 ✅
    "django.contrib.admin",      # Index 1 ✅
    ...
]
```

**Configuration import:**
```python
from core.jazzmin import JAZZMIN_SETTINGS, JAZZMIN_UI_TWEAKS
```

### ✅ backend/core/jazzmin.py
- [ ] File exists
- [ ] Contains `JAZZMIN_SETTINGS` dictionary
- [ ] Contains `JAZZMIN_UI_TWEAKS` dictionary
- [ ] Settings include FMU branding

**Current structure:**
```python
JAZZMIN_SETTINGS = {
    "site_title": "FMU SIMS Admin",
    "site_header": "FMU Student Information System",
    ...
}

JAZZMIN_UI_TWEAKS = {
    "theme": "cosmo",
    ...
}
```

### ✅ backend/Dockerfile
- [ ] WORKDIR is set to `/app`
- [ ] `COPY requirements.txt .` (relative to context)
- [ ] `RUN pip install -r requirements.txt`
- [ ] `COPY . .` (copies all backend files)

**Note:** Paths are relative to build context which is set to `./backend` in docker-compose.yml

### ✅ docker-compose.yml
- [ ] Backend build context is `./backend`
- [ ] Dockerfile path is `Dockerfile`
- [ ] No path mismatches

**Current configuration:**
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
```

## Expected Test Results

### Django Check
```
System check identified no issues (0 silenced).
```

### Jazzmin Import
```
✅ Jazzmin import: OK
```

### Integration Test
```
✅ Django setup: OK
✅ Jazzmin in INSTALLED_APPS: True
✅ Jazzmin before admin: True
✅ JAZZMIN_SETTINGS defined: True
```

### Code Quality
```
ruff check . → All checks passed!
mypy . → Success: no issues found in 126 source files
```

## Troubleshooting

### If "ModuleNotFoundError: No module named 'jazzmin'"
1. Check package name in requirements.txt (should be `django-jazzmin`, not `jazzmin`)
2. Verify installation: `pip list | grep jazzmin`
3. Reinstall: `pip install django-jazzmin==3.0.1`

### If Admin Theme Not Appearing
1. Check INSTALLED_APPS order (jazzmin must be before django.contrib.admin)
2. Check app name (should be `'jazzmin'`, not `'django_jazzmin'`)
3. Run collectstatic: `python manage.py collectstatic --noinput`
4. Clear browser cache

### If Docker Build Fails
1. Check SSL/network connectivity (may be infrastructure issue)
2. Verify build context in docker-compose.yml
3. Check Dockerfile paths are relative to context
4. Try: `docker compose build --no-cache backend`

## References

- Django-Jazzmin Documentation: https://django-jazzmin.readthedocs.io/
- Full Diagnostic Report: `diagnostics/JAZZMIN_RUNTIME_FIX.md`
- Investigation Summary: `diagnostics/FINAL_SUMMARY.md`
- Raw Logs: `diagnostics/jazzmin_fix_log.txt`

## Status: ✅ ALL CHECKS PASSED

Last verified: October 25, 2025
