/**
 * Program API service
 */
import api from '@/api/axios'
import { Program, PaginatedResponse } from '@/types'

export const programsService = {
  /**
   * Get all programs with optional pagination and filters
   */
  async getAll(params?: {
    page?: number
    search?: string
    level?: string
    category?: string
    is_active?: boolean
  }): Promise<PaginatedResponse<Program>> {
    const response = await api.get<PaginatedResponse<Program>>('/api/academics/programs/', {
      params,
    })
    return response.data
  },

  /**
   * Get a single program by ID
   */
  async getById(id: number): Promise<Program> {
    const response = await api.get<Program>(`/api/programs/${id}/`)
    return response.data
  },

  /**
   * Get active programs for a specific level and category
   */
  async getByLevelAndCategory(
    level: string,
    category: string
  ): Promise<Program[]> {
    const response = await api.get<PaginatedResponse<Program>>('/api/academics/programs/', {
      params: {
        level,
        category,
        is_active: true,
      },
    })
    return response.data.results
  },
}

