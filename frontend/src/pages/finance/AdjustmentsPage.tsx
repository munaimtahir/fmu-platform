import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select, type SelectOption } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TextArea } from '@/components/ui/TextArea'
import { parseApiError, type ApiErrorInfo } from '@/lib/apiErrors'
import { formatDate, formatMoney, isValidAmount } from '@/features/finance/financeFormat'
import { StudentPicker, useTermOptions } from '@/features/finance/FinanceLookups'
import { FormError } from '@/features/finance/FormBits'
import { FilterBar, PagedTable } from '@/features/finance/PagedTable'
import { financeService, type Adjustment, type AdjustmentKind } from '@/services/finance'

const QUERY_KEY = ['finance', 'adjustments'] as const

const KIND_OPTIONS: SelectOption[] = [
  { value: 'waiver', label: 'Waiver' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'fine_reversal', label: 'Fine reversal' },
]

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const AdjustmentForm: React.FC<{ adjustment: Adjustment | null; onClose: () => void }> = ({ adjustment, onClose }) => {
  const queryClient = useQueryClient()
  const { options: termOptions } = useTermOptions()
  const [student, setStudent] = useState(adjustment ? String(adjustment.student) : '')
  const [term, setTerm] = useState(adjustment ? String(adjustment.term) : '')
  const [kind, setKind] = useState<string>(adjustment?.kind ?? 'waiver')
  const [amount, setAmount] = useState(adjustment ? String(adjustment.amount) : '')
  const [reason, setReason] = useState(adjustment?.reason ?? '')
  const [error, setError] = useState<ApiErrorInfo | null>(null)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        student: Number(student),
        term: Number(term),
        kind: kind as AdjustmentKind,
        amount: amount.trim(),
        reason: reason.trim(),
      }
      return adjustment ? financeService.updateAdjustment(adjustment.id, payload) : financeService.createAdjustment(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(adjustment ? 'Adjustment updated' : 'Adjustment requested')
      onClose()
    },
    onError: (err) => setError(parseApiError(err)),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    const problems: Record<string, string> = {}
    if (!student) problems.student = 'Choose a student.'
    if (!term) problems.term = 'Choose an academic period.'
    if (!isValidAmount(amount)) problems.amount = 'Enter an amount greater than zero (up to 2 decimals).'
    if (!reason.trim()) problems.reason = 'A reason is required.'
    setClientErrors(problems)
    if (Object.keys(problems).length === 0) save.mutate()
  }

  const fieldError = (name: string) => clientErrors[name] ?? error?.fieldErrors[name]

  return (
    <Modal title={adjustment ? 'Edit adjustment' : 'New adjustment'} onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <StudentPicker
          id="adjustment-student"
          value={student}
          onChange={setStudent}
          required
          error={fieldError('student')}
          selectedLabel={adjustment ? `${adjustment.student_reg_no ?? ''} - ${adjustment.student_name ?? ''}` : undefined}
        />
        <Select id="adjustment-term" label="Academic period" required options={termOptions} value={term} onChange={setTerm} error={fieldError('term')} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select id="adjustment-kind" label="Kind" required options={KIND_OPTIONS} value={kind} onChange={setKind} searchable={false} error={fieldError('kind')} />
          <Input
            id="adjustment-amount"
            label="Amount (PKR)"
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={fieldError('amount')}
          />
        </div>
        <TextArea id="adjustment-reason" label="Reason" required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} error={fieldError('reason')} />
        <FormError error={error} hasFieldErrors />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={save.isPending}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

type PendingAction = { kind: 'approve' | 'reject' | 'delete'; adjustment: Adjustment }

export const AdjustmentsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { options: termOptions } = useTermOptions()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [kind, setKind] = useState('')
  const [term, setTerm] = useState('')
  const [editing, setEditing] = useState<Adjustment | 'new' | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const filters = { page, status: status || undefined, kind: kind || undefined, term: term ? Number(term) : undefined }
  const query = useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => financeService.listAdjustments(filters),
  })

  const reset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const runAction = async (reason?: string) => {
    if (!pending) return
    const { kind: action, adjustment } = pending
    if (action === 'delete') await financeService.deleteAdjustment(adjustment.id)
    else await financeService.approveAdjustment(adjustment.id, action === 'approve', reason)
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['finance', 'ledger'] })
    toast.success(action === 'approve' ? 'Adjustment approved' : action === 'reject' ? 'Adjustment rejected' : 'Adjustment deleted')
  }

  const columns: ColumnDef<Adjustment>[] = [
    { accessorKey: 'created_at', header: 'Requested', cell: ({ row }) => formatDate(row.original.created_at) },
    {
      id: 'student',
      header: 'Student',
      cell: ({ row }) => `${row.original.student_reg_no ?? ''} ${row.original.student_name ?? ''}`.trim() || `#${row.original.student}`,
    },
    { accessorKey: 'term_name', header: 'Period' },
    { accessorKey: 'kind', header: 'Kind' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatMoney(row.original.amount) },
    { accessorKey: 'reason', header: 'Reason' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge domain="finance" status={row.original.status} /> },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const adjustment = row.original
        if (adjustment.status !== 'pending') return null
        return (
          <div className="flex flex-wrap gap-2">
            <Can tasks={['finance.adjustments.approve']}>
              <Button size="sm" onClick={() => setPending({ kind: 'approve', adjustment })}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setPending({ kind: 'reject', adjustment })}>
                Reject
              </Button>
            </Can>
            <Can tasks={['finance.adjustments.update']}>
              <Button size="sm" variant="ghost" onClick={() => setEditing(adjustment)}>
                Edit
              </Button>
            </Can>
            <Can tasks={['finance.adjustments.delete']}>
              <Button size="sm" variant="danger" onClick={() => setPending({ kind: 'delete', adjustment })}>
                Delete
              </Button>
            </Can>
          </div>
        )
      },
    },
  ]

  return (
    <PageShell
      title="Adjustments"
      description="Waivers, scholarships and other ledger adjustments that need approval."
      actions={
        <Can tasks={['finance.adjustments.create']}>
          <Button onClick={() => setEditing('new')}>New adjustment</Button>
        </Can>
      }
    >
      <Card>
        <div className="p-4">
          <FilterBar>
            <Select id="adjustments-status" label="Status" options={STATUS_OPTIONS} value={status} onChange={reset(setStatus)} searchable={false} />
            <Select id="adjustments-kind" label="Kind" options={[{ value: '', label: 'All kinds' }, ...KIND_OPTIONS]} value={kind} onChange={reset(setKind)} searchable={false} />
            <Select id="adjustments-term" label="Academic period" options={[{ value: '', label: 'All periods' }, ...termOptions]} value={term} onChange={reset(setTerm)} />
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
        />
      </Card>

      {editing && <AdjustmentForm adjustment={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {pending && (
        <ConfirmDialog
          title={pending.kind === 'approve' ? 'Approve adjustment' : pending.kind === 'reject' ? 'Reject adjustment' : 'Delete adjustment'}
          message={
            pending.kind === 'approve' ? (
              <>
                Approve the {pending.adjustment.kind} of {formatMoney(pending.adjustment.amount)} for{' '}
                {pending.adjustment.student_name}? This posts to the student's ledger and cannot be undone.
              </>
            ) : pending.kind === 'reject' ? (
              <>Reject this {pending.adjustment.kind}? Nothing is posted to the ledger.</>
            ) : (
              <>Delete this pending {pending.adjustment.kind} request?</>
            )
          }
          confirmLabel={pending.kind === 'approve' ? 'Approve' : pending.kind === 'reject' ? 'Reject' : 'Delete'}
          variant={pending.kind === 'approve' ? 'primary' : 'danger'}
          requireReason={pending.kind === 'reject'}
          onConfirm={runAction}
          onClose={() => setPending(null)}
        />
      )}
    </PageShell>
  )
}
