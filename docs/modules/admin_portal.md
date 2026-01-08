# Admin Portal Module Specification

## Purpose + Boundaries

**Purpose:** Frontend admin dashboard linking all module entry points.

**Owns:**
- Admin dashboard UI
- Navigation structure
- Role-aware UI rendering
- Module entry point links

**Locked Decision:** Single admin dashboard screen that links to all defined module entry points; UI must respect roles/permission tasks.

## Frontend Structure

### Admin Dashboard
- Single dashboard screen (`/dashboard/admin`)
- Links to all module entry points:
  - Core (Users, Roles, Permissions)
  - Audit (Audit Logs)
  - People (Identity Management)
  - Academics (Programs, Courses, Sections)
  - Students (Student Registry)
  - Requests (Change Requests)
  - Enrollment (Enrollment Management)
  - Finance (Fee Plans, Vouchers, Payments)
  - Attendance (Attendance Records, Eligibility)
  - Assessments (Assessment Definitions)
  - Results (Result Management)
  - Documents (Document Generation)
  - Notifications (Message Templates, History)

### Student Portal
- Profile view (`/dashboard/student`)
- Request tracking page (once Requests module exists)
- "Request change" pathway with status tracking

### Navigation
- Role-aware navigation (only show links user has permission for)
- Permission task-based route guards
- Breadcrumb navigation

## Implementation Requirements

1. **Admin Dashboard Component**
   - Grid/card layout with module entry points
   - Each card links to module's main page
   - Show module status/statistics if applicable
   - Role-based visibility

2. **Route Guards**
   - Check permission tasks before rendering links
   - Redirect unauthorized users
   - Show appropriate error messages

3. **Navigation**
   - Sidebar with module links
   - Topbar with user info
   - Breadcrumbs for deep navigation

## Tests Required

1. Dashboard rendering tests
2. Permission-based visibility tests
3. Navigation tests
4. Route guard tests
