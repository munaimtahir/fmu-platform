import { useQuery } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications'

/**
 * Shared polling query for the current user's unread notification count.
 * Used by both the Topbar and Sidebar so they share a single cache entry
 * and a single 30s polling interval instead of each running its own.
 */
export function useUnreadNotificationsCount() {
  const { data } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 30000, // Poll every 30 seconds
  })

  return data?.count || 0
}
