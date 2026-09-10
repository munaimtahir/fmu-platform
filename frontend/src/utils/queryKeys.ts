/**
 * Canonical React Query keys for resources fetched from multiple
 * components. Using these (instead of ad-hoc array literals) ensures
 * components fetching the same resource share the same cache entry and
 * invalidate each other correctly.
 *
 * Keep this simple: these are plain functions returning array literals,
 * matching the rest of the codebase's convention of inline query keys.
 * Don't turn this into a full query-key-factory abstraction.
 */

export const academicPeriodsKey = (search?: string) =>
  search !== undefined ? (['academic-periods', search] as const) : (['academic-periods'] as const)

export const departmentsKey = (search?: string) =>
  search !== undefined ? (['academics-departments', search] as const) : (['academics-departments'] as const)

export const groupsKey = (extra?: unknown) =>
  extra !== undefined ? (['academic-groups', extra] as const) : (['academic-groups'] as const)

export const coursesKey = (search?: string) =>
  search !== undefined ? (['courses', search] as const) : (['courses'] as const)
