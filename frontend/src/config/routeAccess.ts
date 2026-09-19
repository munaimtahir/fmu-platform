import type { RouteAccess } from '@/features/auth/access'

/**
 * Single source of truth for who may open each protected route.
 *
 * Keys are the exact react-router path patterns from `routes/appRoutes.tsx`.
 * A route that is missing here is denied (fail closed), so every new route
 * must be registered.  `tasks` are the backend task codes; `roles` are used
 * only for landing dashboards, student self-service pages, and admin pages
 * that have no backend task.  The backend remains authoritative.
 */
export const routeAccess: Record<string, RouteAccess> = {
  // Not Found page: any signed-in user
  '*': {},

  // Landing dashboards (role-specific)
  '/dashboard': {},
  '/dashboard/admin': { roles: ['Admin'] },
  '/dashboard/registrar': { roles: ['Registrar'] },
  '/dashboard/faculty': { roles: ['Faculty'] },
  '/dashboard/student': { roles: ['Student'] },
  '/dashboard/examcell': { roles: ['ExamCell'] },
  '/dashboard/coordinator': { roles: ['Coordinator'] },
  '/dashboard/office-assistant': { roles: ['OfficeAssistant'] },

  // Common
  '/notifications': { tasks: ['notifications.inbox.view'] },
  '/notifications/manage': { tasks: ['notifications.admin.view'] },
  '/profile': {},
  '/analytics': { roles: ['Admin'] },
  '/demo/datatable': {},
  '/demo/style-guide': {},

  // People, students and compliance
  '/people': { tasks: ['people.persons.view'] },
  '/people/:id': { tasks: ['people.persons.view'] },
  '/students': { tasks: ['students.students.view'] },
  '/students/:id': { tasks: ['students.students.view'] },
  '/compliance': { tasks: ['compliance.requirements.view', 'compliance.definitions.view'] },
  '/my-compliance': { roles: ['Student'] },

  // Academics
  '/courses': { tasks: ['academics.courses.view'] },
  '/sections': { tasks: ['academics.sections.view'] },
  '/sections/:id': { tasks: ['academics.sections.view'] },
  '/academics/programs': { tasks: ['academics.programs.view'] },
  '/academics/programs/new': { tasks: ['academics.programs.create'] },
  '/academics/programs/:id': { tasks: ['academics.programs.view'] },
  '/academics/batches': { tasks: ['academics.batches.create', 'academics.batches.update'] },
  '/academics/periods': { tasks: ['academics.terms.create', 'academics.terms.update', 'academics.terms.manage'] },
  '/academics/groups': { tasks: ['academics.groups.create', 'academics.groups.update'] },
  '/academics/departments': { tasks: ['academics.departments.create', 'academics.departments.update'] },
  '/timetable': { tasks: ['timetable.weekly.view', 'timetable.sessions.view', 'timetable.entries.view'] },

  // Attendance (backend gates by session ownership / roles rather than tasks)
  '/attendance': { tasks: ['attendance.attendances.edit'], roles: ['Admin', 'Faculty'] },
  '/attendance/input': { tasks: ['attendance.attendances.edit'], roles: ['Admin', 'Faculty', 'Coordinator'] },
  '/attendance/bulk': { tasks: ['attendance.attendances.edit'], roles: ['Admin', 'Faculty'] },
  '/attendance/eligibility': { tasks: ['attendance.attendances.view'], roles: ['Admin', 'Registrar'] },

  // Learning
  '/learning': { tasks: ['learning.feed.view'] },
  '/learning/manage': { tasks: ['learning.materials.view'] },

  // Exams, results and transcripts
  '/exams': { tasks: ['exams.exams.view'] },
  '/gradebook': { tasks: ['results.result_components.create', 'results.result_components.update'] },
  '/results': { tasks: ['results.result_headers.view'], roles: ['Student'] },
  '/results/corrections': { tasks: ['results.result_corrections.create', 'results.result_corrections.review'] },
  '/results/:id': { tasks: ['results.result_headers.view'], roles: ['Student'] },
  '/examcell/publish': {
    tasks: ['results.result_headers.publish', 'results.result_headers.verify', 'results.result_headers.freeze'],
  },
  '/transcripts': { tasks: ['transcripts.transcripts.generate'], roles: ['Student'] },

  // Finance
  '/finance': { tasks: ['finance.summary.view', 'finance.vouchers.view', 'finance.reports.view'] },
  '/finance/fee-types': { tasks: ['finance.fee_types.view'] },
  '/finance/fee-plans': { tasks: ['finance.fee_plans.view'] },
  '/finance/vouchers': { tasks: ['finance.vouchers.generate'] },
  '/finance/vouchers/list': { tasks: ['finance.vouchers.view'] },
  '/finance/vouchers/:id': { tasks: ['finance.vouchers.view'] },
  '/finance/payments': { tasks: ['finance.payments.view'] },
  '/finance/ledger': { tasks: ['finance.ledger_entries.view'] },
  '/finance/adjustments': { tasks: ['finance.adjustments.view'] },
  '/finance/policies': { tasks: ['finance.policies.view'] },
  '/finance/reports/defaulters': { tasks: ['finance.reports.view'] },
  '/finance/reports/collection': { tasks: ['finance.reports.view'] },
  '/finance/reports/aging': { tasks: ['finance.reports.view'] },
  '/finance/reports/statement': { tasks: ['finance.reports.view'], roles: ['Student'] },
  '/finance/me': { roles: ['Student'] },

  // Administration
  '/system/users': { roles: ['Admin'] },
  '/system/roles': { tasks: ['core.roles.view', 'core.permission_tasks.view'] },
  '/system/audit': { tasks: ['audit.events.view'] },
  '/system/students/import': { roles: ['Admin', 'Coordinator'] },
  '/system/faculty/import': { roles: ['Admin', 'Coordinator'] },
  '/system/syllabus': { roles: ['Admin'] },
  '/system/settings': { roles: ['Admin'] },
}

export function getRouteAccess(pattern: string): RouteAccess | undefined {
  return routeAccess[pattern]
}
