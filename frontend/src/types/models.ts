/**
 * Type definitions for API models
 */

// Program model
export interface Program {
  id: number
  level: 'undergraduate' | 'postgraduate' | 'diploma' | 'other'
  level_display: string
  category: string
  category_display: string
  name: string
  duration_years: number
  description?: string
  is_active: boolean
  full_name: string
  created_at: string
  updated_at: string
}

// Student model
export interface Student {
  id: number
  reg_no: string
  name: string
  program: number
  program_name?: string
  program_full_name?: string
  batch_year: number
  current_year: number
  status: 'active' | 'inactive' | 'graduated' | 'suspended'
  status_display?: string
  email?: string
  phone?: string
  date_of_birth?: string
  created_at?: string
  updated_at?: string
}

// Student Application model
export interface StudentApplication {
  id: number
  full_name: string
  date_of_birth: string
  email: string
  phone: string
  address?: string
  program: number
  program_name?: string
  program_full_name?: string
  batch_year: number
  previous_qualification?: string
  previous_institution?: string
  status: 'pending' | 'approved' | 'rejected'
  status_display?: string
  notes?: string
  documents?: string
  reviewed_by?: number
  reviewed_by_name?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

// Student Application Create (for public submission)
export interface StudentApplicationCreate {
  full_name: string
  date_of_birth: string
  email: string
  phone: string
  address?: string
  program: number
  batch_year: number
  previous_qualification?: string
  previous_institution?: string
  documents?: File
}

// Course model
export interface Course {
  id: number
  code: string
  title: string
  credits: number
  program: string
}

// Term model
export interface Term {
  id: number
  name: string
  status: 'Active' | 'Inactive' | 'Archived'
  start_date: string
  end_date: string
}

// Section model
export interface Section {
  id: number
  course: number
  term: number
  teacher: string
  capacity: number
}

// Enrollment model
export interface Enrollment {
  id: number
  student: number
  section: number
  enrolled_at: string
  status: string
}

// Assessment model
export interface Assessment {
  id: number
  section: number
  name: string
  max_score: number
  weight: number
}

// Assessment Score model
export interface AssessmentScore {
  id: number
  assessment: number
  student: number
  score: number
  remarks?: string
}

// Attendance model
export interface Attendance {
  id: number
  section: number
  student: number
  date: string
  status: 'Present' | 'Absent' | 'Late' | 'Excused'
}

// Pagination response
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API error response
export interface ApiError {
  detail?: string
  [key: string]: unknown
}
