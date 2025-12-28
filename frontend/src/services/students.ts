/**
 * Student API service
 */
import api from '@/api/axios'
import { Student, PaginatedResponse } from '@/types'

export const studentsService = {
  /**
   * Get all students with optional pagination and filters
   */
  async getAll(params?: {
    page?: number
    search?: string
    program?: string
    status?: string
  }): Promise<PaginatedResponse<Student>> {
    const response = await api.get<PaginatedResponse<Student>>('/api/students/', {
      params,
    })
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
   * Create a new student
   */
  async create(data: Omit<Student, 'id'>): Promise<Student> {
    const response = await api.post<Student>('/api/students/', data)
    return response.data
  },

  /**
   * Update an existing student
   */
  async update(id: number, data: Partial<Student>): Promise<Student> {
    const response = await api.patch<Student>(`/api/students/${id}/`, data)
    return response.data
  },

  /**
   * Delete a student
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/students/${id}/`)
  },
}
