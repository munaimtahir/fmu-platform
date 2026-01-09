# Admin Settings

## Purpose

The Admin Settings page allows administrators to configure system behavior without deployments. Settings are controlled by an allowlist for security.

## API Endpoints

### GET /api/admin/settings/

List all app settings.

**Permissions**: ADMIN only

### GET /api/admin/settings/allowed_keys/

Get list of allowed setting keys with metadata.

**Response Example**:
```json
[
  {
    "key": "enable_student_portal",
    "type": "boolean",
    "description": "Enable student portal access",
    "current_value": true
  },
  {
    "key": "attendance_lock_days",
    "type": "integer",
    "description": "Number of days after which attendance is locked",
    "current_value": 7
  }
]
```

### PATCH /api/admin/settings/{key}/

Update a setting by key.

**Request Body**:
```json
{
  "value_json": true,
  "value_type": "boolean"
}
```

### POST /api/admin/settings/

Create a new setting (if not exists).

## Allowed Settings

The following settings are allowed (defined in `AppSetting.ALLOWED_KEYS`):

1. **default_academic_year_id** (integer)
   - Default academic year ID
   - Validation: Must be positive integer

2. **attendance_lock_days** (integer)
   - Number of days after which attendance is locked
   - Validation: 0-365

3. **enable_student_portal** (boolean)
   - Enable student portal access

4. **enable_faculty_portal** (boolean)
   - Enable faculty portal access

5. **ui_banner_message** (string)
   - Banner message displayed in UI
   - Validation: Max 500 characters

## Permissions

- **Access**: ADMIN role only
- **Backend Permission Class**: `IsAdmin`
- **Frontend Route Protection**: `ProtectedRoute` with `allowedRoles={['Admin']}`

## UI Route

- **Path**: `/admin/settings`
- **Component**: `AdminSettingsPage`
- **Location**: `frontend/src/pages/admin/AdminSettingsPage.tsx`

## Features

1. **Grouped Settings**: Settings are grouped by category:
   - Academic Defaults
   - Attendance Rules
   - Feature Toggles
   - UI Messages

2. **Type-Specific Controls**:
   - Boolean: Toggle switch (auto-saves)
   - Integer: Number input or dropdown (for academic year)
   - String: Text input or textarea (for banner message)

3. **Auto-Save**: Boolean settings save automatically on change
4. **Manual Save**: Integer and string settings require explicit save button

## How to Verify

### Manual Steps

1. **Get Allowed Keys**:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" \
     http://127.0.0.1:8080/api/admin/settings/allowed_keys/
   ```

2. **Update a Setting**:
   ```bash
   curl -X PATCH http://127.0.0.1:8080/api/admin/settings/enable_student_portal/ \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"value_json": false, "value_type": "boolean"}'
   ```

3. **Verify Frontend**:
   - Navigate to `/admin/settings`
   - Toggle boolean settings (should auto-save)
   - Update integer settings (click Save)
   - Update string settings (click Save)
   - Verify settings persist after page refresh

### Automated Tests

```bash
# Backend tests
cd backend
pytest sims_backend/settings_app/tests.py -v
```

## Security Notes

- **No Secrets**: Only safe settings are allowed (no passwords, API keys, etc.)
- **Allowlist Enforcement**: Backend validates keys against allowlist
- **Type Validation**: Values are validated against expected types
- **Audit Logging**: All setting changes are logged with `updated_by` user

## Known Limitations

- Settings are not cached (each request queries database)
- No setting history/versioning (only current value stored)
- Academic year dropdown uses programs (may need adjustment if academic year model exists)

## Implementation Details

- **Backend Model**: `sims_backend/settings_app/models.py::AppSetting`
- **Backend ViewSet**: `sims_backend/settings_app/views.py::AppSettingViewSet`
- **Frontend**: `frontend/src/pages/admin/AdminSettingsPage.tsx`
- **API Client**: `frontend/src/api/settings.ts`
