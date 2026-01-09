import api from './axios'
import { PaginatedResponse } from '@/types'

export interface AppSetting {
  id: number
  key: string
  value_json: boolean | number | string
  value_type: 'boolean' | 'integer' | 'string' | 'json'
  description: string
  updated_by?: number
  updated_by_username?: string
  created_at: string
  updated_at: string
}

export interface AllowedKey {
  key: string
  type: string
  description: string
  current_value: boolean | number | string | null
}

export interface UpdateSettingData {
  value_json: boolean | number | string
  value_type: 'boolean' | 'integer' | 'string' | 'json'
}

export const settingsApi = {
  /**
   * Get all settings
   */
  async getAll(): Promise<PaginatedResponse<AppSetting>> {
    const response = await api.get<PaginatedResponse<AppSetting>>('/api/admin/settings/')
    return response.data
  },

  /**
   * Get a single setting by key
   */
  async getByKey(key: string): Promise<AppSetting> {
    const response = await api.get<AppSetting>(`/api/admin/settings/${key}/`)
    return response.data
  },

  /**
   * Create or update a setting
   */
  async update(key: string, data: UpdateSettingData): Promise<AppSetting> {
    const response = await api.patch<AppSetting>(`/api/admin/settings/${key}/`, data)
    return response.data
  },

  /**
   * Create a new setting
   */
  async create(data: { key: string } & UpdateSettingData): Promise<AppSetting> {
    const response = await api.post<AppSetting>('/api/admin/settings/', data)
    return response.data
  },

  /**
   * Get list of allowed keys with metadata
   */
  async getAllowedKeys(): Promise<AllowedKey[]> {
    const response = await api.get<AllowedKey[]>('/api/admin/settings/allowed_keys/')
    return response.data
  },
}
