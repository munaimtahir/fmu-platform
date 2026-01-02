/**
 * Results API service
 */
import api from '@/api/axios'
import { PaginatedResponse } from '@/types'

export interface ResultHeader {
  id: number
  student: number
  student_name?: string
  student_reg_no?: string
  academic_period?: number
  program?: number
  program_name?: string
  total_score?: number
  grade?: string
  status?: string
  published?: boolean
}

export interface ResultComponent {
  id: number
  result_header: number
  component_name: string
  score?: number
  max_score?: number
  weight?: number
}

export const resultsService = {
  async getAll(params?: {
    page?: number
    search?: string
    student?: number
    academic_period?: number
    program?: number
    published?: boolean
  }): Promise<PaginatedResponse<ResultHeader>> {
    const response = await api.get<PaginatedResponse<ResultHeader>>('/api/results/', { params })
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
}
