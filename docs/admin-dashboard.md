# Admin Dashboard

## Purpose

The Admin Dashboard provides a comprehensive overview of system statistics, recent activity, and system health for administrators.

## API Endpoints

### GET /api/admin/dashboard/

Returns dashboard overview data including:
- **counts**: Total students, faculty, programs, courses
- **attendance_stats**: Last 7 days attendance summary (total marked, absent %, late %, missing entries)
- **recent_activity**: Last 20 audit log entries
- **system**: App version, server time, environment label, Django version

**Permissions**: ADMIN only

**Response Example**:
```json
{
  "counts": {
    "students": 150,
    "faculty": 25,
    "programs": 5,
    "courses": 45
  },
  "attendance_stats": {
    "last_7_days": {
      "total_marked": 1200,
      "absent_percent": 5.2,
      "late_percent": 3.1,
      "missing_entries": 15
    }
  },
  "recent_activity": [
    {
      "id": "uuid",
      "actor": "admin1",
      "action": "create",
      "entity": "Student",
      "timestamp": "2024-01-15T10:30:00Z",
      "summary": "Created student: ST001"
    }
  ],
  "system": {
    "app_version": "1.0.0",
    "server_time": "2024-01-15T10:30:00Z",
    "env_label": "production",
    "django_version": "5.1.4"
  }
}
```

## Permissions

- **Access**: ADMIN role only
- **Backend Permission Class**: `IsAdmin`
- **Frontend Route Protection**: `ProtectedRoute` with `allowedRoles={['Admin']}`

## UI Route

- **Path**: `/admin/dashboard`
- **Component**: `AdminDashboardPage`
- **Location**: `frontend/src/pages/admin/AdminDashboardPage.tsx`

## Features

1. **Statistics Cards**: Display counts for students, faculty, programs, and courses
2. **Attendance Summary**: Shows last 7 days attendance metrics
3. **Recent Activity Table**: Displays last 20 audit log entries with actor, action, entity, and timestamp
4. **System Information**: Shows app version, environment, Django version, and server time

## How to Verify

### Manual Steps

1. **Login as Admin**:
   ```bash
   # Use admin credentials
   curl -X POST http://127.0.0.1:8080/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"identifier": "admin", "password": "password"}'
   ```

2. **Access Dashboard Endpoint**:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" \
     http://127.0.0.1:8080/api/admin/dashboard/
   ```

3. **Verify Frontend**:
   - Navigate to `/admin/dashboard` in the browser
   - Verify all cards display correct counts
   - Check attendance stats are calculated correctly
   - Verify recent activity table shows audit log entries
   - Confirm system info displays correctly

### Automated Tests

```bash
# Backend tests
cd backend
pytest sims_backend/admin/tests.py::TestAdminDashboard -v

# E2E tests (if added)
cd frontend
npx playwright test admin-dashboard.spec.ts
```

## Known Limitations

- Attendance stats are calculated for the last 7 days only
- Recent activity is limited to 20 entries
- System version info is hardcoded (should be from settings or build info)
- Faculty count uses group membership (FACULTY group)

## Implementation Details

- **Backend**: `sims_backend/admin/views.py::admin_dashboard`
- **Frontend**: `frontend/src/pages/admin/AdminDashboardPage.tsx`
- **API Client**: `frontend/src/api/dashboard.ts::getAdminDashboard`
