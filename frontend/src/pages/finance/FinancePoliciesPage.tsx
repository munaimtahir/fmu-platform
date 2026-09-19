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
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TextArea } from '@/components/ui/TextArea'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { parseApiError, type ApiErrorInfo } from '@/lib/apiErrors'
import { formatMoney } from '@/features/finance/financeFormat'
import { useFeeTypeOptions } from '@/features/finance/FinanceLookups'
import { CheckboxField, FormError } from '@/features/finance/FormBits'
import { PagedTable } from '@/features/finance/PagedTable'
import { financeService, type FinancePolicy } from '@/services/finance'

const QUERY_KEY = ['finance', 'policies'] as const

/** Rule keys the gating logic reads (backend/sims_backend/finance/services.py). */
const KNOWN_RULE_KEYS = ['BLOCK_TRANSCRIPT_IF_DUES', 'BLOCK_RESULTS_IF_DUES', 'BLOCK_ENROLLMENT_IF_DUES']

const PolicyForm: React.FC<{ policy: FinancePolicy | null; onClose: () => void }> = ({ policy, onClose }) => {
  const queryClient = useQueryClient()
  const { options: feeTypeOptions } = useFeeTypeOptions()
  const [ruleKey, setRuleKey] = useState(policy?.rule_key ?? '')
  const [description, setDescription] = useState(policy?.description ?? '')
  const [threshold, setThreshold] = useState(policy ? String(policy.threshold_amount) : '0')
  const [feeType, setFeeType] = useState(policy?.fee_type ? String(policy.fee_type) : '')
  const [isActive, setIsActive] = useState(policy?.is_active ?? true)
  const [error, setError] = useState<ApiErrorInfo | null>(null)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        rule_key: ruleKey.trim().toUpperCase(),
        description: description.trim(),
        threshold_amount: threshold.trim(),
        fee_type: feeType ? Number(feeType) : null,
        is_active: isActive,
      }
      return policy ? financeService.updatePolicy(policy.id, payload) : financeService.createPolicy(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(policy ? 'Policy updated' : 'Policy created')
      onClose()
    },
    onError: (err) => setError(parseApiError(err)),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    const problems: Record<string, string> = {}
    if (!ruleKey.trim()) problems.rule_key = 'A rule key is required.'
    if (!/^\d+(\.\d{1,2})?$/.test(threshold.trim())) problems.threshold_amount = 'Enter zero or a positive amount (up to 2 decimals).'
    setClientErrors(problems)
    if (Object.keys(problems).length === 0) save.mutate()
  }

  const fieldError = (name: string) => clientErrors[name] ?? error?.fieldErrors[name]

  return (
    <Modal title={policy ? 'Edit policy' : 'New policy'} onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <Input
          id="policy-rule-key"
          label="Rule key"
          required
          value={ruleKey}
          onChange={(e) => setRuleKey(e.target.value.toUpperCase())}
          error={fieldError('rule_key')}
          helperText={`Recognised keys: ${KNOWN_RULE_KEYS.join(', ')}`}
        />
        <TextArea id="policy-description" label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} error={fieldError('description')} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            id="policy-threshold"
            label="Threshold amount (PKR)"
            inputMode="decimal"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            error={fieldError('threshold_amount')}
            helperText="Dues at or below this amount do not trigger the rule."
          />
          <Select
            id="policy-fee-type"
            label="Limit to fee type (optional)"
            options={[{ value: '', label: 'All fee types' }, ...feeTypeOptions]}
            value={feeType}
            onChange={setFeeType}
            error={fieldError('fee_type')}
          />
        </div>
        <CheckboxField id="policy-active" label="Active" checked={isActive} onChange={setIsActive} />
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

export const FinancePoliciesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const [editing, setEditing] = useState<FinancePolicy | 'new' | null>(null)
  const [deleting, setDeleting] = useState<FinancePolicy | null>(null)

  const query = useQuery({
    queryKey: [...QUERY_KEY, page, debouncedSearch],
    queryFn: () => financeService.listPolicies({ page, search: debouncedSearch || undefined }),
  })

  const columns: ColumnDef<FinancePolicy>[] = [
    { accessorKey: 'rule_key', header: 'Rule' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'threshold_amount', header: 'Threshold', cell: ({ row }) => formatMoney(row.original.threshold_amount) },
    { accessorKey: 'fee_type_code', header: 'Fee type', cell: ({ row }) => row.original.fee_type_code ?? 'All' },
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
        <div className="flex gap-2">
          <Can tasks={['finance.policies.update']}>
            <Button size="sm" variant="secondary" onClick={() => setEditing(row.original)}>
              Edit
            </Button>
          </Can>
          <Can tasks={['finance.policies.delete']}>
            <Button size="sm" variant="danger" onClick={() => setDeleting(row.original)}>
              Delete
            </Button>
          </Can>
        </div>
      ),
    },
  ]

  return (
    <PageShell
      title="Finance Policies"
      description="Rules that block transcripts, results or enrollment for students with outstanding dues."
      actions={
        <Can tasks={['finance.policies.create']}>
          <Button onClick={() => setEditing('new')}>New policy</Button>
        </Can>
      }
    >
      <Card>
        <div className="max-w-sm p-4">
          <Input
            id="policies-search"
            label="Search"
            placeholder="Rule key or description"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
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

      {editing && <PolicyForm policy={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete policy"
          message={
            <>
              Delete policy <strong>{deleting.rule_key}</strong>? Students will no longer be blocked by this rule.
            </>
          }
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await financeService.deletePolicy(deleting.id)
            queryClient.invalidateQueries({ queryKey: QUERY_KEY })
            toast.success('Policy deleted')
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </PageShell>
  )
}
