import api from '@/api/axios'

export interface Notification {
  id: number
  title: string
  body: string
  category: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  publish_at: string | null
  expires_at: string | null
  created_at: string
}

export interface NotificationInbox {
  id: number
  notification: Notification
  delivered_at: string
  read_at: string | null
  is_deleted: boolean
}

export interface UnreadCountResponse {
  count: number
}

export const notificationsService = {
  async getMyNotifications(params?: { unread?: boolean }): Promise<{ count: number; results: NotificationInbox[] }> {
    const response = await api.get<{ count: number; results: NotificationInbox[] }>('/api/my/notifications/', {
      params,
    })
    return response.data
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await api.get<UnreadCountResponse>('/api/my/notifications/unread-count/')
    return response.data
  },

  async markRead(inboxId: number): Promise<NotificationInbox> {
    const response = await api.post<NotificationInbox>(`/api/my/notifications/${inboxId}/read/`)
    return response.data
  },

  async markAllAsRead(): Promise<{ marked_read: number }> {
    const response = await api.post<{ marked_read: number }>('/api/my/notifications/read-all/')
    return response.data
  },
}
