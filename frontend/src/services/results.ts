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

export interface ResultHeader {
  id: number
  exam: number
  exam_title?: string
  student: number
  student_name?: string
  student_reg_no?: string
  total_obtained: string | number
  total_max: string | number
  final_outcome: 'PASS' | 'FAIL' | 'PENDING'
  status: 'DRAFT' | 'VERIFIED' | 'PUBLISHED' | 'FROZEN'
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
  component_outcome?: string
}

export const resultsService = {
  async getAll(params?: {
    page?: number
    search?: string
    exam?: number
    student?: number
    status?: ResultHeader['status']
    final_outcome?: ResultHeader['final_outcome']
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
