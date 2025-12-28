import { useAuthStore } from './authStore'
import { login as apiLogin, logout as apiLogout } from '@/api/auth'
import type { LoginCredentials, User } from './types'

/**
 * A custom hook for managing authentication logic.
 *
 * This hook provides an interface to the authentication state and actions,
 * such as logging in and out. It integrates with the `useAuthStore` for state
 * management and the API for authentication requests.
 *
 * @returns {object} An object containing the authentication state and methods.
 * @property {User | null} user The authenticated user object, or null if not logged in.
 * @property {boolean} isAuthenticated A boolean indicating if the user is authenticated.
 * @property {boolean} isLoading A boolean indicating if the authentication state is being loaded.
 * @property {function(LoginCredentials): Promise<User>} login A function to log in the user.
 * @property {function(): Promise<void>} logout A function to log out the user.
 * @property {function(): Promise<void>} initialize A function to initialize the authentication state.
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * if (isAuthenticated) {
 *   console.log(`Welcome, ${user.full_name}`);
 * } else {
 *   login({ identifier: 'testuser', password: 'password' });
 * }
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, logout: clearAuth, initialize } = useAuthStore()

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiLogin(credentials)

    // Set user directly from login response
    setUser(response.user)

    return response.user
  }

  const logout = async () => {
    await apiLogout()
    clearAuth()
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    initialize,
  }
}
