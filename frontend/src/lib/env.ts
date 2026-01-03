/**
 * Environment configuration
 * Centralizes access to environment variables
 */
export const env = {
  // VITE_API_URL should be '/' for production (relative) or full URL for dev
  // All API calls include '/api/' prefix, so baseURL should NOT include '/api'
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
}

// Also export API_URL for backward compatibility
export const API_URL = env.apiBaseUrl
