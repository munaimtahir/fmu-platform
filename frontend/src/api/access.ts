import api from './axios'
import { normalizeRoles, type AccessContext } from '@/features/auth/access'

/** Shape of `/api/core/users/me/` (roles/tasks are effective, not just database assignments). */
export interface AccessContextResponse {
  id: number
  username: string
  roles: Array<{ id: number | null; name: string; description: string }>
  tasks: Array<{ id: number | null; code: string; name: string; module: string }>
}

export async function getAccessContext(): Promise<AccessContext> {
  const response = await api.get<AccessContextResponse>('/api/core/users/me/')
  return {
    roles: normalizeRoles(response.data.roles.map((role) => role.name)),
    tasks: response.data.tasks.map((task) => task.code),
  }
}
