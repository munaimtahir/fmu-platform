/**
 * Section API service
 * 
 * Backend endpoint: /api/academics/sections/
 */
import api from '@/api/axios'
import { Section, PaginatedResponse } from '@/types'

export const sectionsService = {
  /**
   * Get all sections with optional pagination and filters
   */
  async getAll(params?: {
    page?: number
    search?: string
    course?: number
    term?: number
  }): Promise<PaginatedResponse<Section>> {
    const response = await api.get<PaginatedResponse<Section>>('/api/academics/sections/', {
      params,
    })
    return response.data
  },

  /**
   * Get a single section by ID
   */
  async getById(id: number): Promise<Section> {
    const response = await api.get<Section>(`/api/academics/sections/${id}/`)
    return response.data
  },

  /**
   * Create a new section
   */
  async create(data: Omit<Section, 'id'>): Promise<Section> {
    const response = await api.post<Section>('/api/academics/sections/', data)
    return response.data
  },

  /**
   * Update an existing section
   */
  async update(id: number, data: Partial<Section>): Promise<Section> {
    const response = await api.patch<Section>(`/api/academics/sections/${id}/`, data)
    return response.data
  },

  /**
   * Delete a section
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/academics/sections/${id}/`)
  },
}
