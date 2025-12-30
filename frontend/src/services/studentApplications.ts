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
    
    // Personal Information
    formData.append('first_name', data.first_name)
    formData.append('last_name', data.last_name)
    formData.append('father_name', data.father_name)
    formData.append('gender', data.gender)
    formData.append('date_of_birth', data.date_of_birth)
    formData.append('cnic', data.cnic)
    formData.append('email', data.email)
    formData.append('phone', data.phone)
    
    // Address
    formData.append('address_city', data.address_city)
    formData.append('address_district', data.address_district)
    formData.append('address_state', data.address_state)
    formData.append('address_country', data.address_country)
    
    // Mailing Address
    formData.append('mailing_address_same', data.mailing_address_same.toString())
    if (data.mailing_address) {
      formData.append('mailing_address', data.mailing_address)
    }
    if (data.mailing_city) {
      formData.append('mailing_city', data.mailing_city)
    }
    if (data.mailing_district) {
      formData.append('mailing_district', data.mailing_district)
    }
    if (data.mailing_state) {
      formData.append('mailing_state', data.mailing_state)
    }
    if (data.mailing_country) {
      formData.append('mailing_country', data.mailing_country)
    }
    
    // Guardian Information
    formData.append('guardian_name', data.guardian_name)
    formData.append('guardian_relation', data.guardian_relation)
    formData.append('guardian_phone', data.guardian_phone)
    formData.append('guardian_email', data.guardian_email)
    formData.append('guardian_mailing_address', data.guardian_mailing_address)
    
    // Admission/Merit Details
    formData.append('mdcat_roll_number', data.mdcat_roll_number)
    formData.append('merit_number', data.merit_number.toString())
    formData.append('merit_percentage', data.merit_percentage.toString())
    
    // Qualifications - HSSC
    formData.append('hssc_year', data.hssc_year.toString())
    formData.append('hssc_board', data.hssc_board)
    formData.append('hssc_marks', data.hssc_marks.toString())
    formData.append('hssc_percentage', data.hssc_percentage.toString())
    
    // Qualifications - SSC
    formData.append('ssc_year', data.ssc_year.toString())
    formData.append('ssc_board', data.ssc_board)
    formData.append('ssc_marks', data.ssc_marks.toString())
    formData.append('ssc_percentage', data.ssc_percentage.toString())
    
    // Academic Information
    if (data.program) {
      formData.append('program', data.program.toString())
    }
    formData.append('batch_year', data.batch_year.toString())
    
    // Documents
    formData.append('father_id_card', data.father_id_card)
    if (data.guardian_id_card) {
      formData.append('guardian_id_card', data.guardian_id_card)
    }
    formData.append('domicile', data.domicile)
    formData.append('ssc_certificate', data.ssc_certificate)
    formData.append('hssc_certificate', data.hssc_certificate)
    formData.append('mdcat_result', data.mdcat_result)

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

