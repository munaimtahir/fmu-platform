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

  /**
   * Save a draft application (public, no auth required)
   */
  async saveDraft(data: Partial<StudentApplicationCreate> & { email: string }): Promise<{ message: string; draft: any }> {
    const formData = new FormData()
    
    // Email is required
    formData.append('email', data.email)
    
    // Add all form fields (except files)
    const formFields = [
      'first_name', 'last_name', 'father_name', 'gender', 'date_of_birth',
      'cnic', 'phone', 'address_city', 'address_district', 'address_state',
      'address_country', 'mailing_address_same', 'mailing_address',
      'mailing_city', 'mailing_district', 'mailing_state', 'mailing_country',
      'guardian_name', 'guardian_relation', 'guardian_phone', 'guardian_email',
      'guardian_mailing_address', 'mdcat_roll_number', 'merit_number',
      'merit_percentage', 'hssc_year', 'hssc_board', 'hssc_marks',
      'hssc_percentage', 'ssc_year', 'ssc_board', 'ssc_marks',
      'ssc_percentage', 'program', 'batch_year'
    ]
    
    for (const field of formFields) {
      const value = (data as any)[field]
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'boolean') {
          formData.append(field, value.toString())
        } else if (typeof value === 'object' && value instanceof Date) {
          formData.append(field, value.toISOString().split('T')[0])
        } else {
          formData.append(field, value.toString())
        }
      }
    }
    
    // Add files if present
    const fileFields = ['father_id_card', 'guardian_id_card', 'domicile', 'ssc_certificate', 'hssc_certificate', 'mdcat_result']
    for (const field of fileFields) {
      const file = (data as any)[field]
      if (file instanceof File) {
        formData.append(field, file)
      } else if (file && file.length > 0 && file[0] instanceof File) {
        formData.append(field, file[0])
      }
    }
    
    const response = await api.post(
      '/api/application-drafts/save/',
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
   * Load a draft by email (public, no auth required)
   */
  async loadDraft(email: string): Promise<{ message: string; draft: any; file_urls: Record<string, string> }> {
    const response = await api.post(
      '/api/application-drafts/load/',
      { email }
    )
    return response.data
  },

  /**
   * Submit a draft as final application (public, no auth required)
   */
  async submitDraft(email: string): Promise<{ message: string; application_id: number; draft_id: string }> {
    const response = await api.post(
      '/api/application-drafts/submit/',
      { email }
    )
    return response.data
  },
}

