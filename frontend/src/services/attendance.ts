/**
 * Attendance API service
 * 
 * Backend endpoint: /api/attendance/
 * Note: Attendance is tracked per Session (from timetable), not Section (from courses)
 */
import api from '@/api/axios'
import { downloadFile } from '@/lib/download'
import { warnOnInvalidResponse, validatePaginatedResponse, validateAttendanceResponse } from '@/api/responseGuards'
import { Attendance, PaginatedResponse } from '@/types'

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE']

export interface EligibilityResult {
  eligible: boolean
  attendance_percentage: number
  threshold: number
  student_id: number
  section_id: number
}

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
      `/api/attendance/sessions/${sessionId}/mark/`,
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

  /**
   * Get one attendance record
   */
  async getById(id: number): Promise<Attendance> {
    const response = await api.get<Attendance>(`/api/attendance/${id}/`)
    return response.data
  },

  /**
   * Correct the status of one record.  Allowed for holders of attendance.attendances.edit
   * and for the faculty member who teaches the record's session.
   */
  async updateStatus(id: number, status: AttendanceStatus): Promise<Attendance> {
    const response = await api.patch<Attendance>(`/api/attendance/${id}/`, { status })
    return response.data
  },

  /**
   * Delete one record (same authorization as `updateStatus`).
   */
  async remove(id: number): Promise<void> {
    await api.delete(`/api/attendance/${id}/`)
  },

  /**
   * Download attendance records as CSV, honouring the same filters as the list.
   * The backend caps the export at 10,000 rows.
   */
  async exportCsv(params?: { session?: number; student?: number; status?: AttendanceStatus }): Promise<string> {
    return downloadFile('/api/attendance/export/', { params, filename: 'attendance_export.csv' })
  },

  /**
   * Eligibility of one student in one section against an attendance threshold (percent).
   */
  async getEligibility(params: { studentId: number; sectionId: number; threshold?: number }): Promise<EligibilityResult> {
    const response = await api.get<EligibilityResult>('/api/attendance/eligibility/', {
      params: { student_id: params.studentId, section_id: params.sectionId, threshold: params.threshold },
    })
    return response.data
  },
}
