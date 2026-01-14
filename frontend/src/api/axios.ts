import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { env } from '@/lib/env'

export interface TokenResponse {
  /** The JWT access token. */
  access: string
  /** The JWT refresh token. */
  refresh: string
}

/**
 * An Axios instance configured for making API requests.
 *
 * This instance is pre-configured with the base URL and default headers.
 * It also includes interceptors for automatically handling token-based
 * authentication, including token injection and automatic token refresh.
 */
const api = axios.create({
  baseURL: env.apiBaseUrl.replace(/\/api\/?$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
let accessToken: string | null = null
let refreshToken: string | null = null

// Impersonation token backup (admin's original tokens)
let adminAccessToken: string | null = null
let adminRefreshToken: string | null = null

// Single-flight refresh queue
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

/**
 * Subscribes a callback to be executed when the token is refreshed.
 * @param {function(string): void} callback The callback to execute with the new token.
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

/**
 * Executes all subscribed callbacks with the new token.
 * @param {string} token The new access token.
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

/**
 * Sets the access and refresh tokens in memory and local storage.
 * @param {string} access The access token.
 * @param {string} refresh The refresh token.
 */
export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

/**
 * Sets impersonation token (backups admin tokens first).
 * @param {string} impersonationAccess The impersonation access token.
 */
export function setImpersonationToken(impersonationAccess: string) {
  // Backup admin tokens
  adminAccessToken = accessToken
  adminRefreshToken = refreshToken
  localStorage.setItem('admin_access_token', adminAccessToken || '')
  localStorage.setItem('admin_refresh_token', adminRefreshToken || '')
  
  // Set impersonation token
  accessToken = impersonationAccess
  localStorage.setItem('access_token', impersonationAccess)
}

/**
 * Restores admin tokens from backup.
 */
export function restoreAdminTokens() {
  // Restore from localStorage if not in memory
  if (!adminAccessToken) {
    adminAccessToken = localStorage.getItem('admin_access_token')
    adminRefreshToken = localStorage.getItem('admin_refresh_token')
  }
  
  if (adminAccessToken && adminRefreshToken) {
    accessToken = adminAccessToken
    refreshToken = adminRefreshToken
    localStorage.setItem('access_token', adminAccessToken)
    localStorage.setItem('refresh_token', adminRefreshToken)
    
    // Clear backup
    adminAccessToken = null
    adminRefreshToken = null
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
  }
}

/**
 * Checks if currently using impersonation token.
 */
export function isImpersonating(): boolean {
  return !!localStorage.getItem('admin_access_token')
}

/**
 * Retrieves the access token from memory or local storage.
 * @returns {string | null} The access token, or null if not found.
 */
export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem('access_token')
  }
  return accessToken
}

/**
 * Retrieves the refresh token from memory or local storage.
 * @returns {string | null} The refresh token, or null if not found.
 */
export function getRefreshToken(): string | null {
  if (!refreshToken) {
    refreshToken = localStorage.getItem('refresh_token')
  }
  return refreshToken
}

/**
 * Clears the access and refresh tokens from memory and local storage.
 */
export function clearTokens() {
  accessToken = null
  refreshToken = null
  adminAccessToken = null
  adminRefreshToken = null
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('admin_access_token')
  localStorage.removeItem('admin_refresh_token')
}

/**
 * Axios request interceptor.
 *
 * This interceptor attaches the JWT access token to the `Authorization` header
 * of every outgoing request, if a token is available.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Axios response interceptor.
 *
 * This interceptor handles 401 Unauthorized errors by attempting to refresh
 * the access token using the refresh token. If the refresh is successful, the
 * original request is retried. If it fails, the user is logged out.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // If impersonating and token expired, auto-stop impersonation
    if (isImpersonating()) {
      // Restore admin tokens and let the request fail naturally
      // The UI should handle showing an error or auto-stopping
      restoreAdminTokens()
      // Don't retry - let the caller handle the error
      return Promise.reject(error)
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          resolve(api(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refresh = getRefreshToken()

    if (!refresh) {
      isRefreshing = false
      clearTokens()
      // Redirect to login will be handled by auth store
      return Promise.reject(error)
    }

    try {
      // Use a plain axios instance to avoid circular interceptor calls
      // Use the new unified refresh endpoint
      const response = await axios.post<{ access: string; refresh?: string }>(
        `${env.apiBaseUrl.replace(/\/$/, '')}/api/auth/refresh/`,
        { refresh }
      )

      const newAccessToken = response.data.access
      // If a new refresh token is returned (rotation enabled), use it
      const newRefreshToken = response.data.refresh || refresh
      setTokens(newAccessToken, newRefreshToken)

      // Notify all queued requests
      onTokenRefreshed(newAccessToken)

      // Retry original request
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      }

      return api(originalRequest)
    } catch (refreshError) {
      // Refresh failed - clear tokens and redirect to login
      clearTokens()
      isRefreshing = false
      refreshSubscribers = []
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
