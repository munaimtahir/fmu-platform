/**
 * Batch API service
 */
import api from '@/api/axios'
import { PaginatedResponse } from '@/types'

export interface Batch {
  id: number
  name: string
  program: number
  program_name?: string
  year: number
  start_date?: string
  end_date?: string
  is_active: boolean
}

export const batchesService = {
  async getAll(params?: {
    page?: number
    search?: string
    program?: number
    is_active?: boolean
  }): Promise<PaginatedResponse<Batch>> {
    const response = await api.get<PaginatedResponse<Batch>>('/api/academics/batches/', { params })
    return response.data
  },

  async getById(id: number): Promise<Batch> {
    const response = await api.get<Batch>(`/api/academics/batches/${id}/`)
    return response.data
  },
}
