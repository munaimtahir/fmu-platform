/**
 * Authentication types
 */

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string  // Admin, Registrar, Faculty, Student, ExamCell, User
  is_active: boolean
  student_id?: number  // Optional student ID for student users
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  /** Email or username for authentication */
  identifier: string
  /** User password */
  password: string
}

export interface AuthError {
  code: string
  message: string
}

export interface LoginResponse {
  user: User
  tokens: {
    access: string
    refresh: string
  }
}

export interface TokenRefreshResponse {
  access: string
  refresh?: string
}
