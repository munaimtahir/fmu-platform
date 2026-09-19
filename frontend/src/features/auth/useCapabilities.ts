import { useMemo } from 'react'
import { useAuthStore } from './authStore'
import { canAccess, hasAnyRole, hasAnyTask, type AccessContext, type RoleName, type RouteAccess } from './access'

/**
 * Read the caller's effective capabilities.  UI gating only: the backend
 * enforces the same task codes on every request.
 */
export function useCapabilities() {
  const roles = useAuthStore((state) => state.roles)
  const tasks = useAuthStore((state) => state.tasks)
  const accessLoaded = useAuthStore((state) => state.accessLoaded)

  return useMemo(() => {
    const ctx: AccessContext = { roles, tasks }
    return {
      roles,
      tasks,
      accessLoaded,
      /** True if the user holds ANY of the given task codes. */
      can: (...codes: string[]) => hasAnyTask(ctx, codes),
      /** True if the user holds ANY of the given roles. */
      hasRole: (...names: RoleName[]) => hasAnyRole(ctx, names),
      /** Evaluate a route/control access rule. */
      allows: (access: RouteAccess | undefined) => canAccess(access, ctx),
    }
  }, [roles, tasks, accessLoaded])
}
