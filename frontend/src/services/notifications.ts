import api from '@/api/axios'

export interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  read_at: string | null
  link: string
  created_at: string
}

export interface UnreadCountResponse {
  count: number
}

export const notificationsService = {
  async getAll(params?: { is_read?: boolean }): Promise<{ count: number; results: Notification[] }> {
    const response = await api.get<{ count: number; results: Notification[] }>('/api/notifications/', { params })
    return response.data
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await api.get<UnreadCountResponse>('/api/notifications/unread-count/')
    return response.data
  },

  async markAsRead(id: number): Promise<Notification> {
    const response = await api.post<Notification>(`/api/notifications/${id}/mark-read/`)
    return response.data
  },

  async markAllAsRead(): Promise<{ marked_read: number }> {
    const response = await api.post<{ marked_read: number }>('/api/notifications/mark-all-read/')
    return response.data
  },
}
