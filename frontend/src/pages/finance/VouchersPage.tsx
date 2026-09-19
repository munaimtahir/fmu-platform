import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { parseApiError } from '@/lib/apiErrors'
import { formatDate, formatMoney } from '@/features/finance/financeFormat'
import { useTermOptions } from '@/features/finance/FinanceLookups'
import { FilterBar, PagedTable } from '@/features/finance/PagedTable'
import { financeService } from '@/services/finance'
import type { Voucher } from '@/types'

export const VOUCHERS_QUERY_KEY = ['finance', 'vouchers'] as const

export const VOUCHER_STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'generated', label: 'Generated' },
  { value: 'partially_paid', label: 'Partially paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const VouchersPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { options: termOptions } = useTermOptions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [term, setTerm] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const [cancelling, setCancelling] = useState<Voucher | null>(null)

  const filters = {
    page,
    search: debouncedSearch || undefined,
    status: status || undefined,
    term: term ? Number(term) : undefined,
  }
  const query = useQuery({
    queryKey: [...VOUCHERS_QUERY_KEY, filters],
    queryFn: () => financeService.listVouchersPage(filters),
  })

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const columns: ColumnDef<Voucher>[] = [
    { accessorKey: 'voucher_no', header: 'Voucher no.' },
    {
      id: 'student',
      header: 'Student',
      cell: ({ row }) => `${row.original.student_reg_no ?? ''} ${row.original.student_name ?? ''}`.trim() || `#${row.original.student}`,
    },
    { accessorKey: 'term_name', header: 'Term' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge domain="finance" status={row.original.status} />,
    },
    { accessorKey: 'total_amount', header: 'Amount', cell: ({ row }) => formatMoney(row.original.total_amount) },
    { accessorKey: 'due_date', header: 'Due date', cell: ({ row }) => formatDate(row.original.due_date) },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const voucher = row.original
        return (
          <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/finance/vouchers/${voucher.id}`)}>
              View
            </Button>
            {voucher.status !== 'cancelled' && voucher.status !== 'paid' && (
              <Can tasks={['finance.vouchers.cancel']}>
                <Button size="sm" variant="danger" onClick={() => setCancelling(voucher)}>
                  Cancel
                </Button>
              </Can>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <PageShell title="Vouchers" description="Fee vouchers issued to students.">
      <Card>
        <div className="p-4">
          <FilterBar>
            <Input
              id="vouchers-search"
              label="Search"
              placeholder="Voucher no., reg. no. or name"
              value={search}
              onChange={(e) => resetPage(setSearch)(e.target.value)}
            />
            <Select
              id="vouchers-status"
              label="Status"
              options={VOUCHER_STATUS_OPTIONS}
              value={status}
              onChange={resetPage(setStatus)}
              searchable={false}
            />
            <Select
              id="vouchers-term"
              label="Academic period"
              options={[{ value: '', label: 'All periods' }, ...termOptions]}
              value={term}
              onChange={resetPage(setTerm)}
            />
          </FilterBar>
        </div>
        <PagedTable
          data={query.data?.results ?? []}
          columns={columns}
          page={page}
          total={query.data?.count ?? 0}
          onPageChange={setPage}
          isLoading={query.isLoading}
          errorMessage={query.isError ? parseApiError(query.error).message : null}
          onRetry={() => query.refetch()}
          onRowClick={(voucher) => navigate(`/finance/vouchers/${voucher.id}`)}
        />
      </Card>

      {cancelling && (
        <ConfirmDialog
          title="Cancel voucher"
          message={
            <>
              Cancel voucher <strong>{cancelling.voucher_no}</strong>? The amount is credited back to the student's
              ledger. This cannot be undone.
            </>
          }
          confirmLabel="Cancel voucher"
          variant="danger"
          requireReason
          onConfirm={async (reason) => {
            try {
              await financeService.cancelVoucher(cancelling.id, reason ?? '')
            } catch (err) {
              if (parseApiError(err).code === 'ALREADY_CANCELLED') {
                queryClient.invalidateQueries({ queryKey: VOUCHERS_QUERY_KEY })
              }
              throw err
            }
            queryClient.invalidateQueries({ queryKey: VOUCHERS_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['finance', 'ledger'] })
            toast.success('Voucher cancelled')
          }}
          onClose={() => setCancelling(null)}
        />
      )}
    </PageShell>
  )
}
