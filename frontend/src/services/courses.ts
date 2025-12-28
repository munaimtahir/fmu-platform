/**
 * Course API service
 */
import api from '@/api/axios'
import { Course, PaginatedResponse } from '@/types'

export const coursesService = {
  /**
   * Get all courses with optional pagination and filters
   */
  async getAll(params?: {
    page?: number
    search?: string
    program?: string
  }): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/api/courses/', {
      params,
    })
    return response.data
  },

  /**
   * Get a single course by ID
   */
  async getById(id: number): Promise<Course> {
    const response = await api.get<Course>(`/api/courses/${id}/`)
    return response.data
  },

  /**
   * Create a new course
   */
  async create(data: Omit<Course, 'id'>): Promise<Course> {
    const response = await api.post<Course>('/api/courses/', data)
    return response.data
  },

  /**
   * Update an existing course
   */
  async update(id: number, data: Partial<Course>): Promise<Course> {
    const response = await api.patch<Course>(`/api/courses/${id}/`, data)
    return response.data
  },

  /**
   * Delete a course
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/courses/${id}/`)
  },
}
