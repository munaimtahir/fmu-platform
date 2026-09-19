/**
 * Results API service
 * 
 * Backend endpoints:
 * - /api/results/ (ResultHeaderViewSet)
 * - /api/result-components/ (ResultComponentEntryViewSet)
 */
import api from '@/api/axios'
import { warnOnInvalidResponse, validatePaginatedResponse, validateResultHeaderResponse } from '@/api/responseGuards'
import { PaginatedResponse } from '@/types'

export type ResultStatus = 'DRAFT' | 'VERIFIED' | 'PUBLISHED' | 'FROZEN'
export type ResultOutcome = 'PASS' | 'FAIL' | 'PENDING'

/** Fields a result header may be created or edited with (outcome is computed by the backend). */
export interface ResultHeaderInput {
  exam: number
  student: number
  total_obtained?: string | number
  total_max?: string | number
}

export interface ResultHeader {
  id: number
  exam: number
  exam_title?: string
  student: number
  student_name?: string
  student_reg_no?: string
  total_obtained: string | number
  total_max: string | number
  final_outcome: ResultOutcome
  status: ResultStatus
  component_entries?: ResultComponent[]
  created_at?: string
  updated_at?: string
}

export interface ResultComponent {
  id: number
  result_header: number
  exam_component: number
  exam_component_name?: string
  exam_component_max_marks?: string | number
  marks_obtained: string | number
  component_outcome?: 'PASS' | 'FAIL' | 'NA' | string
}

export const resultsService = {
  async getAll(params?: {
    page?: number
    search?: string
    exam?: number
    student?: number
    status?: ResultStatus
    final_outcome?: ResultOutcome
    ordering?: string
  }): Promise<PaginatedResponse<ResultHeader>> {
    const response = await api.get<PaginatedResponse<ResultHeader>>('/api/results/', { params })
    // Lightweight runtime guard (dev-only warnings)
    warnOnInvalidResponse(
      (data) => validatePaginatedResponse(data, validateResultHeaderResponse),
      response.data,
      '/api/results/'
    )
    return response.data
  },

  async getById(id: number): Promise<ResultHeader> {
    const response = await api.get<ResultHeader>(`/api/results/${id}/`)
    return response.data
  },

  /** The signed-in student's own published or frozen results (unpaginated). */
  async getMine(): Promise<ResultHeader[]> {
    const response = await api.get<ResultHeader[]>('/api/results/me/')
    return response.data
  },

  /** Every result for one exam the caller may see (unpaginated). */
  async getByExam(examId: number): Promise<ResultHeader[]> {
    const response = await api.get<ResultHeader[]>(`/api/results/exams/${examId}/`)
    return response.data
  },

  async create(data: ResultHeaderInput): Promise<ResultHeader> {
    const response = await api.post<ResultHeader>('/api/results/', data)
    return response.data
  },

  /** Edit totals of a DRAFT result; the backend recomputes the outcome. */
  async update(id: number, data: Partial<ResultHeaderInput>): Promise<ResultHeader> {
    const response = await api.patch<ResultHeader>(`/api/results/${id}/`, data)
    return response.data
  },

  async getComponents(resultId: number): Promise<PaginatedResponse<ResultComponent>> {
    const response = await api.get<PaginatedResponse<ResultComponent>>('/api/result-components/', {
      params: { result_header: resultId },
    })
    return response.data
  },

  async verify(id: number): Promise<ResultHeader> {
    const response = await api.post<ResultHeader>(`/api/results/${id}/verify/`)
    return response.data
  },

  async publish(id: number): Promise<ResultHeader> {
    const response = await api.post<ResultHeader>(`/api/results/${id}/publish/`)
    return response.data
  },

  async freeze(id: number): Promise<ResultHeader> {
    const response = await api.post<ResultHeader>(`/api/results/${id}/freeze/`)
    return response.data
  },
}
