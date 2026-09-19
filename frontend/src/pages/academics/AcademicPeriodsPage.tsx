import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { PageShell } from '@/components/shared/PageShell'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { apiErrorMessage } from '@/lib/apiErrors'
import { academicsService, type AcademicPeriod } from '@/services/academics'
import { academicPeriodsKey } from '@/utils/queryKeys'
import { AcademicPeriodFormModal } from '@/features/academics/AcademicPeriodFormModal'
import toast from 'react-hot-toast'

type PendingAction = { kind: 'open' | 'close' | 'delete'; period: AcademicPeriod }

export const AcademicPeriodsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { can } = useCapabilities()
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const canCreate = can('academics.terms.create')
  const canUpdate = can('academics.terms.update')
  const canDelete = can('academics.terms.delete')
  const canManage = can('academics.terms.manage')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: academicPeriodsKey(search),
    queryFn: () => academicsService.getAcademicPeriods(),
  })

  const runAction = useMutation({
    mutationFn: async ({ kind, period }: PendingAction) => {
      if (kind === 'open') return academicsService.openAcademicPeriod(period.id)
      if (kind === 'close') return academicsService.closeAcademicPeriod(period.id)
      return academicsService.deleteAcademicPeriod(period.id)
    },
    onSuccess: (_result, { kind }) => {
      queryClient.invalidateQueries({ queryKey: academicPeriodsKey() })
      const done = { open: 'opened', close: 'closed', delete: 'deleted' }[kind]
      toast.success(`Academic period ${done}`)
    },
  })

  const columns = useMemo<ColumnDef<AcademicPeriod>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Period Name',
      },
      {
        accessorKey: 'period_type',
        header: 'Type',
      },
      {
        accessorKey: 'start_date',
        header: 'Start Date',
        cell: ({ row }) => row.original.start_date ? new Date(row.original.start_date).toLocaleDateString() : '-',
      },
      {
        accessorKey: 'end_date',
        header: 'End Date',
        cell: ({ row }) => row.original.end_date ? new Date(row.original.end_date).toLocaleDateString() : '-',
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.status ? (
            <Badge variant={row.original.status === 'OPEN' ? 'success' : 'default'}>{row.original.status}</Badge>
          ) : (
            <span className="text-ink-muted">-</span>
          ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const period = row.original
          return (
            <div className="flex flex-wrap gap-2">
              {canManage && period.status !== 'OPEN' && (
                <Button size="sm" variant="secondary" onClick={() => setPending({ kind: 'open', period })}>
                  Open
                </Button>
              )}
              {canManage && period.status !== 'CLOSED' && (
                <Button size="sm" variant="secondary" onClick={() => setPending({ kind: 'close', period })}>
                  Close
                </Button>
              )}
              {canUpdate && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingPeriod(period)
                    setIsFormOpen(true)
                  }}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button size="sm" variant="danger" onClick={() => setPending({ kind: 'delete', period })}>
                  Delete
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [canManage, canUpdate, canDelete]
  )

  if (isLoading) {
    return (
      <PageShell title="Academic Periods">
        <LoadingState />
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell title="Academic Periods">
        <ErrorState message={apiErrorMessage(error, 'Failed to load academic periods')} onRetry={() => refetch()} />
      </PageShell>
    )
  }

  const periods = Array.isArray(data) ? data : []

  const dialogCopy = pending && {
    open: {
      title: 'Open academic period',
      confirmLabel: 'Open period',
      variant: 'primary' as const,
      message: `Open "${pending.period.name}" for enrollment and academic writes?`,
    },
    close: {
      title: 'Close academic period',
      confirmLabel: 'Close period',
      variant: 'danger' as const,
      message: `Close "${pending.period.name}"? Enrollment and academic writes will be blocked until it is reopened.`,
    },
    delete: {
      title: 'Delete academic period',
      confirmLabel: 'Delete',
      variant: 'danger' as const,
      message: `Delete "${pending.period.name}"? This cannot be undone.`,
    },
  }[pending.kind]

  return (
    <>
      <PageShell
        title="Academic Periods"
        description="Manage academic periods and terms"
        actions={
          <div className="flex gap-2">
            <Input
              aria-label="Search periods"
              placeholder="Search periods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            {canCreate && (
              <Button onClick={() => {
                setEditingPeriod(null)
                setIsFormOpen(true)
              }}>
                Create Period
              </Button>
            )}
          </div>
        }
      >
        {periods.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No academic periods found"
            description={search ? 'Try adjusting your search' : 'No academic periods have been created yet'}
            action={
              canCreate
                ? {
                    label: 'Create First Period',
                    onClick: () => {
                      setEditingPeriod(null)
                      setIsFormOpen(true)
                    },
                  }
                : undefined
            }
          />
        ) : (
          <DataTable
            data={periods.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))}
            columns={columns}
          />
        )}
      </PageShell>
      {isFormOpen && (
        <AcademicPeriodFormModal
          period={editingPeriod}
          onClose={() => {
            setIsFormOpen(false)
            setEditingPeriod(null)
          }}
        />
      )}
      {pending && dialogCopy && (
        <ConfirmDialog
          title={dialogCopy.title}
          message={dialogCopy.message}
          confirmLabel={dialogCopy.confirmLabel}
          variant={dialogCopy.variant}
          onConfirm={() => runAction.mutateAsync(pending)}
          onClose={() => setPending(null)}
        />
      )}
    </>
  )
}
