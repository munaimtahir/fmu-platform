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
  start_year: number
  year: number
  start_date?: string
  end_date?: string
  is_active: boolean
}

export interface CreateBatchData {
  name: string
  program: number
  start_year: number
  is_active?: boolean
}

export interface UpdateBatchData extends Partial<CreateBatchData> {}

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

  async create(data: CreateBatchData): Promise<Batch> {
    const response = await api.post<Batch>('/api/academics/batches/', data)
    return response.data
  },

  async update(id: number, data: UpdateBatchData): Promise<Batch> {
    const response = await api.patch<Batch>(`/api/academics/batches/${id}/`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/academics/batches/${id}/`)
  },
}
