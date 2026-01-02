/**
 * Timetable sessions API service
 */
import api from '@/api/axios'
import { PaginatedResponse, Session } from '@/types'

export const sessionsService = {
  /**
   * Get all sessions with optional pagination and filters
   */
  async getAll(params?: {
    page?: number
    search?: string
    academic_period?: number
    group?: number
    faculty?: number
    department?: number
    ordering?: string
  }): Promise<PaginatedResponse<Session>> {
    const response = await api.get<PaginatedResponse<Session>>('/api/timetable/sessions/', {
      params,
    })
    return response.data
  },

  /**
   * Get a single session by ID
   */
  async getById(id: number): Promise<Session> {
    const response = await api.get<Session>(`/api/timetable/sessions/${id}/`)
    return response.data
  },

  /**
   * Create a new session
   */
  async create(data: Omit<Session, 'id' | 'academic_period_name' | 'group_name' | 'faculty_name' | 'department_name'>): Promise<Session> {
    const response = await api.post<Session>('/api/timetable/sessions/', data)
    return response.data
  },

  /**
   * Update an existing session
   */
  async update(id: number, data: Partial<Omit<Session, 'id' | 'academic_period_name' | 'group_name' | 'faculty_name' | 'department_name'>>): Promise<Session> {
    const response = await api.patch<Session>(`/api/timetable/sessions/${id}/`, data)
    return response.data
  },

  /**
   * Delete a session
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/timetable/sessions/${id}/`)
  },
}
