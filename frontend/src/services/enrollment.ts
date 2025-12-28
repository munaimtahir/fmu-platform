/**
 * Enrollment API service
 */
import api from '@/api/axios'
import { Enrollment, PaginatedResponse } from '@/types'

export const enrollmentService = {
  /**
   * Get all enrollments with optional filters
   */
  async getAll(params?: {
    page?: number
    search?: string
    student?: number
    section?: number
  }): Promise<PaginatedResponse<Enrollment>> {
    const response = await api.get<PaginatedResponse<Enrollment>>('/api/enrollments/', {
      params,
    })
    return response.data
  },

  /**
   * Get a single enrollment by ID
   */
  async getById(id: number): Promise<Enrollment> {
    const response = await api.get<Enrollment>(`/api/enrollments/${id}/`)
    return response.data
  },

  /**
   * Enroll a single student in a section
   */
  async enrollStudent(sectionId: number, studentId: number): Promise<Enrollment> {
    const response = await api.post<Enrollment>(`/api/sections/${sectionId}/enroll/`, {
      student_id: studentId,
    })
    return response.data
  },

  /**
   * Enroll multiple students in a section (bulk operation)
   * Calls the API multiple times and returns results
   */
  async enrollStudentsBulk(
    sectionId: number,
    studentIds: number[]
  ): Promise<{
    successful: Array<{ studentId: number; enrollment: Enrollment }>
    failed: Array<{ studentId: number; error: string }>
  }> {
    const results = await Promise.allSettled(
      studentIds.map(async (studentId) => {
        const enrollment = await this.enrollStudent(sectionId, studentId)
        return { studentId, enrollment }
      })
    )

    const successful: Array<{ studentId: number; enrollment: Enrollment }> = []
    const failed: Array<{ studentId: number; error: string }> = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value)
      } else {
        const error = result.reason?.response?.data?.error?.message || result.reason?.message || 'Unknown error'
        failed.push({
          studentId: studentIds[index],
          error,
        })
      }
    })

    return { successful, failed }
  },

  /**
   * Delete an enrollment
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/enrollments/${id}/`)
  },
}
