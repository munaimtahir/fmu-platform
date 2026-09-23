/**
 * Sidebar structure.  Visibility is NOT declared here: each entry is shown when
 * the user can open its route, using the rules in `config/routeAccess.ts`.
 */

export interface NavSubItem {
  label: string
  path: string
}

export interface NavGroup {
  label: string
  icon: string
  items: NavSubItem[]
}

export interface NavItem {
  label: string
  path: string
  icon: string
}

export type NavigationItem = NavItem | NavGroup

export function isNavGroup(item: NavigationItem): item is NavGroup {
  return 'items' in item
}

export const navigationConfig: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Announcements / Notifications', path: '/notifications', icon: '🔔' },
  { label: 'Analytics', path: '/analytics', icon: '📈' },
  {
    label: 'Students',
    icon: '👥',
    items: [
      { label: 'People', path: '/people' },
      { label: 'Students', path: '/students' },
      { label: 'Compliance', path: '/compliance' },
      { label: 'My Compliance', path: '/my-compliance' },
      { label: 'Profile Onboarding', path: '/student/onboarding' },
    ],
  },
  {
    label: 'Academics',
    icon: '🎓',
    items: [
      { label: 'Courses', path: '/courses' },
      { label: 'Sections', path: '/sections' },
      { label: 'Programs', path: '/academics/programs' },
      { label: 'Batches', path: '/academics/batches' },
      { label: 'Academic Periods', path: '/academics/periods' },
      { label: 'Groups', path: '/academics/groups' },
      { label: 'Departments', path: '/academics/departments' },
    ],
  },
  {
    label: 'Timetable',
    icon: '📅',
    items: [{ label: 'Timetable', path: '/timetable' }],
  },
  {
    label: 'Attendance',
    icon: '✅',
    items: [
      { label: 'Attendance', path: '/attendance' },
      { label: 'Attendance Input', path: '/attendance/input' },
      { label: 'Bulk Attendance', path: '/attendance/bulk' },
      { label: 'Eligibility Report', path: '/attendance/eligibility' },
    ],
  },
  {
    label: 'Learning',
    icon: '📚',
    items: [
      { label: 'Learning Materials', path: '/learning/manage' },
      { label: 'My Learning', path: '/learning' },
    ],
  },
  {
    label: 'Exams & Results',
    icon: '📋',
    items: [
      { label: 'Exams', path: '/exams' },
      { label: 'Gradebook', path: '/gradebook' },
      { label: 'Results', path: '/results' },
      { label: 'Result Corrections', path: '/results/corrections' },
      { label: 'Publish Results', path: '/examcell/publish' },
      { label: 'Transcripts', path: '/transcripts' },
    ],
  },
  {
    label: 'Finance',
    icon: '💰',
    items: [
      { label: 'Finance Dashboard', path: '/finance' },
      { label: 'Fee Types', path: '/finance/fee-types' },
      { label: 'Fee Plans', path: '/finance/fee-plans' },
      { label: 'Voucher Generation', path: '/finance/vouchers' },
      { label: 'Vouchers List', path: '/finance/vouchers/list' },
      { label: 'Payments', path: '/finance/payments' },
      { label: 'Ledger', path: '/finance/ledger' },
      { label: 'Adjustments', path: '/finance/adjustments' },
      { label: 'Finance Policies', path: '/finance/policies' },
      { label: 'Collection Report', path: '/finance/reports/collection' },
      { label: 'Defaulters Report', path: '/finance/reports/defaulters' },
      { label: 'Aging Report', path: '/finance/reports/aging' },
      { label: 'Student Statement', path: '/finance/reports/statement' },
      { label: 'My Fees', path: '/finance/me' },
    ],
  },
  {
    label: 'Communication',
    icon: '📣',
    items: [{ label: 'Notification Administration', path: '/notifications/manage' }],
  },
  {
    label: 'Administration',
    icon: '⚙️',
    items: [
      { label: 'Users', path: '/system/users' },
      { label: 'Roles & Permissions', path: '/system/roles' },
      { label: 'Audit Logs', path: '/system/audit' },
      { label: 'Student Import', path: '/system/students/import' },
      { label: 'Faculty Import', path: '/system/faculty/import' },
      { label: 'Syllabus', path: '/system/syllabus' },
      { label: 'Settings', path: '/system/settings' },
    ],
  },
]
