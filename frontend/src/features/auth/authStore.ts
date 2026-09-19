import { create } from 'zustand'
import { User } from './types'
import { getAccessToken, clearTokens, isImpersonating, restoreAdminTokens } from '@/api/axios'
import { getCurrentUser } from '@/api/auth'
import { getAccessContext } from '@/api/access'
import { stopImpersonation } from '@/api/impersonation'
import { EMPTY_ACCESS, normalizeRoles, type RoleName } from './access'

interface ImpersonationState {
  active: boolean
  target: User | null
  expiresAt: number | null
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  /** Effective canonical roles from `/api/core/users/me/`. */
  roles: RoleName[]
  /** Effective permission task codes from `/api/core/users/me/`. */
  tasks: string[]
  /** True once an access-context load has finished (successfully or with the role fallback). */
  accessLoaded: boolean
  impersonation: ImpersonationState
  setUser: (user: User | null) => void
  loadAccess: () => Promise<void>
  setImpersonation: (state: Partial<ImpersonationState>) => void
  stopImpersonation: () => Promise<void>
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  roles: EMPTY_ACCESS.roles,
  tasks: EMPTY_ACCESS.tasks,
  accessLoaded: false,
  impersonation: {
    active: false,
    target: null,
    expiresAt: null,
  },

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      accessLoaded: false,
    }),

  loadAccess: async () => {
    const { user } = get()
    if (!user) {
      set({ roles: EMPTY_ACCESS.roles, tasks: EMPTY_ACCESS.tasks, accessLoaded: true })
      return
    }
    try {
      const access = await getAccessContext()
      set({ roles: access.roles, tasks: access.tasks, accessLoaded: true })
    } catch (error) {
      // The backend stays authoritative, so degrading to the primary role only hides
      // task-gated UI; it never grants anything.
      console.error('Failed to load access context:', error)
      set({ roles: normalizeRoles([user.role]), tasks: [], accessLoaded: true })
    }
  },

  setImpersonation: (state) =>
    set((prev) => ({
      impersonation: { ...prev.impersonation, ...state },
    })),

  stopImpersonation: async () => {
    const { impersonation } = get()
    
    try {
      // Call backend stop endpoint (best effort)
      if (impersonation.target?.id) {
        await stopImpersonation(impersonation.target.id)
      }
    } catch (error) {
      // Ignore errors - we'll revert tokens anyway
      console.error('Failed to call stop impersonation endpoint:', error)
    } finally {
      // Always restore admin tokens
      restoreAdminTokens()
      
      // Refresh user to get admin user back
      const adminUser = await getCurrentUser()
      
      set({
        user: adminUser,
        isAuthenticated: !!adminUser,
        accessLoaded: false,
        impersonation: {
          active: false,
          target: null,
          expiresAt: null,
        },
      })
      await get().loadAccess()
    }
  },

  logout: () => {
    clearTokens()
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      roles: EMPTY_ACCESS.roles,
      tasks: EMPTY_ACCESS.tasks,
      accessLoaded: false,
      impersonation: {
        active: false,
        target: null,
        expiresAt: null,
      },
    })
  },

  initialize: async () => {
    // ProtectedRoute calls this on every mount; skip the network round-trips once the
    // session and its access context are already loaded.
    if (get().isAuthenticated && get().accessLoaded) return

    const token = getAccessToken()

    if (token) {
      try {
        // Use /api/auth/me/ as the canonical identity source (unified auth system)
        // This endpoint returns the authenticated user based on the access token
        const user = await getCurrentUser()
        if (user) {
          // Check if we're impersonating
          const impersonating = isImpersonating()
          
          set({
            user,
            isAuthenticated: true,
            impersonation: {
              active: impersonating,
              target: impersonating ? user : null,
              expiresAt: impersonating ? Date.now() + 10 * 60 * 1000 : null, // 10 min default
            },
          })
          // Session restore must also restore the effective access context before
          // any task-gated route renders.
          await get().loadAccess()
          set({ isLoading: false })
        } else {
          // Token exists but user fetch failed - clear auth
          clearTokens()
          set({ isLoading: false, isAuthenticated: false, user: null })
        }
      } catch {
        // Error fetching user - clear auth
        clearTokens()
        set({ isLoading: false, isAuthenticated: false, user: null })
      }
    } else {
      set({ isLoading: false })
    }
  },
}))
