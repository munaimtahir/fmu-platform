/**
 * Type definitions for API models
 */

// Program model
export interface Program {
  id: number
  name: string
  description?: string
  is_active: boolean
  structure_type: 'YEARLY' | 'SEMESTER' | 'CUSTOM'
  is_finalized: boolean
  period_length_months?: number | null
  total_periods?: number | null
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
  batch: number
  batch_name?: string
  group?: number
  group_name?: string
  status: 'active' | 'inactive' | 'graduated' | 'suspended' | 'on_leave'
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
// Note: Backend uses 'name' as primary field. 'title' kept for backward compatibility.
export interface Course {
  id: number
  code: string
  name: string
  title?: string  // Deprecated: use 'name' instead
  credits: number
  program: string
  department?: number
  department_name?: string
  academic_period?: number
  academic_period_name?: string
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

// Finance models
export interface FeeType {
  id: number
  code: string
  name: string
  is_active: boolean
}

export interface FeePlan {
  id: number
  program: number
  program_name?: string
  term: number
  term_name?: string
  fee_type: number
  fee_type_code?: string
  amount: number
  is_mandatory: boolean
  frequency: 'one_time' | 'per_term'
  effective_from?: string
  is_active: boolean
}

export interface VoucherItem {
  id: number
  fee_type: number
  fee_type_code?: string
  description?: string
  amount: number
}

export interface Voucher {
  id: number
  voucher_no: string
  student: number
  student_reg_no?: string
  student_name?: string
  term: number
  term_name?: string
  status: string
  issue_date: string
  due_date: string
  total_amount: number
  notes?: string
  items: VoucherItem[]
  balance?: {
    outstanding: number
  }
}

export interface Payment {
  id: number
  receipt_no: string
  student: number
  student_name?: string
  term: number
  term_name?: string
  voucher?: number
  amount: number
  method: string
  reference_no?: string
  status: string
  received_at: string
}

export interface FinanceSummary {
  student_id: number
  term_id?: number | null
  outstanding: number
  total_debits: number
  total_credits: number
  voucher_statuses: Record<string, string>
  gating: Record<string, unknown>
}

export interface DefaulterRow {
  student_id: number
  reg_no: string
  name: string
  outstanding: number
  overdue_days: number
  latest_voucher_no?: string
  phone?: string
  email?: string
}

export interface CollectionReport {
  start_date: string
  end_date: string
  total_collected: number
  total_count: number
  by_method: Record<string, { total: number; count: number }>
}

export interface AgingReport {
  term_id?: number | null
  term_name: string
  buckets: {
    '0_7': { count: number; amount: number }
    '8_30': { count: number; amount: number }
    '31_60': { count: number; amount: number }
    '60_plus': { count: number; amount: number }
  }
}

export interface StatementEntry {
  date: string
  description: string
  entry_type: 'debit' | 'credit'
  debit?: number
  credit?: number
  reference_type: string
  reference_id: string
  voucher_no?: string
  running_balance: number
}

export interface StudentStatement {
  student_id: number
  student_name: string
  student_reg_no: string
  term_id?: number | null
  term_name: string
  opening_balance: number
  closing_balance: number
  entries: StatementEntry[]
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

// Attendance model (session-based)
export interface Attendance {
  id: number
  session: number // Timetable session ID
  student: number
  student_reg_no?: string // From backend serializer
  student_name?: string // From backend serializer
  session_department?: string // From backend serializer
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
  marked_by?: number
  marked_by_username?: string
  marked_at: string
  created_at: string
  updated_at: string
}

// Attendance roster student (for marking UI)
export interface AttendanceRosterStudent {
  student_id: number
  reg_no: string
  name: string
  status: string | null // Existing status from previous marks
}

// Attendance summary response
export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  leave: number
  percentage: number
}

// Timetable session
export interface Session {
  id: number
  academic_period: number
  academic_period_name?: string
  group: number
  group_name?: string
  faculty: number
  faculty_name?: string
  department: number
  department_name?: string
  starts_at: string
  ends_at: string
}

// Weekly Timetable
export interface TimetableCell {
  id: number
  weekly_timetable: number
  day_of_week: number // 0=Monday, 5=Saturday
  day_of_week_display?: string
  time_slot: string // e.g., "09:00-10:00"
  line1: string // e.g., course name, or groups like "Group A, Group B"
  line2: string // e.g., room number, or additional groups
  line3: string // e.g., faculty name, or additional info
  created_at?: string
  updated_at?: string
}

export interface WeeklyTimetable {
  id: number
  academic_period: number
  academic_period_name?: string
  batch: number
  batch_name?: string
  batch_program_name?: string
  week_start_date: string // ISO date string (Monday)
  week_end_date?: string // ISO date string (Saturday, calculated)
  status: 'draft' | 'published'
  created_by: number
  created_by_name?: string
  cells?: TimetableCell[]
  cell_count?: number // For list views
  created_at?: string
  updated_at?: string
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
