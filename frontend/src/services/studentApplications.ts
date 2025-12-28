/**
 * Student Application API service
 */
import api from '@/api/axios'
import { StudentApplication, StudentApplicationCreate, PaginatedResponse } from '@/types'

export const studentApplicationsService = {
  /**
   * Submit a new student application (public endpoint, no auth required)
   */
  async submit(data: StudentApplicationCreate): Promise<StudentApplication> {
    const formData = new FormData()
    
    // Add all text fields
    formData.append('full_name', data.full_name)
    formData.append('date_of_birth', data.date_of_birth)
    formData.append('email', data.email)
    formData.append('phone', data.phone)
    if (data.address) {
      formData.append('address', data.address)
    }
    formData.append('program', data.program.toString())
    formData.append('batch_year', data.batch_year.toString())
    if (data.previous_qualification) {
      formData.append('previous_qualification', data.previous_qualification)
    }
    if (data.previous_institution) {
      formData.append('previous_institution', data.previous_institution)
    }
    
    // Add file if provided
    if (data.documents) {
      formData.append('documents', data.documents)
    }

    const response = await api.post<StudentApplication>(
      '/api/student-applications/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Get all applications (admin only, requires auth)
   */
  async getAll(params?: {
    page?: number
    search?: string
    status?: string
    program?: number
    batch_year?: number
  }): Promise<PaginatedResponse<StudentApplication>> {
    const response = await api.get<PaginatedResponse<StudentApplication>>(
      '/api/student-applications/',
      { params }
    )
    return response.data
  },

  /**
   * Get a single application by ID (admin only, requires auth)
   */
  async getById(id: number): Promise<StudentApplication> {
    const response = await api.get<StudentApplication>(
      `/api/student-applications/${id}/`
    )
    return response.data
  },

  /**
   * Approve an application (admin only, requires auth)
   */
  async approve(id: number): Promise<{ message: string; application: StudentApplication; student: any }> {
    const response = await api.post(
      `/api/student-applications/${id}/approve/`
    )
    return response.data
  },

  /**
   * Reject an application (admin only, requires auth)
   */
  async reject(id: number, reason?: string): Promise<{ message: string; application: StudentApplication }> {
    const response = await api.post(
      `/api/student-applications/${id}/reject/`,
      { reason }
    )
    return response.data
  },
}

