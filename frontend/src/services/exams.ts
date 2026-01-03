/**
 * Exams API service
 */
import api from '@/api/axios'
import { PaginatedResponse } from '@/types'

export interface Exam {
  id: number
  name: string
  exam_type?: string
  academic_period?: number
  start_date?: string
  end_date?: string
}

export interface ExamComponent {
  id: number
  exam: number
  name: string
  weight?: number
  max_score?: number
}

export const examsService = {
  async getAll(params?: {
    page?: number
    search?: string
    academic_period?: number
  }): Promise<PaginatedResponse<Exam>> {
    const response = await api.get<PaginatedResponse<Exam>>('/api/exams/', { params })
    return response.data
  },

  async getById(id: number): Promise<Exam> {
    const response = await api.get<Exam>(`/api/exams/${id}/`)
    return response.data
  },

  async getComponents(examId: number): Promise<PaginatedResponse<ExamComponent>> {
    const response = await api.get<PaginatedResponse<ExamComponent>>('/api/exam-components/', {
      params: { exam: examId },
    })
    return response.data
  },
}
