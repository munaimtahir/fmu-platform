/**
 * RBAC administration API: roles, permission tasks, role-task assignments and
 * per-user task overrides.  Task codes here are the same codes the backend
 * enforces (see backend/core/rbac_catalog.py).
 */
import api from '@/api/axios'
import { resultsOf, type Paginated } from '@/lib/pagination'

export interface PermissionTask {
  id: number
  code: string
  name: string
  description: string
  module: string
}

export interface RoleTaskRef {
  /** RoleTaskAssignment id (use it to remove the assignment). */
  id: number
  task: { id: number; code: string; name: string }
  created_at: string
}

export interface Role {
  id: number
  name: string
  description: string
  is_system_role: boolean
  task_assignments: RoleTaskRef[]
}

export interface UserSummary {
  id: number
  username: string
  email: string
  full_name?: string
}

export interface UserTaskAssignment {
  id: number
  user: UserSummary
  task: PermissionTask
  granted_by: UserSummary | null
  created_at: string
}

export interface RoleInput {
  name: string
  description?: string
}

/** Fetch every page of a DRF list endpoint (the default page size is 50). */
async function fetchAll<T>(url: string, params?: Record<string, unknown>): Promise<T[]> {
  const items: T[] = []
  for (let page = 1; page <= 50; page += 1) {
    const response = await api.get<Paginated<T> | T[]>(url, { params: { ...params, page } })
    items.push(...resultsOf(response.data))
    if (Array.isArray(response.data) || !response.data.next) break
  }
  return items
}

export const rbacService = {
  async listRoles(): Promise<Role[]> {
    return fetchAll<Role>('/api/core/roles/')
  },

  async createRole(data: RoleInput): Promise<Role> {
    const response = await api.post<Role>('/api/core/roles/', data)
    return response.data
  },

  async updateRole(id: number, data: Partial<RoleInput>): Promise<Role> {
    const response = await api.patch<Role>(`/api/core/roles/${id}/`, data)
    return response.data
  },

  async deleteRole(id: number): Promise<void> {
    await api.delete(`/api/core/roles/${id}/`)
  },

  async listTasks(): Promise<PermissionTask[]> {
    return fetchAll<PermissionTask>('/api/core/permission-tasks/')
  },

  async assignTaskToRole(roleId: number, taskId: number): Promise<void> {
    await api.post('/api/core/role-task-assignments/', { role_id: roleId, task_id: taskId })
  },

  async removeRoleAssignment(assignmentId: number): Promise<void> {
    await api.delete(`/api/core/role-task-assignments/${assignmentId}/`)
  },

  async listUserAssignments(userId: number): Promise<UserTaskAssignment[]> {
    return fetchAll<UserTaskAssignment>('/api/core/user-task-assignments/', { user: userId })
  },

  async assignTaskToUser(userId: number, taskId: number): Promise<void> {
    await api.post('/api/core/user-task-assignments/', { user_id: userId, task_id: taskId })
  },

  async removeUserAssignment(assignmentId: number): Promise<void> {
    await api.delete(`/api/core/user-task-assignments/${assignmentId}/`)
  },
}

/** Group tasks by module, sorted by module then code. */
export function groupTasksByModule(tasks: PermissionTask[]): Array<{ module: string; tasks: PermissionTask[] }> {
  const groups = new Map<string, PermissionTask[]>()
  for (const task of tasks) {
    const list = groups.get(task.module) ?? []
    list.push(task)
    groups.set(task.module, list)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, list]) => ({ module, tasks: [...list].sort((a, b) => a.code.localeCompare(b.code)) }))
}
