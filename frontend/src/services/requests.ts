/**
 * Requests API service (Bonafide, Transcript, NOC requests)
 */
import api from '@/api/axios'
import { PaginatedResponse } from '@/types'

export interface Request {
  id: number
  student: number
  student_name?: string
  student_reg_no?: string
  request_type: 'bonafide' | 'transcript' | 'noc' | 'other'
  status: 'pending' | 'approved' | 'rejected'
  requested_at?: string
  approved_at?: string
  approved_by?: number
  notes?: string
}

export const requestsService = {
  async getAll(params?: {
    page?: number
    search?: string
    student?: number
    request_type?: string
    status?: string
  }): Promise<PaginatedResponse<Request>> {
    const response = await api.get<PaginatedResponse<Request>>('/api/requests/', { params })
    return response.data
  },

  async getById(id: number): Promise<Request> {
    const response = await api.get<Request>(`/api/requests/${id}/`)
    return response.data
  },
}
