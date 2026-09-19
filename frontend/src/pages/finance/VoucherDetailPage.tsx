import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { apiErrorMessage, parseApiError } from '@/lib/apiErrors'
import { formatDate, formatMoney } from '@/features/finance/financeFormat'
import { financeService, isPaymentReversed } from '@/services/finance'

const detailKey = (id: number) => ['finance', 'vouchers', 'detail', id] as const

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
    <dd className="text-ink-primary">{children}</dd>
  </div>
)

export const VoucherDetailPage: React.FC = () => {
  const { id } = useParams()
  const voucherId = Number(id)
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<'reconcile' | 'cancel' | null>(null)
  const [downloading, setDownloading] = useState(false)

  const voucher = useQuery({
    queryKey: detailKey(voucherId),
    queryFn: () => financeService.getVoucher(voucherId),
    enabled: Number.isFinite(voucherId),
  })
  const data = voucher.data

  // The API has no voucher filter on payments or the ledger, so narrow by student/period (payments) and by
  // voucher number search (ledger) and keep only rows that belong to this voucher.
  const payments = useQuery({
    queryKey: ['finance', 'payments', 'for-voucher', voucherId],
    queryFn: () => financeService.listPaymentsPage({ student: data!.student, term: data!.term }),
    enabled: !!data,
  })
  const ledger = useQuery({
    queryKey: ['finance', 'ledger', 'for-voucher', voucherId],
    queryFn: () => financeService.listLedgerEntries({ student: data!.student, search: data!.voucher_no }),
    enabled: !!data,
  })
  const voucherPayments = (payments.data?.results ?? []).filter((p) => p.voucher === voucherId)
  const voucherLedger = (ledger.data?.results ?? []).filter((e) => e.voucher === voucherId)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: detailKey(voucherId) })
    queryClient.invalidateQueries({ queryKey: ['finance', 'vouchers'] })
    queryClient.invalidateQueries({ queryKey: ['finance', 'ledger'] })
  }

  const downloadPdf = async () => {
    if (!data) return
    setDownloading(true)
    try {
      await financeService.downloadVoucherPdf(data.id, data.voucher_no)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not download the voucher PDF.'))
    } finally {
      setDownloading(false)
    }
  }

  if (!Number.isFinite(voucherId)) {
    return <ErrorState title="Voucher not found" message="That voucher link is not valid." />
  }
  if (voucher.isLoading) return <LoadingState message="Loading voucher..." />
  if (voucher.isError || !data) {
    const info = parseApiError(voucher.error, 'Could not load this voucher.')
    return (
      <ErrorState
        title={info.status === 404 ? 'Voucher not found' : 'Could not load voucher'}
        message={info.message}
        onRetry={info.status === 404 ? undefined : () => voucher.refetch()}
      />
    )
  }

  const cancelled = data.status === 'cancelled'

  return (
    <PageShell
      title={`Voucher ${data.voucher_no}`}
      description={`${data.student_reg_no ?? ''} ${data.student_name ?? ''}`.trim()}
      breadcrumbs={[{ label: 'Vouchers', path: '/finance/vouchers/list' }, { label: data.voucher_no }]}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={downloadPdf} isLoading={downloading}>
            Download PDF
          </Button>
          {!cancelled && (
            <Can tasks={['finance.vouchers.reconcile']}>
              <Button variant="secondary" onClick={() => setDialog('reconcile')}>
                Reconcile
              </Button>
            </Can>
          )}
          {!cancelled && (
            <Can tasks={['finance.vouchers.cancel']}>
              <Button variant="danger" onClick={() => setDialog('cancel')}>
                Cancel voucher
              </Button>
            </Can>
          )}
        </div>
      }
    >
      {cancelled && <Alert variant="warning">This voucher is cancelled. Its ledger debit has been reversed.</Alert>}

      <Card>
        <dl className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
          <Field label="Status">
            <StatusBadge domain="finance" status={data.status} />
          </Field>
          <Field label="Academic period">{data.term_name}</Field>
          <Field label="Issued">{formatDate(data.issue_date)}</Field>
          <Field label="Due">{formatDate(data.due_date)}</Field>
          <Field label="Total">{formatMoney(data.total_amount)}</Field>
          <Field label="Outstanding">{formatMoney(data.balance?.outstanding)}</Field>
          <Field label="Debited">{formatMoney(data.balance?.total_debits)}</Field>
          <Field label="Credited">{formatMoney(data.balance?.total_credits)}</Field>
        </dl>
        {data.notes && <p className="border-t border-surface-border p-4 text-sm text-ink-secondary whitespace-pre-line">{data.notes}</p>}
      </Card>

      <Card>
        <h2 className="p-4 text-h4">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-border text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ink-muted">
                <th className="px-4 py-2">Fee type</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2">{item.fee_type_code ?? item.fee_type}</td>
                  <td className="px-4 py-2">{item.description || '—'}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="p-4 text-h4">Payments</h2>
        {payments.isError ? (
          <p className="px-4 pb-4 text-sm text-danger">{parseApiError(payments.error).message}</p>
        ) : voucherPayments.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-ink-muted">{payments.isLoading ? 'Loading payments...' : 'No payments recorded against this voucher.'}</p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {voucherPayments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <span>
                  {payment.receipt_no} - {formatMoney(payment.amount)} ({payment.method}) on {formatDate(payment.received_at)}
                </span>
                {isPaymentReversed(payment) ? (
                  <StatusBadge domain="finance" status="cancelled" label="Reversed" />
                ) : (
                  <StatusBadge domain="finance" status={payment.status} />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between p-4">
          <h2 className="text-h4">Ledger entries</h2>
          <Can tasks={['finance.ledger_entries.view']}>
            <Link className="text-sm text-primary-600 hover:underline" to="/finance/ledger">
              Open ledger
            </Link>
          </Can>
        </div>
        {ledger.isError ? (
          <p className="px-4 pb-4 text-sm text-danger">{parseApiError(ledger.error).message}</p>
        ) : voucherLedger.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-ink-muted">{ledger.isLoading ? 'Loading ledger...' : 'No ledger entries for this voucher.'}</p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {voucherLedger.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <span>
                  {entry.entry_type === 'debit' ? 'Debit' : 'Credit'} {formatMoney(entry.amount)} - {entry.description}
                </span>
                {entry.voided_at ? <StatusBadge domain="finance" status="Void" /> : <span className="text-ink-muted">{formatDate(entry.created_at)}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {dialog === 'reconcile' && (
        <ConfirmDialog
          title="Reconcile voucher"
          message="Recalculate this voucher's status from its ledger entries?"
          confirmLabel="Reconcile"
          onConfirm={async () => {
            await financeService.reconcileVoucher(data.id)
            refresh()
            toast.success('Voucher reconciled')
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'cancel' && (
        <ConfirmDialog
          title="Cancel voucher"
          message={
            <>
              Cancel voucher <strong>{data.voucher_no}</strong>? The debit is reversed in the student's ledger. This cannot be
              undone. A voucher with verified payments can only be cancelled after those payments are reversed.
            </>
          }
          confirmLabel="Cancel voucher"
          variant="danger"
          requireReason
          onConfirm={async (reason) => {
            try {
              await financeService.cancelVoucher(data.id, reason ?? '')
            } catch (err) {
              // Someone else already cancelled it: show the current state behind the error message.
              if (parseApiError(err).code === 'ALREADY_CANCELLED') refresh()
              throw err
            }
            refresh()
            toast.success('Voucher cancelled')
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </PageShell>
  )
}
