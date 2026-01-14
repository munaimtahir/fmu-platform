/**
 * Impersonation API service
 */
import api from './axios'
import { User } from '@/features/auth/types'

export interface ImpersonationStartRequest {
  target_user_id: number | string
}

export interface ImpersonationStartResponse {
  access: string
  expires_in: number
  target: User
}

export interface ImpersonationStopRequest {
  target_user_id?: number | string
}

export interface ImpersonationStopResponse {
  success: boolean
}

export interface UserSearchResult {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

/**
 * Start impersonating a target user
 */
export async function startImpersonation(
  targetUserId: number | string
): Promise<ImpersonationStartResponse> {
  const response = await api.post<ImpersonationStartResponse>(
    '/api/admin/impersonation/start/',
    { target_user_id: targetUserId }
  )
  return response.data
}

/**
 * Stop impersonation
 */
export async function stopImpersonation(
  targetUserId?: number | string
): Promise<ImpersonationStopResponse> {
  const response = await api.post<ImpersonationStopResponse>(
    '/api/admin/impersonation/stop/',
    targetUserId ? { target_user_id: targetUserId } : {}
  )
  return response.data
}

/**
 * Search users for impersonation
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const response = await api.get<UserSearchResult[]>('/api/admin/users/search/', {
    params: { query },
  })
  return response.data
}
