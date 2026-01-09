# Test Verification Guide - Tasks 63-66

## Overview

This document outlines the steps to verify all tests for the Admin Control Plane implementation (Tasks 63-66).

## Prerequisites

1. **Rebuild Docker containers** to include new modules:
   ```bash
   docker compose down
   docker compose build backend
   docker compose up -d
   ```

2. **Run migrations** for new models:
   ```bash
   docker compose exec backend python manage.py migrate
   ```

## Backend Tests

### Test Structure

New test files created:
- `backend/sims_backend/admin/tests.py` - Admin dashboard and user management tests
- `backend/sims_backend/syllabus/tests.py` - Syllabus manager tests
- `backend/sims_backend/settings_app/tests.py` - Settings tests

### Running Tests

#### Option 1: Using Docker (Recommended)

```bash
# Test Admin Dashboard
docker compose exec backend pytest sims_backend/admin/tests.py::TestAdminDashboard -v

# Test Admin Users
docker compose exec backend pytest sims_backend/admin/tests.py::TestAdminUsers -v

# Test Syllabus Manager
docker compose exec backend pytest sims_backend/syllabus/tests.py -v

# Test Settings
docker compose exec backend pytest sims_backend/settings_app/tests.py -v

# Run all admin-related tests
docker compose exec backend pytest sims_backend/admin/tests.py sims_backend/syllabus/tests.py sims_backend/settings_app/tests.py -v
```

#### Option 2: Using Makefile

```bash
# This should work after rebuilding containers
make test
```

#### Option 3: Local Python Environment

```bash
cd backend
# Install dependencies (if not in virtualenv)
pip install -r requirements.txt

# Set environment variables
export DJANGO_SETTINGS_MODULE=sims_backend.test_settings
export DB_ENGINE=django.db.backends.sqlite3
export DB_NAME=:memory:

# Run tests
pytest sims_backend/admin/tests.py -v
pytest sims_backend/syllabus/tests.py -v
pytest sims_backend/settings_app/tests.py -v
```

### Expected Test Results

#### Admin Dashboard Tests
- ✅ `test_non_admin_gets_403` - Non-admin users should get 403
- ✅ `test_admin_gets_dashboard_data` - Admin should get dashboard data with correct keys

#### Admin Users Tests
- ✅ `test_non_admin_gets_403` - Non-admin users should get 403
- ✅ `test_admin_can_list_users` - Admin can list users
- ✅ `test_admin_can_create_user` - Admin can create a new user
- ✅ `test_admin_can_update_user` - Admin can update a user
- ✅ `test_admin_can_reset_password` - Admin can reset user password
- ✅ `test_admin_can_activate_deactivate` - Admin can activate/deactivate users
- ✅ `test_cannot_deactivate_last_admin` - Cannot deactivate the last admin user
- ✅ `test_admin_can_filter_by_role` - Admin can filter users by role

#### Syllabus Manager Tests
- ✅ `test_non_admin_gets_403` - Non-admin users should get 403
- ✅ `test_admin_can_list_syllabus_items` - Admin can list syllabus items
- ✅ `test_admin_can_create_syllabus_item` - Admin can create syllabus items
- ✅ `test_admin_can_filter_by_program` - Admin can filter syllabus items by program
- ✅ `test_admin_can_reorder_items` - Admin can bulk reorder syllabus items
- ✅ `test_validation_requires_at_least_one_anchor` - Syllabus item must have at least one academic anchor

#### Settings Tests
- ✅ `test_non_admin_gets_403` - Non-admin users should get 403
- ✅ `test_admin_can_list_settings` - Admin can list settings
- ✅ `test_admin_can_create_setting` - Admin can create a new setting
- ✅ `test_admin_can_update_setting` - Admin can update an existing setting
- ✅ `test_invalid_key_rejected` - Invalid keys are rejected
- ✅ `test_invalid_value_rejected` - Invalid values are rejected
- ✅ `test_get_allowed_keys` - Admin can get list of allowed keys

## Frontend Tests

### Test Structure

Frontend tests should be added for:
- Admin Dashboard page
- Syllabus Manager page
- Admin Settings page
- Admin Users page

### Running Frontend Tests

```bash
cd frontend

# If using Vitest/Jest
npm test

# If using Playwright for component tests
npx playwright test --ui
```

### Expected Test Coverage

- Component rendering
- Form validation
- API integration (mocking)
- User interactions

## E2E Tests (Playwright)

### Running E2E Tests

```bash
cd frontend

# Run all E2E tests
npx playwright test --reporter=list

# Run specific admin tests (if created)
npx playwright test admin --reporter=list

# Run with UI
npx playwright test --ui
```

### Expected Results

- ✅ All existing E2E tests should remain green (11/11)
- New E2E tests should be added for:
  - Admin dashboard access
  - Syllabus CRUD operations
  - Settings updates
  - User management operations

### Adding New E2E Tests

Create test files in `frontend/e2e/`:
- `admin-dashboard.spec.ts`
- `admin-syllabus.spec.ts`
- `admin-settings.spec.ts`
- `admin-users.spec.ts`

## Manual Verification

### 1. Backend API Verification

```bash
# Get admin token
TOKEN=$(curl -X POST http://127.0.0.1:8080/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"identifier": "admin", "password": "admin123"}' \
  | jq -r '.tokens.access')

# Test Admin Dashboard
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8080/api/admin/dashboard/ | jq

# Test Syllabus List
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8080/api/admin/syllabus/ | jq

# Test Settings Allowed Keys
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8080/api/admin/settings/allowed_keys/ | jq

# Test Users List
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8080/api/admin/users/ | jq
```

### 2. Frontend UI Verification

1. **Login as Admin**: Navigate to `/login` and login with admin credentials
2. **Admin Dashboard**: Navigate to `/admin/dashboard` and verify:
   - Statistics cards display correctly
   - Attendance summary shows data
   - Recent activity table displays audit logs
   - System info displays correctly

3. **Syllabus Manager**: Navigate to `/admin/syllabus` and verify:
   - Filters work (Program → Period → Block → Module)
   - Create new syllabus item
   - Edit existing item
   - Reorder items (move up/down)
   - Delete item

4. **Admin Settings**: Navigate to `/admin/settings` and verify:
   - Settings are grouped by category
   - Boolean toggles auto-save
   - Integer/string settings can be saved manually
   - Settings persist after page refresh

5. **Admin Users**: Navigate to `/admin/users` and verify:
   - User list displays correctly
   - Search and filters work
   - Create new user
   - Edit user
   - Reset password (verify temp password is shown)
   - Activate/deactivate users
   - Try to deactivate last admin (should fail)

## Troubleshooting

### Tests not found in Docker container

**Problem**: `ModuleNotFoundError: No module named 'sims_backend.admin'`

**Solution**: Rebuild the Docker container:
```bash
docker compose build backend
docker compose up -d
```

### Migration errors

**Problem**: `django.db.utils.OperationalError: no such table: syllabus_syllabusitem`

**Solution**: Run migrations:
```bash
docker compose exec backend python manage.py migrate
```

### Permission errors

**Problem**: Tests fail with 403 errors

**Solution**: Ensure admin user fixture is properly configured in `tests/conftest.py`

### Import errors in tests

**Problem**: `ImportError: cannot import name 'X' from 'sims_backend.admin'`

**Solution**: Verify all imports in test files match actual module structure

## Test Coverage Goals

- **Backend**: Minimum 80% coverage for new modules
- **Frontend**: Component tests for all new pages
- **E2E**: Critical user flows covered

## Next Steps

1. ✅ Rebuild Docker containers
2. ✅ Run migrations
3. ⏳ Run backend tests
4. ⏳ Run frontend tests (if configured)
5. ⏳ Run E2E tests
6. ⏳ Manual verification
7. ✅ Document results
