import api from './axios'
import { PaginatedResponse } from '@/types'

export interface AdminUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  role: string
  groups_list: string[]
  last_login?: string
  date_joined: string
}

export interface CreateUserData {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  is_active: boolean
  role: string
}

export interface UpdateUserData {
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  is_active?: boolean
  role?: string
}

export interface ResetPasswordResponse {
  success: boolean
  temporary_password: string
  message: string
}

export const usersApi = {
  /**
   * Get all users with optional filters
   */
  async getAll(params?: {
    role?: string
    is_active?: boolean
    q?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<AdminUser>> {
    const response = await api.get<PaginatedResponse<AdminUser>>('/api/admin/users/', { params })
    return response.data
  },

  /**
   * Get a single user by ID
   */
  async getById(id: number): Promise<AdminUser> {
    const response = await api.get<AdminUser>(`/api/admin/users/${id}/`)
    return response.data
  },

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<AdminUser> {
    const response = await api.post<AdminUser>('/api/admin/users/', data)
    return response.data
  },

  /**
   * Update a user
   */
  async update(id: number, data: UpdateUserData): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`/api/admin/users/${id}/`, data)
    return response.data
  },

  /**
   * Delete (deactivate) a user
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/api/admin/users/${id}/`)
  },

  /**
   * Reset user password
   */
  async resetPassword(id: number): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse>(`/api/admin/users/${id}/reset-password/`)
    return response.data
  },

  /**
   * Activate a user
   */
  async activate(id: number): Promise<AdminUser> {
    const response = await api.post<AdminUser>(`/api/admin/users/${id}/activate/`)
    return response.data
  },

  /**
   * Deactivate a user
   */
  async deactivate(id: number): Promise<AdminUser> {
    const response = await api.post<AdminUser>(`/api/admin/users/${id}/deactivate/`)
    return response.data
  },
}
