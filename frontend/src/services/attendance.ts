/**
 * Attendance API service
 * 
 * Backend endpoint: /api/attendance/
 * Note: Attendance is tracked per Session (from timetable), not Section (from courses)
 */
import api from '@/api/axios'
import { warnOnInvalidResponse, validatePaginatedResponse, validateAttendanceResponse } from '@/api/responseGuards'
import { Attendance, PaginatedResponse } from '@/types'

export const attendanceService = {
  /**
   * Get attendance records with filters
   */
  async getAll(params?: {
    page?: number
    session?: number
    student?: number
    date?: string
    status?: string
  }): Promise<PaginatedResponse<Attendance>> {
    const response = await api.get<PaginatedResponse<Attendance>>('/api/attendance/', {
      params,
    })
    // Lightweight runtime guard (dev-only warnings)
    warnOnInvalidResponse(
      (data) => validatePaginatedResponse(data, validateAttendanceResponse),
      response.data,
      '/api/attendance/'
    )
    return response.data
  },

  /**
   * Mark attendance for a specific session (creates/updates individual records)
   * @param sessionId - The timetable session ID
   * @param data - Attendance data including date and records
   */
  async markAttendance(sessionId: number, data: {
    date: string
    attendance: Array<{
      student_id: number
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
    }>
  }): Promise<{ created: number; updated: number; total: number }> {
    const response = await api.post<{ created: number; updated: number; total: number }>(
      `/api/attendance/sessions/${sessionId}/mark`,
      data
    )
    return response.data
  },

  /**
   * Get attendance for a specific session
   */
  async getBySessionId(sessionId: number, params?: {
    date?: string
  }): Promise<PaginatedResponse<Attendance>> {
    const response = await api.get<PaginatedResponse<Attendance>>(
      '/api/attendance/',
      { params: { ...params, session: sessionId } }
    )
    return response.data
  },

  /**
   * Get attendance summary/percentage for a student
   */
  async getSummary(params?: {
    student?: number
    session?: number
  }): Promise<{
    total: number
    present: number
    absent: number
    late: number
    leave: number
    percentage: number
  }> {
    const response = await api.get('/api/attendance/summary/', { params })
    return response.data
  },
}
