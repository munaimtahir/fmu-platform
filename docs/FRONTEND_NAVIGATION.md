# Frontend Navigation Documentation

## Overview

The SIMS frontend uses a grouped navigation structure with collapsible submenus. Navigation items are role-aware and only visible to users with appropriate permissions.

## Navigation Structure

### Top-Level Groups

1. **Dashboard** - Single item, accessible to all authenticated users
2. **Analytics** - Single item, Admin only
3. **Students** - Group with submenu items
4. **Timetable & Enrollment** - Group with submenu items
5. **Attendance** - Group with submenu items
6. **Assessments & Results** - Group with submenu items
7. **Finance** - Group with submenu items
8. **Administration** - Group with submenu items, Admin only

### Group Details

#### Students Group
- **Students** - `/students` (Admin, Registrar)
- **Courses** - `/courses` (Admin, Registrar, Faculty)
- **Sections** - `/sections` (Admin, Registrar, Faculty)
- **Programs** - `/academics/programs` (Admin, Registrar)
- **Batches** - `/academics/batches` (Admin, Registrar)
- **Academic Periods** - `/academics/periods` (Admin, Registrar)
- **Groups** - `/academics/groups` (Admin, Registrar)
- **Departments** - `/academics/departments` (Admin, Registrar)

#### Timetable & Enrollment Group
- **Timetable** - `/timetable` (Admin, Faculty, Registrar, Coordinator)
- **Bulk Enrollment** - `/enrollment/bulk` (Admin, Registrar)

#### Attendance Group
- **Attendance** - `/attendance` (Admin, Faculty)
- **Bulk Attendance** - `/attendance/bulk` (Admin, Faculty)
- **Eligibility Report** - `/attendance/eligibility` (Admin, Registrar)

#### Assessments & Results Group
- **Assessments** - `/assessments` (Admin, Faculty)
- **Gradebook** - `/gradebook` (Admin, Faculty, Student)
- **Results** - `/results` (Admin, Faculty, Student, ExamCell)
- **Publish Results** - `/examcell/publish` (Admin, ExamCell)

#### Finance Group
- **Finance Dashboard** - `/finance` (Admin, Finance)
- **Fee Plans** - `/finance/fee-plans` (Admin, Finance)
- **Voucher Generation** - `/finance/vouchers` (Admin, Finance)
- **Vouchers List** - `/finance/vouchers/list` (Admin, Finance)
- **Payments** - `/finance/payments` (Admin, Finance)
- **Collection Report** - `/finance/reports/collection` (Admin, Finance)
- **Defaulters Report** - `/finance/reports/defaulters` (Admin, Finance)
- **Aging Report** - `/finance/reports/aging` (Admin, Finance)
- **Student Statement** - `/finance/reports/statement` (Admin, Finance, Student)
- **My Fees** - `/finance/me` (Student)

#### Administration Group
- **Users** - `/admin/users` (Admin)
- **Roles & Permissions** - `/admin/roles` (Admin)
- **Audit Logs** - `/admin/audit` (Admin)
- **Student Import** - `/admin/students/import` (Admin, Coordinator)

## User Menu

The user menu is accessible from the top-right corner of the application and includes:

- **My Profile** - `/profile` - View and manage user account information
- **Change Password** - Coming soon (requires backend endpoint)
- **Logout** - Sign out of the application

## Role-Based Access Control (RBAC)

### Implementation

1. **UI Visibility**: Navigation items are filtered based on user role using the `canAccessItem` function
2. **Route Guards**: All routes are protected using `ProtectedRoute` component with role checks
3. **Route Policy**: Centralized route policy map in `navConfig.ts` defines allowed roles for each route
4. **403 Handling**: Unauthorized access attempts show a friendly "Access Denied" page

### Role Definitions

- **Admin**: Full system access
- **Registrar**: Enrollment, results approval, transcript issuance
- **Faculty**: Attendance and assessments for assigned sections
- **Student**: View-only access to own records
- **ExamCell**: Results publication and freezing
- **Finance**: Financial operations and reports
- **Coordinator**: Student import and bulk operations

### Route Protection

Routes are protected at multiple levels:

1. **Navigation Visibility**: Items hidden from users without access
2. **Route Guards**: `ProtectedRoute` component checks `allowedRoles` prop
3. **Route Policy**: `canAccessRoute` function validates against route policy map
4. **Backend Validation**: API endpoints enforce permissions (source of truth)

## Navigation Features

### Sidebar Behavior

- **Collapsible Groups**: Groups can be expanded/collapsed
- **Persistent State**: Expanded groups are saved to localStorage
- **Active Highlighting**: Current route is highlighted
- **Auto-expand**: Groups automatically expand when a subitem is active
- **Responsive**: Mobile drawer with overlay

### Icons

- One icon per group (not per item)
- Submenu items are text-first
- Icons use emoji for visual clarity

## Configuration

Navigation configuration is defined in `frontend/src/config/navConfig.ts`:

- `navigationConfig`: Array of navigation items (groups or single items)
- `routePolicy`: Map of route paths to allowed roles
- `canAccessRoute`: Function to check route access

## Future Enhancements

- Breadcrumb navigation
- Search functionality
- Keyboard navigation
- Customizable navigation order (user preferences)
