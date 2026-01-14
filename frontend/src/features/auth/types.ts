/**
 * Authentication types
 */

/**
 * User object shape from unified auth system (/api/auth/me/).
 * Matches backend UserSerializer exactly:
 * - id, username, email, full_name, role, student_id, is_active
 * - role is a STRING: "Admin", "Registrar", "Finance", "ExamCell", "Faculty", "Student", or "User"
 */
export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string  // Admin, Registrar, Finance, ExamCell, Faculty, Student, User
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
