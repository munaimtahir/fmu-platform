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
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { parseApiError, type ApiErrorInfo } from '@/lib/apiErrors'
import { CheckboxField, FormError } from '@/features/finance/FormBits'
import { PagedTable } from '@/features/finance/PagedTable'
import { financeService, type FeeTypeInput } from '@/services/finance'
import type { FeeType } from '@/types'

const QUERY_KEY = ['finance', 'fee-types'] as const

const emptyForm: FeeTypeInput = { code: '', name: '', is_active: true }

const FeeTypeForm: React.FC<{ feeType: FeeType | null; onClose: () => void }> = ({ feeType, onClose }) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FeeTypeInput>(
    feeType ? { code: feeType.code, name: feeType.name, is_active: feeType.is_active } : emptyForm
  )
  const [error, setError] = useState<ApiErrorInfo | null>(null)

  const save = useMutation({
    mutationFn: () =>
      feeType ? financeService.updateFeeType(feeType.id, form) : financeService.createFeeType(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['finance', 'lookup', 'fee-types'] })
      toast.success(feeType ? 'Fee type updated' : 'Fee type created')
      onClose()
    },
    onError: (err) => setError(parseApiError(err)),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!form.code.trim() || !form.name.trim()) {
      setError({ message: 'Code and name are required.', fieldErrors: {}, isNetworkError: false })
      return
    }
    save.mutate()
  }

  return (
    <Modal title={feeType ? 'Edit fee type' : 'New fee type'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Input
          id="fee-type-code"
          label="Code"
          required
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          error={error?.fieldErrors.code}
        />
        <Input
          id="fee-type-name"
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={error?.fieldErrors.name}
        />
        <CheckboxField
          id="fee-type-active"
          label="Active"
          checked={form.is_active}
          onChange={(is_active) => setForm({ ...form, is_active })}
        />
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

export const FeeTypesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const [editing, setEditing] = useState<FeeType | 'new' | null>(null)
  const [deleting, setDeleting] = useState<FeeType | null>(null)

  const query = useQuery({
    queryKey: [...QUERY_KEY, page, debouncedSearch],
    queryFn: () => financeService.listFeeTypes({ page, search: debouncedSearch || undefined }),
  })

  const remove = useMutation({
    mutationFn: (id: number) => financeService.deleteFeeType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['finance', 'lookup', 'fee-types'] })
      toast.success('Fee type deleted')
    },
  })

  const columns: ColumnDef<FeeType>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          domain="finance"
          status={row.original.is_active ? 'verified' : 'cancelled'}
          label={row.original.is_active ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Can tasks={['finance.fee_types.update']}>
            <Button size="sm" variant="secondary" onClick={() => setEditing(row.original)}>
              Edit
            </Button>
          </Can>
          <Can tasks={['finance.fee_types.delete']}>
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
      title="Fee Types"
      description="Categories of fees that fee plans and vouchers are built from."
      actions={
        <Can tasks={['finance.fee_types.create']}>
          <Button onClick={() => setEditing('new')}>New fee type</Button>
        </Can>
      }
    >
      <Card>
        <div className="p-4 max-w-sm">
          <Input
            id="fee-types-search"
            label="Search"
            placeholder="Code or name"
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

      {editing && (
        <FeeTypeForm feeType={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete fee type"
          message={
            <>
              Delete <strong>{deleting.code}</strong>? Fee types that are used by fee plans or vouchers cannot be
              deleted; deactivate them instead.
            </>
          }
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => remove.mutateAsync(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </PageShell>
  )
}
