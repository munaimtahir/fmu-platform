import React, { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { notificationsService, type NotificationInbox } from '@/services/notifications'

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', filter],
    queryFn: ({ pageParam }) =>
      notificationsService.getMyNotifications(filter === 'unread' ? { unread: true } : undefined, pageParam),
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    initialPageParam: undefined,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
    onError: () => {
      toast.error('Failed to mark notification as read')
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      toast.success('All notifications marked as read')
    },
    onError: () => {
      toast.error('Failed to mark all as read')
    },
  })

  const getPriorityBadgeVariant = (priority: NotificationInbox['notification']['priority']):
    'default' | 'success' | 'warning' | 'danger' => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return 'danger'
      case 'LOW':
        return 'default'
      default:
        return 'warning'
    }
  }

  const items = data?.pages.flatMap((page) => page.results) ?? []
  const hasUnread = items.some((item) => !item.read_at)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Announcements / Notifications</h1>
          {hasUnread && (
            <Button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              variant="secondary"
            >
              Mark All as Read
            </Button>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unread
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">We could not load notifications right now.</p>
          </Card>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className={`p-4 ${!item.read_at ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.notification.title}
                      </h3>
                      {!item.read_at && <Badge variant="default">New</Badge>}
                      <Badge variant={getPriorityBadgeVariant(item.notification.priority)}>
                        {item.notification.priority}
                      </Badge>
                      <Badge variant="success">{item.notification.category}</Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{item.notification.body}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!item.read_at && (
                    <Button
                      onClick={() => markReadMutation.mutate(item.id)}
                      disabled={markReadMutation.isPending}
                      variant="secondary"
                      size="sm"
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              </Card>
            ))}
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="secondary">
                  {isFetchingNextPage ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-500">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
