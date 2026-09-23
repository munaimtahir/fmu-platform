/**
 * Student API service
 * 
 * Backend endpoint: /api/students/
 */
import api from '@/api/axios'
import { warnOnInvalidResponse, validatePaginatedResponse, validateStudentResponse } from '@/api/responseGuards'
import { Student, PaginatedResponse, FinanceSummary } from '@/types'
import type { OnboardingPayload, OnboardingProfile } from './onboarding'

/** Full student record as returned by `/api/students/{id}/` (adds the linked person and graduation years). */
export interface StudentDetail extends Student {
  person: number | null
  person_name?: string
  user: number | null
  enrollment_year: number | null
  expected_graduation_year: number | null
  actual_graduation_year: number | null
}

export interface StudentPlacementPayload {
  program: number
  batch: number
  group: number | null
}

export const studentsService = {
  /**
   * Get all students with optional pagination and filters
   */
  async getAll(params?: {
    page?: number
    search?: string
    program?: string
    status?: string
    onboarding_state?: string
  }): Promise<PaginatedResponse<Student>> {
    const response = await api.get<PaginatedResponse<Student>>('/api/students/', {
      params,
    })
    // Lightweight runtime guard (dev-only warnings)
    warnOnInvalidResponse(
      (data) => validatePaginatedResponse(data, validateStudentResponse),
      response.data,
      '/api/students/'
    )
    return response.data
  },

  /**
   * Get a single student by ID
   */
  async getById(id: number): Promise<Student> {
    const response = await api.get<Student>(`/api/students/${id}/`)
    return response.data
  },

  /**
   * Full record including the linked person and graduation years.
   */
  async getDetail(id: number): Promise<StudentDetail> {
    const response = await api.get<StudentDetail>(`/api/students/${id}/`)
    return response.data
  },

  /**
   * Change Program/Batch/Group (task: students.students.manage_placement).
   * The backend rejects a batch outside the program or a group outside the batch.
   */
  async updatePlacement(id: number, payload: StudentPlacementPayload): Promise<StudentDetail> {
    const response = await api.patch<StudentDetail>(`/api/students/${id}/placement/`, payload)
    return response.data
  },

  async getOnboarding(id: number): Promise<OnboardingPayload> {
    const response = await api.get<OnboardingPayload>(`/api/students/${id}/onboarding/`)
    return response.data
  },

  async updateProfile(id: number, payload: Partial<OnboardingProfile>): Promise<OnboardingPayload> {
    const response = await api.patch<OnboardingPayload>(`/api/students/${id}/profile/`, payload)
    return response.data
  },

  async updateStatus(id: number, status: Student['status']): Promise<StudentDetail> {
    const response = await api.patch<StudentDetail>(`/api/students/${id}/status/`, { status })
    return response.data
  },

  /**
   * Outstanding balance and gating for one student (task: finance.summary.view; students may read their own).
   */
  async getFinanceSummary(id: number, termId?: number): Promise<FinanceSummary> {
    const response = await api.get<FinanceSummary>(`/api/finance/students/${id}/`, {
      params: termId ? { term: termId } : undefined,
    })
    return response.data
  },

  /**
   * Get aggregate student counts by status (computed server-side, not
   * limited to a single page of results).
   */
  async getStats(): Promise<{ total: number; by_status: Record<string, number> }> {
    const response = await api.get<{ total: number; by_status: Record<string, number> }>('/api/students/stats/')
    return response.data
  },
}
