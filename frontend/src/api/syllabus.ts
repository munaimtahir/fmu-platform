import api from './axios'
import { PaginatedResponse } from '@/types'

export interface SyllabusItem {
  id: number
  program?: number
  program_name?: string
  period?: number
  period_name?: string
  learning_block?: number
  learning_block_name?: string
  module?: number
  module_name?: string
  title: string
  code?: string
  description?: string
  learning_objectives?: string
  order_no: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateSyllabusItemData {
  program?: number
  period?: number
  learning_block?: number
  module?: number
  title: string
  code?: string
  description?: string
  learning_objectives?: string
  order_no: number
  is_active?: boolean
}

export interface ReorderItemsData {
  items: Array<{ id: number; order_no: number }>
}

export const syllabusApi = {
  /**
   * Get all syllabus items with optional filters
   */
  async getAll(params?: {
    program_id?: number
    period_id?: number
    learning_block_id?: number
    module_id?: number
    is_active?: boolean
    title?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<SyllabusItem>> {
    const response = await api.get<PaginatedResponse<SyllabusItem>>('/api/admin/syllabus/', { params })
    return response.data
  },

  /**
   * Get a single syllabus item by ID
   */
  async getById(id: number): Promise<SyllabusItem> {
    const response = await api.get<SyllabusItem>(`/api/admin/syllabus/${id}/`)
    return response.data
  },

  /**
   * Create a new syllabus item
   */
  async create(data: CreateSyllabusItemData): Promise<SyllabusItem> {
    const response = await api.post<SyllabusItem>('/api/admin/syllabus/', data)
    return response.data
  },

  /**
   * Update a syllabus item
   */
  async update(id: number, data: Partial<CreateSyllabusItemData>): Promise<SyllabusItem> {
    const response = await api.patch<SyllabusItem>(`/api/admin/syllabus/${id}/`, data)
    return response.data
  },

  /**
   * Delete a syllabus item
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/admin/syllabus/${id}/`)
  },

  /**
   * Bulk reorder syllabus items
   */
  async reorder(data: ReorderItemsData): Promise<{ success: boolean; updated: number }> {
    const response = await api.post<{ success: boolean; updated: number }>(
      '/api/admin/syllabus/reorder/',
      data
    )
    return response.data
  },
}
