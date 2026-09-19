import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { parseApiError } from '@/lib/apiErrors'
import { formatDate, formatMoney } from '@/features/finance/financeFormat'
import { StudentPicker, useTermOptions } from '@/features/finance/FinanceLookups'
import { CheckboxField } from '@/features/finance/FormBits'
import { FilterBar, PagedTable } from '@/features/finance/PagedTable'
import { financeService, type LedgerEntry } from '@/services/finance'

const ENTRY_TYPE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Debits and credits' },
  { value: 'debit', label: 'Debits' },
  { value: 'credit', label: 'Credits' },
]

const REFERENCE_OPTIONS: SelectOption[] = [
  { value: '', label: 'All sources' },
  { value: 'voucher', label: 'Voucher' },
  { value: 'payment', label: 'Payment' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'waiver', label: 'Waiver' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'reversal', label: 'Reversal' },
]

export const LedgerPage: React.FC = () => {
  const { options: termOptions } = useTermOptions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [student, setStudent] = useState('')
  const [term, setTerm] = useState('')
  const [entryType, setEntryType] = useState('')
  const [reference, setReference] = useState('')
  const [hideVoided, setHideVoided] = useState(false)
  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const filters = {
    page,
    search: debouncedSearch || undefined,
    student: student ? Number(student) : undefined,
    term: term ? Number(term) : undefined,
    entry_type: entryType || undefined,
    reference_type: reference || undefined,
  }
  const query = useQuery({
    queryKey: ['finance', 'ledger', filters],
    queryFn: () => financeService.listLedgerEntries(filters),
  })

  const reset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  // The ledger API cannot filter on voided entries, so this only hides them on the page being viewed.
  const rows = (query.data?.results ?? []).filter((entry) => !(hideVoided && entry.voided_at))

  const columns: ColumnDef<LedgerEntry>[] = [
    { accessorKey: 'created_at', header: 'Date', cell: ({ row }) => formatDate(row.original.created_at) },
    {
      id: 'student',
      header: 'Student',
      cell: ({ row }) => `${row.original.student_reg_no ?? ''} ${row.original.student_name ?? ''}`.trim() || `#${row.original.student}`,
    },
    { accessorKey: 'term_name', header: 'Period' },
    {
      accessorKey: 'entry_type',
      header: 'Type',
      cell: ({ row }) => (row.original.entry_type === 'debit' ? 'Debit' : 'Credit'),
    },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatMoney(row.original.amount, row.original.currency) },
    { accessorKey: 'reference_type', header: 'Source' },
    { accessorKey: 'description', header: 'Description' },
    {
      id: 'state',
      header: 'State',
      cell: ({ row }) =>
        row.original.voided_at ? (
          <span title={row.original.void_reason || undefined}>
            <StatusBadge domain="finance" status="Void" />
          </span>
        ) : (
          <StatusBadge domain="finance" status="verified" label="Active" />
        ),
    },
  ]

  return (
    <PageShell title="Ledger" description="Every debit and credit posted to student accounts. Read only.">
      <Card>
        <div className="space-y-4 p-4">
          <FilterBar>
            <Input
              id="ledger-search"
              label="Search"
              placeholder="Reg. no., voucher no. or reference"
              value={search}
              onChange={(e) => reset(setSearch)(e.target.value)}
            />
            <Select
              id="ledger-term"
              label="Academic period"
              options={[{ value: '', label: 'All periods' }, ...termOptions]}
              value={term}
              onChange={reset(setTerm)}
            />
            <Select id="ledger-type" label="Entry type" options={ENTRY_TYPE_OPTIONS} value={entryType} onChange={reset(setEntryType)} searchable={false} />
            <Select id="ledger-reference" label="Source" options={REFERENCE_OPTIONS} value={reference} onChange={reset(setReference)} searchable={false} />
          </FilterBar>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StudentPicker id="ledger-student" label="Student" value={student} onChange={reset(setStudent)} />
            <div className="flex items-end">
              <CheckboxField id="ledger-hide-voided" label="Hide voided entries on this page" checked={hideVoided} onChange={setHideVoided} />
            </div>
          </div>
        </div>
        <PagedTable
          data={rows}
          columns={columns}
          page={page}
          total={query.data?.count ?? 0}
          onPageChange={setPage}
          isLoading={query.isLoading}
          errorMessage={query.isError ? parseApiError(query.error).message : null}
          onRetry={() => query.refetch()}
        />
      </Card>
    </PageShell>
  )
}
