# Admin Users

## Purpose

The Admin Users page allows administrators to manage user accounts, roles, and permissions.

## API Endpoints

### GET /api/admin/users/

List users with optional filters:
- `role`: Filter by role (group name)
- `is_active`: Filter by active status
- `q`: Search by username, email, first_name, last_name

**Permissions**: ADMIN only

### POST /api/admin/users/

Create a new user.

**Request Body**:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "temp123",
  "is_active": true,
  "role": "FACULTY"
}
```

### PATCH /api/admin/users/{id}/

Update a user.

**Request Body**:
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "is_active": false,
  "role": "STUDENT"
}
```

### DELETE /api/admin/users/{id}/

Deactivate a user (soft delete).

### POST /api/admin/users/{id}/reset-password/

Reset user password and return temporary password.

**Response**:
```json
{
  "success": true,
  "temporary_password": "abc123xyz456",
  "message": "Password reset successfully. Share this temporary password with the user."
}
```

### POST /api/admin/users/{id}/activate/

Activate a user.

### POST /api/admin/users/{id}/deactivate/

Deactivate a user.

**Guardrail**: Cannot deactivate the last admin user.

## Permissions

- **Access**: ADMIN role only
- **Backend Permission Class**: `IsAdmin`
- **Frontend Route Protection**: `ProtectedRoute` with `allowedRoles={['Admin']}`

## UI Route

- **Path**: `/admin/users`
- **Component**: `UsersPage`
- **Location**: `frontend/src/pages/admin/UsersPage.tsx`

## Features

1. **User List Table**: Display users with username, name, email, role, status, last login
2. **Search and Filters**: Search by name/email/username, filter by role and status
3. **Create User**: Form to create new users with role assignment
4. **Edit User**: Update user details and role
5. **Reset Password**: Generate temporary password (displayed in modal)
6. **Activate/Deactivate**: Toggle user active status
7. **Delete**: Soft delete (deactivate) users

## Guardrails

1. **Last Admin Protection**: Cannot deactivate or delete the last admin user
2. **Audit Logging**: All user operations are logged in audit log
3. **Password Security**: Passwords are hashed (never stored in plain text)

## How to Verify

### Manual Steps

1. **List Users**:
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" \
     http://127.0.0.1:8080/api/admin/users/
   ```

2. **Create User**:
   ```bash
   curl -X POST http://127.0.0.1:8080/api/admin/users/ \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "first_name": "Test",
       "last_name": "User",
       "password": "temp123",
       "is_active": true,
       "role": "FACULTY"
     }'
   ```

3. **Reset Password**:
   ```bash
   curl -X POST http://127.0.0.1:8080/api/admin/users/1/reset-password/ \
     -H "Authorization: Bearer <TOKEN>"
   ```

4. **Verify Frontend**:
   - Navigate to `/admin/users`
   - Test search and filters
   - Create a new user
   - Edit an existing user
   - Reset password (verify temporary password is shown)
   - Activate/deactivate users
   - Try to deactivate last admin (should fail)

### Automated Tests

```bash
# Backend tests
cd backend
pytest sims_backend/admin/tests.py::TestAdminUsers -v
```

## Known Limitations

- Password reset returns temporary password (no email sending implemented)
- User deletion is soft delete (deactivation) only
- Role assignment uses group membership (single role per user)
- No bulk operations (create/update/delete multiple users at once)

## Implementation Details

- **Backend ViewSet**: `sims_backend/admin/views.py::AdminUserViewSet`
- **Backend Serializers**: `sims_backend/admin/serializers.py`
- **Frontend**: `frontend/src/pages/admin/UsersPage.tsx`
- **API Client**: `frontend/src/api/users.ts`
