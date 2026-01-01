/**
 * Environment configuration
 * Centralizes access to environment variables
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
}

// Also export API_URL for backward compatibility
export const API_URL = env.apiBaseUrl
