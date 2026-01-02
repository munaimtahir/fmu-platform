/**
 * Timetable sessions API service
 */
import api from '@/api/axios'
import { PaginatedResponse, Session } from '@/types'

export const sessionsService = {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Session>> {
    const response = await api.get<PaginatedResponse<Session>>('/api/timetable/sessions/', {
      params,
    })
    return response.data
  },
}
