import { ALL_ROLES, normalizeRole, type RoleName } from '@/features/auth/access'

/** Backend group name for a canonical role (e.g. OfficeAssistant -> OFFICE_ASSISTANT). */
export function roleToGroupValue(role: RoleName): string {
  return role === 'OfficeAssistant' ? 'OFFICE_ASSISTANT' : role.toUpperCase()
}

/** Every canonical role, as the value the admin users API expects plus a readable label. */
export const USER_ROLE_OPTIONS: Array<{ value: string; label: string }> = ALL_ROLES.map((role) => ({
  value: roleToGroupValue(role),
  label: role === 'OfficeAssistant' ? 'Office Assistant' : role === 'ExamCell' ? 'Exam Cell' : role,
}))

/** Convert the role label the API returns (`OfficeAssistant`, `Registrar`, `User`) to a select value. */
export function roleValueFromLabel(label: string | undefined, fallback = 'STUDENT'): string {
  const role = normalizeRole(label)
  return role ? roleToGroupValue(role) : fallback
}
