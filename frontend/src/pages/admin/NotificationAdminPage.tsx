import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { pageCount } from '@/lib/pagination'
import {
  NOTIFICATION_STATUSES,
  audienceSummary,
  notificationsAdminService,
  type AdminNotification,
  type NotificationStatus,
} from '@/services/notificationsAdmin'
import { NotificationComposeModal } from './NotificationComposeModal'

const PAGE_SIZE = 50

const statusVariant = (status: NotificationStatus): 'default' | 'success' | 'warning' | 'danger' =>
  status === 'SENT' ? 'success' : status === 'FAILED' ? 'danger' : status === 'QUEUED' ? 'warning' : 'default'

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : '-')

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="text-sm text-ink-muted">{label}</dt>
    <dd className="text-ink-primary">{children}</dd>
  </div>
)

export const NotificationAdminPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<NotificationStatus | ''>('')
  const [category, setCategory] = useState('')
  const debouncedCategory = useDebouncedValue(category, 300)
  const [page, setPage] = useState(1)
  const [composing, setComposing] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [sending, setSending] = useState<AdminNotification | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications-admin', { page, status, category: debouncedCategory }],
    queryFn: () => notificationsAdminService.list({ page, status, category: debouncedCategory, ordering: '-created_at' }),
  })

  const rows = data?.results ?? []
  const detail = rows.find((row) => row.id === detailId) ?? null

  const detailQuery = useQuery({
    queryKey: ['notifications-admin', 'detail', detailId],
    queryFn: () => notificationsAdminService.get(detailId!),
    enabled: detailId !== null,
    initialData: detail ?? undefined,
  })

  const sendMutation = useMutation({
    mutationFn: (id: number) => notificationsAdminService.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-admin'] })
      toast.success('Notification queued for delivery')
    },
  })

  const shown = detailQuery.data ?? detail

  return (
    <PageShell
      title="Notification Administration"
      description="Compose announcements, target an audience, schedule publication and send."
      actions={
        <Can tasks={['notifications.admin.create']}>
          <Button onClick={() => setComposing(true)}>New notification</Button>
        </Can>
      }
    >
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="notif-status-filter" className="block text-sm font-medium text-ink-secondary mb-1">
              Status
            </label>
            <select
              id="notif-status-filter"
              className="w-full rounded-2xl border border-surface-border px-3 py-2 bg-white"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as NotificationStatus | '')
                setPage(1)
              }}
            >
              <option value="">All statuses</option>
              {NOTIFICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <Input
            id="notif-category-filter"
            label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            placeholder="Exact category, e.g. Exam"
          />
        </div>
      </Card>

      {isLoading && <LoadingState message="Loading notifications..." />}
      {isError && (
        <ErrorState title="Could not load notifications" message={apiErrorMessage(error)} onRetry={() => refetch()} />
      )}

      {data && rows.length === 0 && (
        <Card>
          <EmptyState icon="📣" title="No notifications" description="Nothing matches these filters yet." />
        </Card>
      )}

      {rows.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-surface-border">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Audience</th>
                  <th className="py-2 pr-4">Publish at</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-surface-border last:border-0">
                    <td className="py-2 pr-4 font-medium text-ink-primary">{row.title}</td>
                    <td className="py-2 pr-4">{row.category}</td>
                    <td className="py-2 pr-4">{row.priority}</td>
                    <td className="py-2 pr-4">
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="py-2 pr-4">{audienceSummary(row.audiences)}</td>
                    <td className="py-2 pr-4">{formatDate(row.publish_at)}</td>
                    <td className="py-2 pr-4">{formatDate(row.created_at)}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => setDetailId(row.id)} aria-label={`View ${row.title}`}>
                        View
                      </Button>
                      {row.status !== 'SENT' && (
                        <Can tasks={['notifications.admin.send']}>
                          <Button variant="secondary" size="sm" onClick={() => setSending(row)} aria-label={`Send ${row.title}`}>
                            Send
                          </Button>
                        </Can>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-ink-muted">{data?.count ?? 0} notifications</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-ink-secondary self-center">
                Page {page} of {pageCount(data?.count ?? 0, PAGE_SIZE)}
              </span>
              <Button variant="secondary" size="sm" disabled={!data?.next} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {composing && <NotificationComposeModal onClose={() => setComposing(false)} />}

      {shown && detailId !== null && (
        <Modal title={shown.title} onClose={() => setDetailId(null)} size="lg">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailRow label="Status">
              <Badge variant={statusVariant(shown.status)}>{shown.status}</Badge>
            </DetailRow>
            <DetailRow label="Priority">{shown.priority}</DetailRow>
            <DetailRow label="Category">{shown.category}</DetailRow>
            <DetailRow label="Created by">{shown.created_by_name}</DetailRow>
            <DetailRow label="Publish at">{formatDate(shown.publish_at)}</DetailRow>
            <DetailRow label="Expires at">{formatDate(shown.expires_at)}</DetailRow>
            <DetailRow label="Email">{shown.send_email ? 'Also sent by email' : 'In-app only'}</DetailRow>
            <DetailRow label="Audience">{audienceSummary(shown.audiences)}</DetailRow>
          </dl>
          <div className="mt-4">
            <p className="text-sm text-ink-muted mb-1">Message</p>
            <p className="whitespace-pre-wrap text-ink-primary">{shown.body}</p>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={() => setDetailId(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}

      {sending && (
        <ConfirmDialog
          title="Send notification?"
          message={
            <>
              This queues <strong>{sending.title}</strong> for delivery to {audienceSummary(sending.audiences)}. It cannot be
              recalled once sent.
            </>
          }
          confirmLabel="Send"
          onClose={() => setSending(null)}
          onConfirm={() => sendMutation.mutateAsync(sending.id)}
        />
      )}
    </PageShell>
  )
}
