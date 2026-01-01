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
  // Personal Information
  first_name?: string
  last_name?: string
  full_name?: string
  father_name?: string
  gender?: 'M' | 'F' | 'O'
  date_of_birth: string
  cnic?: string
  email: string
  phone: string
  // Address
  address?: string
  address_city?: string
  address_district?: string
  address_state?: string
  address_country?: string
  // Mailing Address
  mailing_address_same?: boolean
  mailing_address?: string
  mailing_city?: string
  mailing_district?: string
  mailing_state?: string
  mailing_country?: string
  // Guardian Information
  guardian_name?: string
  guardian_relation?: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER'
  guardian_phone?: string
  guardian_email?: string
  guardian_mailing_address?: string
  // Admission/Merit Details
  mdcat_roll_number?: string
  merit_number?: number
  merit_percentage?: number
  // Qualifications
  hssc_year?: number
  hssc_board?: string
  hssc_marks?: number
  hssc_percentage?: number
  ssc_year?: number
  ssc_board?: string
  ssc_marks?: number
  ssc_percentage?: number
  // Academic Information
  program?: number
  program_name?: string
  program_full_name?: string
  batch_year: number
  previous_qualification?: string
  previous_institution?: string
  // Application Status
  status: 'pending' | 'approved' | 'rejected'
  status_display?: string
  notes?: string
  // Documents
  documents?: string
  father_id_card?: string
  guardian_id_card?: string
  domicile?: string
  ssc_certificate?: string
  hssc_certificate?: string
  mdcat_result?: string
  // Admin tracking
  reviewed_by?: number
  reviewed_by_name?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

// Student Application Create (for public submission)
export interface StudentApplicationCreate {
  // Personal Information
  first_name: string
  last_name: string
  father_name: string
  gender: 'M' | 'F' | 'O'
  date_of_birth: string
  cnic: string
  email: string
  phone: string
  // Address
  address_city: string
  address_district: string
  address_state: string
  address_country: string
  // Mailing Address
  mailing_address_same: boolean
  mailing_address?: string
  mailing_city?: string
  mailing_district?: string
  mailing_state?: string
  mailing_country?: string
  // Guardian Information
  guardian_name: string
  guardian_relation: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER'
  guardian_phone: string
  guardian_email: string
  guardian_mailing_address: string
  // Admission/Merit Details
  mdcat_roll_number: string
  merit_number: number
  merit_percentage: number
  // Qualifications
  hssc_year: number
  hssc_board: string
  hssc_marks: number
  hssc_percentage: number
  ssc_year: number
  ssc_board: string
  ssc_marks: number
  ssc_percentage: number
  // Academic Information
  program?: number
  batch_year: number
  // Documents
  father_id_card: File
  guardian_id_card?: File
  domicile: File
  ssc_certificate: File
  hssc_certificate: File
  mdcat_result: File
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
