# Core Module Specification

## Purpose + Boundaries

**Purpose:** System foundation and rule authority. Core provides shared rules, enums, permissions, and base models that all other modules depend on.

**Owns:**
- Users (extends Django User)
- Roles (custom role management)
- PermissionTasks (task-based RBAC)
- RoleTaskAssignment (assign tasks to roles)
- UserTaskAssignment (assign tasks directly to users)
- Base models (TimeStampedModel, etc.)
- Global enums/constants
- Shared validators
- Permission checking helpers

**Must NOT own:**
- Domain-specific models (those belong to their modules)
- Business logic (belongs to domain modules)
- Audit events (belongs to audit module)

## Models

### User (extends Django AUTH_USER_MODEL)
- Inherits Django's User model
- Extended via Profile/FacultyProfile
- Used by all modules for actor identification

### Role
- `name`: CharField, unique
- `description`: TextField, optional
- `is_system_role`: BooleanField (true for built-ins like Admin, Student)
- `created_at`, `updated_at`: DateTimeField

### PermissionTask
- `code`: CharField, unique (e.g., "students.view", "enrollment.create")
- `name`: CharField (human-readable)
- `description`: TextField
- `module`: CharField (e.g., "students", "enrollment")
- `created_at`, `updated_at`: DateTimeField

### RoleTaskAssignment
- `role`: ForeignKey(Role)
- `task`: ForeignKey(PermissionTask)
- `created_at`: DateTimeField
- Unique constraint: (role, task)

### UserTaskAssignment
- `user`: ForeignKey(User)
- `task`: ForeignKey(PermissionTask)
- `granted_by`: ForeignKey(User, related_name="granted_tasks")
- `created_at`: DateTimeField
- Unique constraint: (user, task)

### TimeStampedModel (Abstract)
- `created_at`: DateTimeField, auto_now_add
- `updated_at`: DateTimeField, auto_now
- Abstract base class for all models

### Profile (extends TimeStampedModel)
- `user`: OneToOneField(User)
- `phone`: CharField, optional
- `date_of_birth`: DateField, optional

### FacultyProfile (extends TimeStampedModel)
- `user`: OneToOneField(User)
- `department`: ForeignKey(academics.Department), optional

## APIs

### `/api/core/roles/`
- **GET /api/core/roles/**: List roles
  - Permission: `core.roles.view`
  - Response: `[{id, name, description, is_system_role, created_at}]`

- **POST /api/core/roles/**: Create role
  - Permission: `core.roles.create`
  - Request: `{name, description, is_system_role?}`
  - Response: `{id, name, description, is_system_role, created_at}`

- **GET /api/core/roles/{id}/**: Get role details
  - Permission: `core.roles.view`
  - Response: `{id, name, description, is_system_role, created_at, task_assignments: [...]}`

- **PATCH /api/core/roles/{id}/**: Update role
  - Permission: `core.roles.update`
  - Request: `{description?}`
  - Note: `name` and `is_system_role` are immutable

- **DELETE /api/core/roles/{id}/**: Delete role
  - Permission: `core.roles.delete`
  - Validation: Cannot delete system roles

### `/api/core/permission-tasks/`
- **GET /api/core/permission-tasks/**: List tasks
  - Permission: `core.permission_tasks.view`
  - Filters: `module`, `code__contains`
  - Response: `[{id, code, name, description, module, created_at}]`

- **GET /api/core/permission-tasks/{id}/**: Get task details
  - Permission: `core.permission_tasks.view`
  - Response: `{id, code, name, description, module, created_at}`

### `/api/core/role-task-assignments/`
- **GET /api/core/role-task-assignments/**: List assignments
  - Permission: `core.role_task_assignments.view`
  - Filters: `role`, `task`
  - Response: `[{id, role: {id, name}, task: {id, code, name}, created_at}]`

- **POST /api/core/role-task-assignments/**: Assign task to role
  - Permission: `core.role_task_assignments.create`
  - Request: `{role: id, task: id}`
  - Response: `{id, role, task, created_at}`

- **DELETE /api/core/role-task-assignments/{id}/**: Remove assignment
  - Permission: `core.role_task_assignments.delete`

### `/api/core/user-task-assignments/`
- **GET /api/core/user-task-assignments/**: List assignments
  - Permission: `core.user_task_assignments.view`
  - Filters: `user`, `task`
  - Object-level: Users can view their own assignments

- **POST /api/core/user-task-assignments/**: Assign task to user
  - Permission: `core.user_task_assignments.create`
  - Request: `{user: id, task: id}`
  - Response: `{id, user, task, granted_by, created_at}`

- **DELETE /api/core/user-task-assignments/{id}/**: Remove assignment
  - Permission: `core.user_task_assignments.delete`

### `/api/core/users/me/`
- **GET /api/core/users/me/**: Get current user info with permissions
  - Permission: `IsAuthenticated`
  - Response: `{id, username, email, roles: [...], tasks: [...], profile: {...}}`

## Permission Checking Helpers

### `has_permission_task(user, task_code: str) -> bool`
Checks if user has a permission task either via:
1. Direct user assignment
2. Role assignment (user belongs to a role with the task)

### `has_any_permission_task(user, task_codes: list[str]) -> bool`
Checks if user has any of the specified tasks.

### `has_all_permission_tasks(user, task_codes: list[str]) -> bool`
Checks if user has all of the specified tasks.

### PermissionTaskRequired (DRF Permission Class)
```python
class PermissionTaskRequired(BasePermission):
    required_tasks = []  # Override in view
    
    def has_permission(self, request, view):
        return has_any_permission_task(request.user, self.required_tasks)
```

## Workflows / State Machines

N/A (Core has no lifecycle states)

## Validations + Conflict Handling

- Role name uniqueness enforced at DB level
- PermissionTask code uniqueness enforced at DB level
- Cannot delete system roles
- Cannot unassign core tasks from system roles if they're required

## Frontend Screens

### Admin Screens
- **Role Management**: `/admin/roles`
  - List roles, create/edit roles
  - Assign/unassign tasks to roles
  - View role details with task list

- **Permission Tasks**: `/admin/permission-tasks`
  - Browse all permission tasks by module
  - View task details

- **User Task Assignments**: `/admin/user-tasks`
  - Assign tasks directly to users (override role defaults)
  - List user-specific task assignments

### Student Screens
- **Profile View**: `/profile`
  - View own profile information
  - View own assigned tasks and roles

## Tests Required

1. **CRUD Tests**
   - Create/read/update/delete roles
   - Create/read permission tasks
   - Create/delete role-task assignments
   - Create/delete user-task assignments

2. **Permission Tests**
   - `has_permission_task()` helper tests
   - PermissionTaskRequired permission class tests
   - Object-level permission tests (users can view own assignments)

3. **Validation Tests**
   - Cannot delete system roles
   - Cannot create duplicate role names
   - Cannot create duplicate permission task codes

4. **Workflow Test**
   - End-to-end: Create role → assign tasks → assign role to user → verify user has tasks