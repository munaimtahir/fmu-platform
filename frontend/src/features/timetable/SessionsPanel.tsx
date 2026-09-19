/**
 * Timetable sessions: list, create, edit and delete (task-gated, with
 * confirmation for delete).  Hosts the SessionForm dialog.
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { pageCount } from '@/lib/pagination'
import { sessionsService } from '@/services/sessions'
import type { Session } from '@/types'
import { SessionForm } from './SessionForm'

const PAGE_SIZE = 50
const SESSIONS_KEY = 'timetable-sessions'

function formatWhen(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : format(date, 'MMM dd, yyyy HH:mm')
}

export function SessionsPanel() {
  const queryClient = useQueryClient()
  const { can } = useCapabilities()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Session | null>(null)
  const [deleting, setDeleting] = useState<Session | null>(null)

  const canCreate = can('timetable.sessions.create')
  const canUpdate = can('timetable.sessions.update')
  const canDelete = can('timetable.sessions.delete')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [SESSIONS_KEY, page, debouncedSearch],
    queryFn: () => sessionsService.getAll({ page, search: debouncedSearch || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sessionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SESSIONS_KEY] })
      toast.success('Session deleted')
    },
  })

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const sessions = data?.results ?? []
  const pages = pageCount(data?.count ?? 0, PAGE_SIZE)

  return (
    <div data-testid="sessions-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Input
          aria-label="Search sessions"
          placeholder="Search by group or department..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-72"
        />
        {canCreate && (
          <Button data-testid="session-add-button" onClick={() => setFormOpen(true)}>
            Add Session
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={apiErrorMessage(error, 'Failed to load sessions')} onRetry={() => refetch()} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="🗓️"
          title="No sessions found"
          description={debouncedSearch ? 'Try adjusting your search' : 'No sessions have been scheduled yet'}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-ink-secondary border-b">
                <th className="py-2 pr-4">Period</th>
                <th className="py-2 pr-4">Group</th>
                <th className="py-2 pr-4">Faculty</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Starts</th>
                <th className="py-2 pr-4">Ends</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} data-testid={`session-row-${session.id}`} className="border-b">
                  <td className="py-2 pr-4">{session.academic_period_name ?? session.academic_period}</td>
                  <td className="py-2 pr-4">{session.group_name ?? session.group}</td>
                  <td className="py-2 pr-4">{session.faculty_name ?? session.faculty}</td>
                  <td className="py-2 pr-4">{session.department_name ?? session.department}</td>
                  <td className="py-2 pr-4">{formatWhen(session.starts_at)}</td>
                  <td className="py-2 pr-4">{formatWhen(session.ends_at)}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      {canUpdate && (
                        <Button
                          size="sm"
                          variant="ghost"
                          data-testid={`session-edit-${session.id}`}
                          onClick={() => {
                            setEditing(session)
                            setFormOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="danger"
                          data-testid={`session-delete-${session.id}`}
                          onClick={() => setDeleting(session)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-end gap-3 mt-4 text-sm">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {pages}
          </span>
          <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {formOpen && (
        <SessionForm
          session={editing}
          onClose={closeForm}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: [SESSIONS_KEY] })
            closeForm()
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete session"
          message={`Delete the ${deleting.group_name ?? 'group'} session starting ${formatWhen(deleting.starts_at)}? This cannot be undone.`}
          confirmLabel="Delete session"
          variant="danger"
          onConfirm={() => deleteMutation.mutateAsync(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
