import api, { setTokens, clearTokens, getRefreshToken } from './axios'
import type {
  LoginCredentials,
  LoginResponse,
  User,
  AuthError,
  TokenRefreshResponse,
} from '@/features/auth/types'

/**
 * Auth API error codes
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  INACTIVE_ACCOUNT: 'AUTH_INACTIVE_ACCOUNT',
  ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
} as const

/**
 * Error response shape from auth endpoints
 */
interface AuthErrorResponse {
  error: AuthError
}

/**
 * Check if error response has the standard auth error shape
 */
function isAuthError(data: unknown): data is AuthErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as AuthErrorResponse).error === 'object' &&
    'code' in (data as AuthErrorResponse).error &&
    'message' in (data as AuthErrorResponse).error
  )
}

/**
 * Authenticates a user with the given credentials.
 *
 * This function sends a POST request to the unified login endpoint and, upon a
 * successful response, stores the received access and refresh tokens.
 *
 * @param {LoginCredentials} credentials The user's identifier (email or username) and password.
 * @returns {Promise<LoginResponse>} A promise that resolves with the user info and tokens.
 * @throws {Error} If the login request fails.
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/api/auth/login/', credentials)
    const { user, tokens } = response.data

    setTokens(tokens.access, tokens.refresh)

    return { user, tokens }
  } catch (error: unknown) {
    // Handle axios error with standard error shape
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { data?: unknown } }).response?.data === 'object'
    ) {
      const responseData = (error as { response: { data: unknown } }).response.data
      if (isAuthError(responseData)) {
        throw new Error(responseData.error.message)
      }
    }
    throw error
  }
}

/**
 * Logs out the current user.
 *
 * This function calls the backend logout endpoint and clears the authentication tokens from storage.
 *
 * @returns {Promise<void>} A promise that resolves when the logout is complete.
 */
export async function logout(): Promise<void> {
  try {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      await api.post('/api/auth/logout/', { refresh: refreshToken })
    }
  } catch {
    // Ignore logout errors - we'll clear tokens anyway
  } finally {
    clearTokens()
  }
}

/**
 * Refreshes the access token using the refresh token.
 *
 * @returns {Promise<TokenRefreshResponse>} A promise that resolves with the new tokens.
 * @throws {Error} If the refresh request fails.
 */
export async function refreshTokens(): Promise<TokenRefreshResponse> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  try {
    const response = await api.post<TokenRefreshResponse>('/api/auth/refresh/', {
      refresh: refreshToken,
    })

    const { access, refresh: newRefresh } = response.data

    // Update stored tokens
    setTokens(access, newRefresh || refreshToken)

    return response.data
  } catch (error: unknown) {
    clearTokens()
    throw error
  }
}

/**
 * Retrieves the profile of the currently authenticated user.
 *
 * @returns {Promise<User | null>} A promise that resolves with the user's profile, or null if not found.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await api.get<User>('/api/auth/me/')
    return response.data
  } catch {
    return null
  }
}

/**
 * Password change request interface
 */
export interface PasswordChangeRequest {
  old_password: string
  new_password: string
  new_password_confirm: string
}

/**
 * Password change response interface
 */
export interface PasswordChangeResponse {
  message: string
}

/**
 * Profile update request interface
 */
export interface ProfileUpdateRequest {
  first_name?: string
  last_name?: string
  email?: string
}

/**
 * Changes the current user's password.
 *
 * @param {PasswordChangeRequest} data The password change request data.
 * @returns {Promise<PasswordChangeResponse>} A promise that resolves with the success message.
 * @throws {Error} If the password change request fails.
 */
export async function changePassword(data: PasswordChangeRequest): Promise<PasswordChangeResponse> {
  try {
    const response = await api.post<PasswordChangeResponse>('/api/auth/change-password/', data)
    return response.data
  } catch (error: unknown) {
    // Handle axios error with standard error shape
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { data?: unknown } }).response?.data === 'object'
    ) {
      const responseData = (error as { response: { data: unknown } }).response.data
      if (isAuthError(responseData)) {
        throw new Error(responseData.error.message)
      }
      // Handle validation errors (e.g., password mismatch)
      if (typeof responseData === 'object' && responseData !== null && 'error' in responseData) {
        const errorObj = (responseData as { error: unknown }).error
        if (typeof errorObj === 'object' && errorObj !== null && 'message' in errorObj) {
          throw new Error((errorObj as { message: string }).message)
        }
      }
    }
    throw error
  }
}

/**
 * Updates the current user's profile information.
 *
 * @param {ProfileUpdateRequest} data The profile update data.
 * @returns {Promise<User>} A promise that resolves with the updated user information.
 * @throws {Error} If the profile update request fails.
 */
export async function updateProfile(data: ProfileUpdateRequest): Promise<User> {
  try {
    const response = await api.patch<User>('/api/auth/me/', data)
    return response.data
  } catch (error: unknown) {
    // Handle axios error with standard error shape
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { data?: unknown } }).response?.data === 'object'
    ) {
      const responseData = (error as { response: { data: unknown } }).response.data
      if (isAuthError(responseData)) {
        throw new Error(responseData.error.message)
      }
    }
    throw error
  }
}

/**
 * Decodes a JWT token to extract its payload.
 *
 * Note: This is a basic implementation for demonstration purposes. In a
 * production environment, a robust JWT decoding library should be used.
 *
 * @param {string} token The JWT token to decode.
 * @returns {Record<string, unknown> | null} The decoded payload as an object, or null if decoding fails.
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

// Re-export types for convenience
export type { LoginCredentials, LoginResponse, User, AuthError }
