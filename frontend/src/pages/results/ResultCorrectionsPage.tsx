import React, { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge, type BadgeProps } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { apiErrorMessage } from '@/lib/apiErrors'
import {
  CORRECTION_STATUS_LABELS,
  resultCorrectionsService,
  type CorrectionStatus,
  type ResultCorrection,
} from '@/services/resultCorrections'
import type { ResultHeader } from '@/services/results'
import { CorrectionRequestModal } from './CorrectionRequestModal'
import { CorrectionResultPicker } from './CorrectionResultPicker'
import { CorrectionReviewModal } from './CorrectionReviewModal'

const STATUS_VARIANT: Record<CorrectionStatus, NonNullable<BadgeProps['variant']>> = {
  PENDING: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  APPLIED: 'success',
}

const STATUS_FILTER = [
  { value: '', label: 'All statuses' },
  ...(Object.keys(CORRECTION_STATUS_LABELS) as CorrectionStatus[]).map((s) => ({
    value: s,
    label: CORRECTION_STATUS_LABELS[s],
  })),
]

export const ResultCorrectionsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<CorrectionStatus | ''>('')
  const [viewing, setViewing] = useState<ResultCorrection | null>(null)
  const [applying, setApplying] = useState<ResultCorrection | null>(null)
  const [picking, setPicking] = useState(false)
  const [requestFor, setRequestFor] = useState<ResultHeader | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['result-corrections'],
    queryFn: () => resultCorrectionsService.listAll(),
  })

  const rows = useMemo(
    () => (data ?? []).filter((c) => !status || c.status === status),
    [data, status]
  )

  const columns = useMemo<ColumnDef<ResultCorrection>[]>(
    () => [
      { accessorKey: 'id', header: '#' },
      {
        id: 'result',
        header: 'Result',
        cell: ({ row }) => (
          <Link className="text-primary-600 hover:underline" to={`/results/${row.original.result_header}`}>
            Result {row.original.result_header}
          </Link>
        ),
      },
      { accessorKey: 'requested_by_username', header: 'Requested by' },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => <span className="line-clamp-2 max-w-xs">{row.original.reason}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>{CORRECTION_STATUS_LABELS[row.original.status]}</Badge>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Requested',
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const correction = row.original
          return (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setViewing(correction)}>
                {correction.status === 'PENDING' ? 'Review' : 'Details'}
              </Button>
              {correction.status === 'APPROVED' && (
                <Can tasks={['results.result_corrections.review']}>
                  <Button size="sm" onClick={() => setApplying(correction)}>
                    Apply
                  </Button>
                </Can>
              )}
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <PageShell
      title="Result Corrections"
      description="Request, review and apply corrections to published results"
      actions={
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Status"
            searchable={false}
            options={STATUS_FILTER}
            value={status}
            onChange={(value) => setStatus(value as CorrectionStatus | '')}
          />
          <Can tasks={['results.result_corrections.create']} roles={['Student']}>
            <Button onClick={() => setPicking(true)}>New request</Button>
          </Can>
        </div>
      }
    >
      {error ? (
        <ErrorState message={apiErrorMessage(error, 'Failed to load correction requests')} onRetry={() => refetch()} />
      ) : !isLoading && rows.length === 0 ? (
        <EmptyState
          icon="🛠️"
          title="No correction requests"
          description={status ? 'No requests match this status' : 'Nothing has been submitted yet'}
        />
      ) : (
        <DataTable data={rows} columns={columns} isLoading={isLoading} enableFiltering={false} />
      )}

      {picking && (
        <CorrectionResultPicker
          onClose={() => setPicking(false)}
          onPick={(result) => {
            setPicking(false)
            setRequestFor(result)
          }}
        />
      )}
      {requestFor && <CorrectionRequestModal result={requestFor} onClose={() => setRequestFor(null)} />}
      {viewing && <CorrectionReviewModal correction={viewing} onClose={() => setViewing(null)} />}

      {applying && (
        <ConfirmDialog
          title="Apply correction"
          variant="danger"
          confirmLabel="Apply correction"
          message={
            <>
              Apply correction #{applying.id} to result {applying.result_header}? This changes a published result and
              recomputes its outcome.
            </>
          }
          onConfirm={async () => {
            await resultCorrectionsService.apply(applying.id)
            queryClient.invalidateQueries({ queryKey: ['result-corrections'] })
            for (const key of ['results', 'result', 'publish-results']) {
              queryClient.invalidateQueries({ queryKey: [key] })
            }
            toast.success('Correction applied')
          }}
          onClose={() => setApplying(null)}
        />
      )}
    </PageShell>
  )
}
