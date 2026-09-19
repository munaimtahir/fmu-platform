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
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage, parseApiError, type ApiErrorInfo } from '@/lib/apiErrors'
import { formatDate, formatMoney, isValidAmount } from '@/features/finance/financeFormat'
import { StudentPicker, useTermOptions } from '@/features/finance/FinanceLookups'
import { FormError } from '@/features/finance/FormBits'
import { FilterBar, PagedTable } from '@/features/finance/PagedTable'
import { financeService, isPaymentReversed, type PaymentRecord } from '@/services/finance'

const QUERY_KEY = ['finance', 'payments'] as const

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'received', label: 'Received' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
]

const METHOD_OPTIONS: SelectOption[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'online', label: 'Online' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'waiver', label: 'Waiver' },
]

const RecordPaymentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient()
  const { options: termOptions } = useTermOptions()
  const [student, setStudent] = useState('')
  const [term, setTerm] = useState('')
  const [voucher, setVoucher] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [referenceNo, setReferenceNo] = useState('')
  const [error, setError] = useState<ApiErrorInfo | null>(null)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  const vouchers = useQuery({
    queryKey: ['finance', 'lookup', 'student-vouchers', student, term],
    queryFn: () => financeService.listVouchersPage({ student: Number(student), term: Number(term) }),
    enabled: !!student && !!term,
  })
  const voucherOptions: SelectOption[] = [
    { value: '', label: 'No voucher (open credit)' },
    ...(vouchers.data?.results ?? [])
      .filter((v) => v.status !== 'cancelled' && v.status !== 'paid')
      .map((v) => ({ value: String(v.id), label: `${v.voucher_no} - ${formatMoney(v.total_amount)}` })),
  ]

  const record = useMutation({
    mutationFn: () =>
      financeService.recordPayment({
        student: Number(student),
        term: Number(term),
        amount: amount.trim(),
        method,
        voucher: voucher ? Number(voucher) : undefined,
        reference_no: referenceNo.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Payment recorded')
      onClose()
    },
    onError: (err) => {
      const info = parseApiError(err)
      // The backend currently answers 500 (not 400) when the term is locked or the reference number repeats.
      if (info.status && info.status >= 500) {
        info.message =
          'The payment could not be recorded. Check that the academic period is not locked and the reference number has not been used before.'
      }
      setError(info)
    },
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    const problems: Record<string, string> = {}
    if (!student) problems.student = 'Choose a student.'
    if (!term) problems.term = 'Choose an academic period.'
    if (!isValidAmount(amount)) problems.amount = 'Enter an amount greater than zero (up to 2 decimals).'
    setClientErrors(problems)
    if (Object.keys(problems).length === 0) record.mutate()
  }

  const fieldError = (name: string) => clientErrors[name] ?? error?.fieldErrors[name]

  return (
    <Modal title="Record payment" onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <StudentPicker id="payment-student" value={student} onChange={setStudent} required error={fieldError('student')} />
        <Select
          id="payment-term"
          label="Academic period"
          required
          options={termOptions}
          value={term}
          onChange={setTerm}
          error={fieldError('term')}
        />
        <Select
          id="payment-voucher"
          label="Voucher (optional)"
          options={voucherOptions}
          value={voucher}
          onChange={setVoucher}
          disabled={!student || !term}
          searchable={false}
          error={fieldError('voucher')}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            id="payment-amount"
            label="Amount (PKR)"
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={fieldError('amount')}
          />
          <Select
            id="payment-method"
            label="Method"
            required
            options={METHOD_OPTIONS}
            value={method}
            onChange={setMethod}
            searchable={false}
            error={fieldError('method')}
          />
        </div>
        <Input
          id="payment-reference"
          label="Reference no. (bank slip / transaction id)"
          value={referenceNo}
          onChange={(e) => setReferenceNo(e.target.value)}
          error={fieldError('reference_no')}
        />
        <FormError error={error} hasFieldErrors />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={record.isPending}>
            Record payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}

type PendingAction = { kind: 'verify' | 'reject' | 'reverse'; payment: PaymentRecord }

export const PaymentsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const [recording, setRecording] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const filters = { page, search: debouncedSearch || undefined, status: status || undefined, method: method || undefined }
  const query = useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => financeService.listPaymentsPage(filters),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['finance', 'vouchers'] })
    queryClient.invalidateQueries({ queryKey: ['finance', 'ledger'] })
  }

  const downloadReceipt = async (payment: PaymentRecord) => {
    try {
      await financeService.downloadPaymentReceipt(payment.id, payment.receipt_no)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not download the receipt.'))
    }
  }

  const runAction = async (reason?: string) => {
    if (!pending) return
    const { kind, payment } = pending
    if (kind === 'verify') await financeService.verifyPayment(payment.id)
    else if (kind === 'reject') await financeService.rejectPayment(payment.id, reason ?? '')
    else await financeService.reversePayment(payment.id, reason ?? '')
    invalidate()
    toast.success(kind === 'verify' ? 'Payment verified' : kind === 'reject' ? 'Payment rejected' : 'Payment reversed')
  }

  const columns: ColumnDef<PaymentRecord>[] = [
    { accessorKey: 'receipt_no', header: 'Receipt no.' },
    {
      id: 'student',
      header: 'Student',
      cell: ({ row }) => `${row.original.student_reg_no ?? ''} ${row.original.student_name ?? ''}`.trim() || `#${row.original.student}`,
    },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatMoney(row.original.amount) },
    { accessorKey: 'method', header: 'Method' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        isPaymentReversed(row.original) ? (
          <StatusBadge domain="finance" status="cancelled" label="Reversed" />
        ) : (
          <StatusBadge domain="finance" status={row.original.status} />
        ),
    },
    { accessorKey: 'received_at', header: 'Date', cell: ({ row }) => formatDate(row.original.received_at) },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const payment = row.original
        const reversed = isPaymentReversed(payment)
        return (
          <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
            {payment.status === 'received' && (
              <Can tasks={['finance.payments.verify']}>
                <Button size="sm" onClick={() => setPending({ kind: 'verify', payment })}>
                  Verify
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setPending({ kind: 'reject', payment })}>
                  Reject
                </Button>
              </Can>
            )}
            {payment.status === 'verified' && !reversed && (
              <Can tasks={['finance.payments.reverse']}>
                <Button size="sm" variant="danger" onClick={() => setPending({ kind: 'reverse', payment })}>
                  Reverse
                </Button>
              </Can>
            )}
            <Can tasks={['finance.payments.view']}>
              <Button size="sm" variant="ghost" onClick={() => downloadReceipt(payment)}>
                Receipt PDF
              </Button>
            </Can>
          </div>
        )
      },
    },
  ]

  return (
    <PageShell
      title="Payments"
      description="Record, verify and reverse payments."
      actions={
        <Can tasks={['finance.payments.create']}>
          <Button onClick={() => setRecording(true)}>Record payment</Button>
        </Can>
      }
    >
      <Card>
        <div className="p-4">
          <FilterBar>
            <Input
              id="payments-search"
              label="Search"
              placeholder="Receipt no. or reg. no."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
            <Select
              id="payments-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => {
                setStatus(v)
                setPage(1)
              }}
              searchable={false}
            />
            <Select
              id="payments-method"
              label="Method"
              options={[{ value: '', label: 'All methods' }, ...METHOD_OPTIONS]}
              value={method}
              onChange={(v) => {
                setMethod(v)
                setPage(1)
              }}
              searchable={false}
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
        />
      </Card>

      {recording && <RecordPaymentModal onClose={() => setRecording(false)} />}
      {pending && (
        <ConfirmDialog
          title={
            pending.kind === 'verify' ? 'Verify payment' : pending.kind === 'reject' ? 'Reject payment' : 'Reverse payment'
          }
          message={
            pending.kind === 'verify' ? (
              <>
                Verify receipt <strong>{pending.payment.receipt_no}</strong> for {formatMoney(pending.payment.amount)}? This
                credits the student's ledger.
              </>
            ) : pending.kind === 'reject' ? (
              <>
                Reject receipt <strong>{pending.payment.receipt_no}</strong>? No ledger credit will be posted.
              </>
            ) : (
              <>
                Reverse verified receipt <strong>{pending.payment.receipt_no}</strong> for{' '}
                {formatMoney(pending.payment.amount)}? A compensating ledger entry is posted and cannot be undone.
              </>
            )
          }
          confirmLabel={pending.kind === 'verify' ? 'Verify' : pending.kind === 'reject' ? 'Reject' : 'Reverse payment'}
          variant={pending.kind === 'verify' ? 'primary' : 'danger'}
          requireReason={pending.kind !== 'verify'}
          onConfirm={runAction}
          onClose={() => setPending(null)}
        />
      )}
    </PageShell>
  )
}
