# Curl Test Artifacts

This directory contains saved curl command outputs for API verification.

## Required Tests

### 1. Authentication Tests
- `login_success.txt` - POST /api/auth/login/ with valid credentials (expected: 200)
- `login_failure.txt` - POST /api/auth/login/ with invalid credentials (expected: 401)

### 2. RBAC Enforcement
- `rbac_admin_access.txt` - Admin endpoint with admin token (expected: 200)
- `rbac_non_admin_denied.txt` - Admin endpoint with non-admin token (expected: 403)

### 3. Admin Endpoints
- `admin_dashboard.txt` - GET /api/admin/dashboard/
- `admin_syllabus_list.txt` - GET /api/admin/syllabus/
- `admin_settings.txt` - GET /api/admin/settings/
- `admin_users.txt` - GET /api/admin/users/

### 4. Academics CRUD Cycle
- `program_create.txt` - POST /api/academics/programs/
- `program_list.txt` - GET /api/academics/programs/
- `program_delete.txt` - DELETE /api/academics/programs/<id>/

### 5. Students CRUD Cycle
- `student_create.txt` - POST /api/students/
- `student_list.txt` - GET /api/students/
- `student_delete.txt` - DELETE /api/students/<id>/

## Execution Commands

```bash
# Get admin token first
TOKEN=$(curl -X POST http://127.0.0.1:8010/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}' | jq -r '.tokens.access')

# Then use token for protected endpoints
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8010/api/admin/dashboard/ > admin_dashboard.txt
```

## Status

**Note:** These files are placeholders. Actual curl outputs need to be generated in proper environment with running stack.

---

**Last Updated:** 2026-01-09
