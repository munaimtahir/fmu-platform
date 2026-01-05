/**
 * Academics Module API service
 * Handles Program, Period, Track, LearningBlock, Module, and Department operations
 */
import api from '@/api/axios'
import { PaginatedResponse } from '@/types'

// Type definitions
export interface Program {
  id: number
  name: string
  description: string
  is_active: boolean
  structure_type: 'YEARLY' | 'SEMESTER' | 'CUSTOM'
  is_finalized: boolean
  period_length_months?: number
  total_periods?: number
  created_at: string
  updated_at: string
}

export interface Period {
  id: number
  program: number
  program_name: string
  name: string
  order: number
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface Track {
  id: number
  program: number
  program_name: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface Department {
  id: number
  name: string
  code?: string
  description: string
  parent?: number
  parent_name?: string
  children_count: number
  created_at: string
  updated_at: string
}

export interface Module {
  id: number
  block: number
  block_name: string
  name: string
  description: string
  order: number
  created_at: string
  updated_at: string
}

export interface LearningBlock {
  id: number
  period: number
  period_name: string
  track: number
  track_name: string
  name: string
  block_type: 'INTEGRATED_BLOCK' | 'ROTATION_BLOCK'
  start_date: string
  end_date: string
  primary_department?: number
  primary_department_name?: string
  sub_department?: number
  sub_department_name?: string
  modules?: Module[]
  modules_count: number
  created_at: string
  updated_at: string
}

export interface CreateProgramData {
  name: string
  description?: string
  is_active?: boolean
  structure_type: 'YEARLY' | 'SEMESTER' | 'CUSTOM'
  period_length_months?: number
  total_periods?: number
}

export interface CreatePeriodData {
  program: number
  name: string
  order: number
  start_date?: string
  end_date?: string
}

export interface CreateTrackData {
  program: number
  name: string
  description?: string
}

export interface CreateDepartmentData {
  name: string
  code?: string
  description?: string
  parent?: number
}

export interface CreateLearningBlockData {
  period: number
  track: number
  name: string
  block_type: 'INTEGRATED_BLOCK' | 'ROTATION_BLOCK'
  start_date: string
  end_date: string
  primary_department?: number
  sub_department?: number
}

export interface CreateModuleData {
  block: number
  name: string
  description?: string
  order: number
}

export const academicsNewService = {
  // Programs
  async getPrograms(params?: {
    is_active?: boolean
    structure_type?: string
    is_finalized?: boolean
    search?: string
  }): Promise<Program[]> {
    const response = await api.get<PaginatedResponse<Program>>('/api/academics/programs/', { params })
    return response.data.results || response.data
  },

  async getProgram(id: number): Promise<Program> {
    const response = await api.get<Program>(`/api/academics/programs/${id}/`)
    return response.data
  },

  async createProgram(data: CreateProgramData): Promise<Program> {
    const response = await api.post<Program>('/api/academics/programs/', data)
    return response.data
  },

  async updateProgram(id: number, data: Partial<CreateProgramData>): Promise<Program> {
    const response = await api.patch<Program>(`/api/academics/programs/${id}/`, data)
    return response.data
  },

  async deleteProgram(id: number): Promise<void> {
    await api.delete(`/api/academics/programs/${id}/`)
  },

  async finalizeProgram(id: number): Promise<Program> {
    const response = await api.post<Program>(`/api/academics/programs/${id}/finalize/`)
    return response.data
  },

  async generatePeriods(id: number): Promise<Period[]> {
    const response = await api.post<Period[]>(`/api/academics/programs/${id}/generate-periods/`)
    return response.data
  },

  // Periods
  async getPeriods(params?: { program?: number }): Promise<Period[]> {
    const response = await api.get<PaginatedResponse<Period>>('/api/academics/periods/', { params })
    return response.data.results || response.data
  },

  async getPeriod(id: number): Promise<Period> {
    const response = await api.get<Period>(`/api/academics/periods/${id}/`)
    return response.data
  },

  async createPeriod(data: CreatePeriodData): Promise<Period> {
    const response = await api.post<Period>('/api/academics/periods/', data)
    return response.data
  },

  async updatePeriod(id: number, data: Partial<CreatePeriodData>): Promise<Period> {
    const response = await api.patch<Period>(`/api/academics/periods/${id}/`, data)
    return response.data
  },

  async deletePeriod(id: number): Promise<void> {
    await api.delete(`/api/academics/periods/${id}/`)
  },

  // Tracks
  async getTracks(params?: { program?: number }): Promise<Track[]> {
    const response = await api.get<PaginatedResponse<Track>>('/api/academics/tracks/', { params })
    return response.data.results || response.data
  },

  async getTrack(id: number): Promise<Track> {
    const response = await api.get<Track>(`/api/academics/tracks/${id}/`)
    return response.data
  },

  async createTrack(data: CreateTrackData): Promise<Track> {
    const response = await api.post<Track>('/api/academics/tracks/', data)
    return response.data
  },

  async updateTrack(id: number, data: Partial<CreateTrackData>): Promise<Track> {
    const response = await api.patch<Track>(`/api/academics/tracks/${id}/`, data)
    return response.data
  },

  async deleteTrack(id: number): Promise<void> {
    await api.delete(`/api/academics/tracks/${id}/`)
  },

  // Learning Blocks
  async getBlocks(params?: {
    period?: number
    track?: number
    block_type?: string
    primary_department?: number
  }): Promise<LearningBlock[]> {
    const response = await api.get<PaginatedResponse<LearningBlock>>('/api/academics/blocks/', { params })
    return response.data.results || response.data
  },

  async getBlock(id: number): Promise<LearningBlock> {
    const response = await api.get<LearningBlock>(`/api/academics/blocks/${id}/`)
    return response.data
  },

  async createBlock(data: CreateLearningBlockData): Promise<LearningBlock> {
    const response = await api.post<LearningBlock>('/api/academics/blocks/', data)
    return response.data
  },

  async updateBlock(id: number, data: Partial<CreateLearningBlockData>): Promise<LearningBlock> {
    const response = await api.patch<LearningBlock>(`/api/academics/blocks/${id}/`, data)
    return response.data
  },

  async deleteBlock(id: number): Promise<void> {
    await api.delete(`/api/academics/blocks/${id}/`)
  },

  // Modules
  async getModules(params?: { block?: number }): Promise<Module[]> {
    const response = await api.get<PaginatedResponse<Module>>('/api/academics/modules/', { params })
    return response.data.results || response.data
  },

  async getModule(id: number): Promise<Module> {
    const response = await api.get<Module>(`/api/academics/modules/${id}/`)
    return response.data
  },

  async createModule(data: CreateModuleData): Promise<Module> {
    const response = await api.post<Module>('/api/academics/modules/', data)
    return response.data
  },

  async updateModule(id: number, data: Partial<CreateModuleData>): Promise<Module> {
    const response = await api.patch<Module>(`/api/academics/modules/${id}/`, data)
    return response.data
  },

  async deleteModule(id: number): Promise<void> {
    await api.delete(`/api/academics/modules/${id}/`)
  },

  // Departments
  async getDepartments(params?: { parent?: number }): Promise<Department[]> {
    const response = await api.get<PaginatedResponse<Department>>('/api/academics/departments/', { params })
    return response.data.results || response.data
  },

  async getDepartment(id: number): Promise<Department> {
    const response = await api.get<Department>(`/api/academics/departments/${id}/`)
    return response.data
  },

  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    const response = await api.post<Department>('/api/academics/departments/', data)
    return response.data
  },

  async updateDepartment(id: number, data: Partial<CreateDepartmentData>): Promise<Department> {
    const response = await api.patch<Department>(`/api/academics/departments/${id}/`, data)
    return response.data
  },

  async deleteDepartment(id: number): Promise<void> {
    await api.delete(`/api/academics/departments/${id}/`)
  },
}

