/**
 * Assessment API service
 */
import api from '@/api/axios'
import { Assessment, AssessmentScore, PaginatedResponse } from '@/types'

export const assessmentsService = {
  /**
   * Get all assessments with optional pagination and filters
   */
  async getAll(params?: {
    page?: number
    section?: number
  }): Promise<PaginatedResponse<Assessment>> {
    const response = await api.get<PaginatedResponse<Assessment>>('/api/assessments/', {
      params,
    })
    return response.data
  },

  /**
   * Get a single assessment by ID
   */
  async getById(id: number): Promise<Assessment> {
    const response = await api.get<Assessment>(`/api/assessments/${id}/`)
    return response.data
  },

  /**
   * Create a new assessment
   */
  async create(data: Omit<Assessment, 'id'>): Promise<Assessment> {
    const response = await api.post<Assessment>('/api/assessments/', data)
    return response.data
  },

  /**
   * Update an existing assessment
   */
  async update(id: number, data: Partial<Assessment>): Promise<Assessment> {
    const response = await api.patch<Assessment>(`/api/assessments/${id}/`, data)
    return response.data
  },

  /**
   * Delete an assessment
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/assessments/${id}/`)
  },
}

export const assessmentScoresService = {
  /**
   * Get all assessment scores with optional filters
   */
  async getAll(params?: {
    page?: number
    assessment?: number
    student?: number
  }): Promise<PaginatedResponse<AssessmentScore>> {
    const response = await api.get<PaginatedResponse<AssessmentScore>>('/api/assessment-scores/', {
      params,
    })
    return response.data
  },

  /**
   * Get a single assessment score by ID
   */
  async getById(id: number): Promise<AssessmentScore> {
    const response = await api.get<AssessmentScore>(`/api/assessment-scores/${id}/`)
    return response.data
  },

  /**
   * Create a new assessment score
   */
  async create(data: Omit<AssessmentScore, 'id'>): Promise<AssessmentScore> {
    const response = await api.post<AssessmentScore>('/api/assessment-scores/', data)
    return response.data
  },

  /**
   * Update an existing assessment score
   */
  async update(id: number, data: Partial<AssessmentScore>): Promise<AssessmentScore> {
    const response = await api.patch<AssessmentScore>(`/api/assessment-scores/${id}/`, data)
    return response.data
  },

  /**
   * Delete an assessment score
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/assessment-scores/${id}/`)
  },
}
