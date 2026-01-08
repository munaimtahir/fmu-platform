/**
 * Navigation configuration with grouped structure
 * Defines sidebar groups, submenus, and role-based access
 */

export interface NavSubItem {
  label: string
  path: string
  roles?: string[]
}

export interface NavGroup {
  label: string
  icon: string
  roles?: string[]
  items: NavSubItem[]
}

export interface NavItem {
  label: string
  path: string
  icon: string
  roles?: string[]
}

export type NavigationItem = NavItem | NavGroup

/**
 * Check if navigation item is a group
 */
export function isNavGroup(item: NavigationItem): item is NavGroup {
  return 'items' in item
}

/**
 * Navigation configuration
 * Groups are collapsible, single items are direct links
 */
export const navigationConfig: NavigationItem[] = [
  // Dashboard (single item)
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: '📊',
    roles: [],
  },
  // Analytics (single item)
  {
    label: 'Analytics',
    path: '/analytics',
    icon: '📈',
    roles: ['Admin'],
  },
  // Students group
  {
    label: 'Students',
    icon: '👥',
    roles: ['Admin', 'Registrar'],
    items: [
      { label: 'Students', path: '/students', roles: ['Admin', 'Registrar'] },
      { label: 'Courses', path: '/courses', roles: ['Admin', 'Registrar', 'Faculty'] },
      { label: 'Sections', path: '/sections', roles: ['Admin', 'Registrar', 'Faculty'] },
      { label: 'Programs', path: '/academics/programs', roles: ['Admin', 'Registrar', 'Coordinator'] },
      { label: 'Batches', path: '/academics/batches', roles: ['Admin', 'Registrar'] },
      { label: 'Academic Periods', path: '/academics/periods', roles: ['Admin', 'Registrar'] },
      { label: 'Groups', path: '/academics/groups', roles: ['Admin', 'Registrar'] },
      { label: 'Departments', path: '/academics/departments', roles: ['Admin', 'Registrar'] },
    ],
  },
  // Timetable group
  {
    label: 'Timetable',
    icon: '📅',
    roles: ['Admin', 'Faculty', 'Registrar', 'Coordinator'],
    items: [
      { label: 'Timetable', path: '/timetable', roles: ['Admin', 'Faculty', 'Registrar', 'Coordinator'] },
    ],
  },
  // Attendance group
  {
    label: 'Attendance',
    icon: '✅',
    roles: ['Admin', 'Faculty'],
    items: [
      { label: 'Attendance', path: '/attendance', roles: ['Admin', 'Faculty'] },
      { label: 'Bulk Attendance', path: '/attendance/bulk', roles: ['Admin', 'Faculty'] },
      { label: 'Eligibility Report', path: '/attendance/eligibility', roles: ['Admin', 'Registrar'] },
    ],
  },
  // Exams & Results group
  {
    label: 'Exams & Results',
    icon: '📋',
    roles: ['Admin', 'Faculty', 'Student', 'ExamCell'],
    items: [
      { label: 'Exams', path: '/exams', roles: ['Admin', 'Faculty', 'ExamCell'] },
      { label: 'Gradebook', path: '/gradebook', roles: ['Admin', 'Faculty', 'Student'] },
      { label: 'Results', path: '/results', roles: ['Admin', 'Faculty', 'Student', 'ExamCell'] },
      { label: 'Publish Results', path: '/examcell/publish', roles: ['Admin', 'ExamCell'] },
      { label: 'Transcripts', path: '/transcripts', roles: ['Admin', 'Registrar', 'Student'] },
    ],
  },
  // Finance group
  {
    label: 'Finance',
    icon: '💰',
    roles: ['Admin', 'Finance', 'Student'],
    items: [
      { label: 'Finance Dashboard', path: '/finance', roles: ['Admin', 'Finance'] },
      { label: 'Fee Plans', path: '/finance/fee-plans', roles: ['Admin', 'Finance'] },
      { label: 'Voucher Generation', path: '/finance/vouchers', roles: ['Admin', 'Finance'] },
      { label: 'Vouchers List', path: '/finance/vouchers/list', roles: ['Admin', 'Finance'] },
      { label: 'Payments', path: '/finance/payments', roles: ['Admin', 'Finance'] },
      { label: 'Collection Report', path: '/finance/reports/collection', roles: ['Admin', 'Finance'] },
      { label: 'Defaulters Report', path: '/finance/reports/defaulters', roles: ['Admin', 'Finance'] },
      { label: 'Aging Report', path: '/finance/reports/aging', roles: ['Admin', 'Finance'] },
      { label: 'Student Statement', path: '/finance/reports/statement', roles: ['Admin', 'Finance', 'Student'] },
      { label: 'My Fees', path: '/finance/me', roles: ['Student'] },
    ],
  },
  // Administration group
  {
    label: 'Administration',
    icon: '⚙️',
    roles: ['Admin'],
    items: [
      { label: 'Users', path: '/admin/users', roles: ['Admin'] },
      { label: 'Roles & Permissions', path: '/admin/roles', roles: ['Admin'] },
      { label: 'Audit Logs', path: '/admin/audit', roles: ['Admin'] },
      { label: 'Student Import', path: '/admin/students/import', roles: ['Admin', 'Coordinator'] },
    ],
  },
]

/**
 * Route policy map: route path pattern -> allowed roles
 * Used for route guards and 403 handling
 */
export const routePolicy: Record<string, string[]> = {
  '/dashboard': [],
  '/analytics': ['Admin'],
  '/students': ['Admin', 'Registrar'],
  '/courses': ['Admin', 'Registrar', 'Faculty'],
  '/sections': ['Admin', 'Registrar', 'Faculty'],
  '/academics/programs': ['Admin', 'Registrar'],
  '/academics/batches': ['Admin', 'Registrar'],
  '/academics/periods': ['Admin', 'Registrar'],
  '/academics/groups': ['Admin', 'Registrar'],
  '/academics/departments': ['Admin', 'Registrar'],
  '/timetable': ['Admin', 'Faculty', 'Registrar', 'Coordinator'],
  '/enrollment/bulk': ['Admin', 'Registrar'],
  '/attendance': ['Admin', 'Faculty'],
  '/attendance/bulk': ['Admin', 'Faculty'],
  '/attendance/eligibility': ['Admin', 'Registrar'],
  '/exams': ['Admin', 'Faculty', 'ExamCell'],
  '/gradebook': ['Admin', 'Faculty', 'Student'],
  '/results': ['Admin', 'Faculty', 'Student', 'ExamCell'],
  '/examcell/publish': ['Admin', 'ExamCell'],
  '/transcripts': ['Admin', 'Registrar', 'Student'],
  '/finance': ['Admin', 'Finance'],
  '/finance/fee-plans': ['Admin', 'Finance'],
  '/finance/vouchers': ['Admin', 'Finance'],
  '/finance/vouchers/list': ['Admin', 'Finance'],
  '/finance/payments': ['Admin', 'Finance'],
  '/finance/reports/collection': ['Admin', 'Finance'],
  '/finance/reports/defaulters': ['Admin', 'Finance'],
  '/finance/reports/aging': ['Admin', 'Finance'],
  '/finance/reports/statement': ['Admin', 'Finance', 'Student'],
  '/finance/me': ['Student'],
  '/admin/users': ['Admin'],
  '/admin/roles': ['Admin'],
  '/admin/audit': ['Admin'],
  '/admin/students/import': ['Admin', 'Coordinator'],
  '/profile': [],
  '/requests': ['Admin', 'Student'],
}

/**
 * Legacy routes that should be hidden from navigation and gated
 * These routes are deprecated and should not be used for new development
 */
export const LEGACY_ROUTES: Set<string> = new Set([
  '/assessments',
  '/requests',
  '/enrollment/bulk',
  '/academics/programs-legacy',
])

/**
 * Check if a route is a legacy route
 */
export function isLegacyRoute(routePath: string): boolean {
  return LEGACY_ROUTES.has(routePath) || routePath.startsWith('/assessments/') || 
         routePath.startsWith('/requests/') || routePath.startsWith('/enrollment/') ||
         routePath.startsWith('/academics/programs-legacy')
}

/**
 * Check if a user role can access a route
 */
export function canAccessRoute(userRole: string | undefined, routePath: string): boolean {
  // Find matching route policy (supports prefix matching)
  const matchingPolicy = Object.entries(routePolicy).find(([pattern]) => 
    routePath === pattern || routePath.startsWith(`${pattern}/`)
  )
  
  if (!matchingPolicy) {
    // If no policy found, allow access (default permissive for backward compatibility)
    return true
  }
  
  const allowedRoles = matchingPolicy[1]
  
  // Empty array means all authenticated users can access
  if (allowedRoles.length === 0) {
    return true
  }
  
  if (!userRole) {
    return false
  }
  
  return allowedRoles.includes(userRole)
}
