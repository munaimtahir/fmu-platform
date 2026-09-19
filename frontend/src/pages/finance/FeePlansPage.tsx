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
import { parseApiError, type ApiErrorInfo } from '@/lib/apiErrors'
import { formatMoney, isValidAmount } from '@/features/finance/financeFormat'
import { useFeeTypeOptions, useProgramOptions, useTermOptions } from '@/features/finance/FinanceLookups'
import { CheckboxField, FormError } from '@/features/finance/FormBits'
import { FilterBar, PagedTable } from '@/features/finance/PagedTable'
import { financeService, type FeePlanInput } from '@/services/finance'
import type { FeePlan } from '@/types'

const QUERY_KEY = ['finance', 'fee-plans'] as const

const FREQUENCY_OPTIONS: SelectOption[] = [
  { value: 'per_term', label: 'Per term' },
  { value: 'one_time', label: 'One-time' },
]

const ACTIVE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Active and inactive' },
  { value: 'true', label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
]

const FeePlanForm: React.FC<{ plan: FeePlan | null; onClose: () => void }> = ({ plan, onClose }) => {
  const queryClient = useQueryClient()
  const programs = useProgramOptions()
  const terms = useTermOptions()
  const feeTypes = useFeeTypeOptions()
  const [program, setProgram] = useState(plan ? String(plan.program) : '')
  const [term, setTerm] = useState(plan ? String(plan.term) : '')
  const [feeType, setFeeType] = useState(plan ? String(plan.fee_type) : '')
  const [amount, setAmount] = useState(plan ? String(plan.amount) : '')
  const [frequency, setFrequency] = useState<string>(plan?.frequency ?? 'per_term')
  const [effectiveFrom, setEffectiveFrom] = useState(plan?.effective_from ?? '')
  const [isMandatory, setIsMandatory] = useState(plan?.is_mandatory ?? true)
  const [isActive, setIsActive] = useState(plan?.is_active ?? true)
  const [error, setError] = useState<ApiErrorInfo | null>(null)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: () => {
      const payload: FeePlanInput = {
        program: Number(program),
        term: Number(term),
        fee_type: Number(feeType),
        amount: amount.trim(),
        is_mandatory: isMandatory,
        frequency: frequency as FeePlanInput['frequency'],
        effective_from: effectiveFrom || null,
        is_active: isActive,
      }
      return plan ? financeService.updateFeePlan(plan.id, payload) : financeService.createFeePlan(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(plan ? 'Fee plan updated' : 'Fee plan created')
      onClose()
    },
    onError: (err) => setError(parseApiError(err)),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    const problems: Record<string, string> = {}
    if (!program) problems.program = 'Choose a program.'
    if (!term) problems.term = 'Choose an academic period.'
    if (!feeType) problems.fee_type = 'Choose a fee type.'
    if (!isValidAmount(amount)) problems.amount = 'Enter an amount greater than zero (up to 2 decimals).'
    setClientErrors(problems)
    if (Object.keys(problems).length === 0) save.mutate()
  }

  const fieldError = (name: string) => clientErrors[name] ?? error?.fieldErrors[name]

  return (
    <Modal title={plan ? 'Edit fee plan' : 'New fee plan'} onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select id="feeplan-program" label="Program" required options={programs.options} value={program} onChange={setProgram} error={fieldError('program')} />
          <Select id="feeplan-term" label="Academic period" required options={terms.options} value={term} onChange={setTerm} error={fieldError('term')} />
          <Select id="feeplan-fee-type" label="Fee type" required options={feeTypes.options} value={feeType} onChange={setFeeType} error={fieldError('fee_type')} />
          <Input
            id="feeplan-amount"
            label="Amount (PKR)"
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={fieldError('amount')}
          />
          <Select id="feeplan-frequency" label="Frequency" options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} searchable={false} error={fieldError('frequency')} />
          <Input id="feeplan-effective" label="Effective from" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} error={fieldError('effective_from')} />
        </div>
        <div className="flex flex-wrap gap-6">
          <CheckboxField id="feeplan-mandatory" label="Mandatory" checked={isMandatory} onChange={setIsMandatory} />
          <CheckboxField id="feeplan-active" label="Active" checked={isActive} onChange={setIsActive} />
        </div>
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

type PendingAction = { kind: 'toggle' | 'delete'; plan: FeePlan }

export const FeePlansPage: React.FC = () => {
  const queryClient = useQueryClient()
  const programs = useProgramOptions()
  const terms = useTermOptions()
  const [page, setPage] = useState(1)
  const [program, setProgram] = useState('')
  const [term, setTerm] = useState('')
  const [active, setActive] = useState('')
  const [editing, setEditing] = useState<FeePlan | 'new' | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const filters = {
    page,
    program: program ? Number(program) : undefined,
    term: term ? Number(term) : undefined,
    is_active: active === '' ? undefined : active === 'true',
  }
  const query = useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => financeService.listFeePlans(filters),
  })

  const reset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const runAction = async () => {
    if (!pending) return
    const { kind, plan } = pending
    if (kind === 'delete') await financeService.deleteFeePlan(plan.id)
    else await financeService.updateFeePlan(plan.id, { is_active: !plan.is_active })
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    toast.success(kind === 'delete' ? 'Fee plan deleted' : plan.is_active ? 'Fee plan deactivated' : 'Fee plan activated')
  }

  const columns: ColumnDef<FeePlan>[] = [
    { id: 'program', header: 'Program', cell: ({ row }) => row.original.program_name ?? row.original.program },
    { id: 'term', header: 'Period', cell: ({ row }) => row.original.term_name ?? row.original.term },
    { id: 'fee_type', header: 'Fee type', cell: ({ row }) => row.original.fee_type_code ?? row.original.fee_type },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatMoney(row.original.amount) },
    { accessorKey: 'frequency', header: 'Frequency', cell: ({ row }) => (row.original.frequency === 'per_term' ? 'Per term' : 'One-time') },
    { accessorKey: 'is_mandatory', header: 'Mandatory', cell: ({ row }) => (row.original.is_mandatory ? 'Yes' : 'No') },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge domain="finance" status={row.original.is_active ? 'verified' : 'cancelled'} label={row.original.is_active ? 'Active' : 'Inactive'} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Can tasks={['finance.fee_plans.update']}>
            <Button size="sm" variant="secondary" onClick={() => setEditing(row.original)}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending({ kind: 'toggle', plan: row.original })}>
              {row.original.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </Can>
          <Can tasks={['finance.fee_plans.delete']}>
            <Button size="sm" variant="danger" onClick={() => setPending({ kind: 'delete', plan: row.original })}>
              Delete
            </Button>
          </Can>
        </div>
      ),
    },
  ]

  return (
    <PageShell
      title="Fee Plans"
      description="Per-program fee schedules used to generate vouchers."
      actions={
        <Can tasks={['finance.fee_plans.create']}>
          <Button onClick={() => setEditing('new')}>New fee plan</Button>
        </Can>
      }
    >
      <Card>
        <div className="p-4">
          <FilterBar>
            <Select id="feeplans-program" label="Program" options={[{ value: '', label: 'All programs' }, ...programs.options]} value={program} onChange={reset(setProgram)} />
            <Select id="feeplans-term" label="Academic period" options={[{ value: '', label: 'All periods' }, ...terms.options]} value={term} onChange={reset(setTerm)} />
            <Select id="feeplans-active" label="Status" options={ACTIVE_OPTIONS} value={active} onChange={reset(setActive)} searchable={false} />
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

      {editing && <FeePlanForm plan={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {pending && (
        <ConfirmDialog
          title={pending.kind === 'delete' ? 'Delete fee plan' : pending.plan.is_active ? 'Deactivate fee plan' : 'Activate fee plan'}
          message={
            pending.kind === 'delete' ? (
              <>Delete this fee plan? Vouchers already generated from it are not affected.</>
            ) : pending.plan.is_active ? (
              <>Deactivate this fee plan? It will no longer be used when generating vouchers.</>
            ) : (
              <>Activate this fee plan? Only one active plan is allowed per program, period and fee type.</>
            )
          }
          confirmLabel={pending.kind === 'delete' ? 'Delete' : pending.plan.is_active ? 'Deactivate' : 'Activate'}
          variant={pending.kind === 'delete' || pending.plan.is_active ? 'danger' : 'primary'}
          onConfirm={runAction}
          onClose={() => setPending(null)}
        />
      )}
    </PageShell>
  )
}
