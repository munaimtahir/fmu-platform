/**
 * Section API service
 * 
 * Backend endpoint: /api/academics/sections/
 */
import api from '@/api/axios'
import { Section, PaginatedResponse } from '@/types'

/** Section as returned by the academics API (the shared `Section` type is a stale legacy shape). */
export interface AcademicSection {
  id: number
  course: number
  course_code: string
  course_name: string
  name: string
  academic_period: number
  academic_period_name: string
  faculty: number | null
  faculty_username: string | null
  group: number | null
  group_name: string | null
  capacity: number
  enrolled_count: number
  created_at?: string
  updated_at?: string
}

export const sectionsService = {
  /**
   * List sections as the academics API returns them
   */
  async list(params?: {
    page?: number
    search?: string
    course?: number
    academic_period?: number
    faculty?: number
    group?: number
  }): Promise<PaginatedResponse<AcademicSection>> {
    const response = await api.get<PaginatedResponse<AcademicSection>>('/api/academics/sections/', { params })
    return response.data
  },

  /**
   * Get one section as the academics API returns it
   */
  async getSection(id: number): Promise<AcademicSection> {
    const response = await api.get<AcademicSection>(`/api/academics/sections/${id}/`)
    return response.data
  },

  /**
   * Get all sections with optional pagination and filters
   */
  async getAll(params?: {
    page?: number
    search?: string
    course?: number
    term?: number
  }): Promise<PaginatedResponse<Section>> {
    const response = await api.get<PaginatedResponse<Section>>('/api/academics/sections/', {
      params,
    })
    return response.data
  },

  /**
   * Get a single section by ID
   */
  async getById(id: number): Promise<Section> {
    const response = await api.get<Section>(`/api/academics/sections/${id}/`)
    return response.data
  },

  /**
   * Create a new section
   */
  async create(data: Omit<Section, 'id'>): Promise<Section> {
    const response = await api.post<Section>('/api/academics/sections/', data)
    return response.data
  },

  /**
   * Update an existing section
   */
  async update(id: number, data: Partial<Section>): Promise<Section> {
    const response = await api.patch<Section>(`/api/academics/sections/${id}/`, data)
    return response.data
  },

  /**
   * Delete a section
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/academics/sections/${id}/`)
  },
}
