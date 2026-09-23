import { useQuery } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications'
import { useAuthStore } from '@/features/auth/authStore'

/**
 * Shared polling query for the current user's unread notification count.
 * Used by both the Topbar and Sidebar so they share a single cache entry
 * and a single 30s polling interval instead of each running its own.
 */
export function useUnreadNotificationsCount() {
  const user = useAuthStore((state) => state.user)
  const { data } = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: () => notificationsService.getUnreadCount(),
    enabled: !!user && !user.password_change_required,
    refetchInterval: 30000, // Poll every 30 seconds
  })

  return user && !user.password_change_required ? data?.count || 0 : 0
}
