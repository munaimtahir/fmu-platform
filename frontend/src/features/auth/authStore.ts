import { create } from 'zustand'
import { User } from './types'
import { getAccessToken, clearTokens } from '@/api/axios'
import { getCurrentUser } from '@/api/auth'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  logout: () => {
    clearTokens()
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  initialize: async () => {
    const token = getAccessToken()

    if (token) {
      try {
        // Fetch user info from /api/auth/me endpoint
        const user = await getCurrentUser()
        if (user) {
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
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
