import { create } from 'zustand'
import { User } from './types'
import { getAccessToken, clearTokens, isImpersonating, restoreAdminTokens } from '@/api/axios'
import { getCurrentUser } from '@/api/auth'
import { stopImpersonation } from '@/api/impersonation'

interface ImpersonationState {
  active: boolean
  target: User | null
  expiresAt: number | null
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  impersonation: ImpersonationState
  setUser: (user: User | null) => void
  setImpersonation: (state: Partial<ImpersonationState>) => void
  stopImpersonation: () => Promise<void>
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
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
    }),

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
        impersonation: {
          active: false,
          target: null,
          expiresAt: null,
        },
      })
    }
  },

  logout: () => {
    clearTokens()
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      impersonation: {
        active: false,
        target: null,
        expiresAt: null,
      },
    })
  },

  initialize: async () => {
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
            isLoading: false,
            impersonation: {
              active: impersonating,
              target: impersonating ? user : null,
              expiresAt: impersonating ? Date.now() + 10 * 60 * 1000 : null, // 10 min default
            },
          })
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
