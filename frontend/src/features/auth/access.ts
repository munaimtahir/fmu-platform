/**
 * Effective-access model.
 *
 * The backend is authoritative: `/api/core/users/me/` returns the caller's
 * effective roles and permission task codes (direct + role + built-in +
 * superuser).  The frontend uses the same task codes to decide what to show.
 */

export type RoleName =
  | 'Admin'
  | 'Registrar'
  | 'Faculty'
  | 'Student'
  | 'ExamCell'
  | 'Finance'
  | 'Coordinator'
  | 'OfficeAssistant'

export const ALL_ROLES: readonly RoleName[] = [
  'Admin',
  'Registrar',
  'Coordinator',
  'Faculty',
  'ExamCell',
  'Finance',
  'Student',
  'OfficeAssistant',
] as const

export interface AccessContext {
  /** Canonical role names, e.g. 'Admin', 'OfficeAssistant'. */
  roles: RoleName[]
  /** Effective permission task codes, e.g. 'finance.vouchers.cancel'. */
  tasks: string[]
}

/**
 * Who may open a route or see a control.
 *
 * `tasks` is any-of and mirrors the backend task codes.  `roles` is any-of and
 * exists for self-service pages that have no backend task (a student's own
 * fees) and for role-specific landing dashboards.  A rule with neither is open
 * to any authenticated user.  If both are present, either is sufficient.
 */
export interface RouteAccess {
  tasks?: readonly string[]
  roles?: readonly RoleName[]
}

export const EMPTY_ACCESS: AccessContext = { roles: [], tasks: [] }

const ROLE_ALIASES: Record<string, RoleName> = {
  ADMIN: 'Admin',
  REGISTRAR: 'Registrar',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  EXAMCELL: 'ExamCell',
  EXAM_CELL: 'ExamCell',
  FINANCE: 'Finance',
  COORDINATOR: 'Coordinator',
  OFFICEASSISTANT: 'OfficeAssistant',
  OFFICE_ASSISTANT: 'OfficeAssistant',
}

/** Map any backend spelling (`OFFICE_ASSISTANT`, `Exam_Cell`, `Admin`) to a canonical role. */
export function normalizeRole(raw: string | null | undefined): RoleName | undefined {
  if (!raw) return undefined
  return ROLE_ALIASES[raw.replace(/[\s-]/g, '').toUpperCase()]
}

export function normalizeRoles(raws: ReadonlyArray<string | null | undefined>): RoleName[] {
  const seen = new Set<RoleName>()
  for (const raw of raws) {
    const role = normalizeRole(raw)
    if (role) seen.add(role)
  }
  return ALL_ROLES.filter((role) => seen.has(role))
}

export function hasAnyTask(ctx: AccessContext, codes: readonly string[]): boolean {
  if (codes.length === 0) return false
  const held = new Set(ctx.tasks)
  return codes.some((code) => held.has(code))
}

export function hasAnyRole(ctx: AccessContext, roles: readonly RoleName[]): boolean {
  return roles.some((role) => ctx.roles.includes(role))
}

export function canAccess(access: RouteAccess | undefined, ctx: AccessContext): boolean {
  if (!access) return false
  const hasTasks = !!access.tasks && access.tasks.length > 0
  const hasRoles = !!access.roles && access.roles.length > 0
  if (!hasTasks && !hasRoles) return true
  return (hasTasks && hasAnyTask(ctx, access.tasks!)) || (hasRoles && hasAnyRole(ctx, access.roles!))
}

/** Where each role lands after login and when visiting `/dashboard`. */
export const LANDING_PATHS: Record<RoleName, string> = {
  Admin: '/dashboard/admin',
  Registrar: '/dashboard/registrar',
  Faculty: '/dashboard/faculty',
  Student: '/dashboard/student',
  ExamCell: '/dashboard/examcell',
  Coordinator: '/dashboard/coordinator',
  Finance: '/finance',
  OfficeAssistant: '/dashboard/office-assistant',
}

/**
 * Landing path for a user.  `primaryRole` is the backend's precedence-resolved
 * `role` string from `/api/auth/me/`; `roles` is the effective role list, used
 * as a fallback when the primary role is unknown (`User`).
 */
export function landingPathFor(primaryRole: string | undefined, roles: readonly RoleName[] = []): string | undefined {
  const primary = normalizeRole(primaryRole)
  if (primary) return LANDING_PATHS[primary]
  const fallback = roles[0]
  return fallback ? LANDING_PATHS[fallback] : undefined
}
