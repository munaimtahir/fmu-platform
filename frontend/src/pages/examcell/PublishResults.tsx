import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import type { PaginationState } from '@/components/ui/DataTable/types'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { pageCount as computePageCount } from '@/lib/pagination'
import { resultsService, type ResultHeader, type ResultStatus } from '@/services/results'
import { ResultWorkflowActions } from '@/pages/results/ResultWorkflowActions'

const PAGE_SIZE = 50

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'FROZEN', label: 'Frozen' },
]

export function PublishResults() {
  const [status, setStatus] = useState<ResultStatus | ''>('DRAFT')
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const debouncedSearch = useDebouncedValue(search)

  const query = useQuery({
    queryKey: ['publish-results', status, debouncedSearch, pagination.pageIndex],
    queryFn: () =>
      resultsService.getAll({
        page: pagination.pageIndex + 1,
        status: status || undefined,
        search: debouncedSearch || undefined,
      }),
  })

  const results = query.data?.results ?? []
  const totalCount = query.data?.count ?? 0

  const columns = useMemo<ColumnDef<ResultHeader>[]>(
    () => [
      { accessorKey: 'student_reg_no', header: 'Reg No' },
      { accessorKey: 'student_name', header: 'Student Name' },
      { accessorKey: 'exam_title', header: 'Exam' },
      {
        id: 'total',
        header: 'Total',
        accessorFn: (result) => result.total_obtained,
        cell: ({ row }) => `${row.original.total_obtained} / ${row.original.total_max}`,
      },
      { accessorKey: 'final_outcome', header: 'Outcome' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge domain="results" status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-3">
            <Link className="text-sm text-primary-600 hover:underline" to={`/results/${row.original.id}`}>
              Details
            </Link>
            <ResultWorkflowActions result={row.original} />
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-h1">Publish Results</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Verify, publish or freeze result headers. Each step asks for confirmation and is recorded.
        </p>
      </div>

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Status"
            value={status}
            searchable={false}
            onChange={(value) => {
              setStatus(value as ResultStatus | '')
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
            options={STATUS_OPTIONS}
          />
          <Input
            label="Search"
            placeholder="Student, reg no, or exam"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => query.refetch()} disabled={query.isFetching}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h2 className="text-h3 mb-4">Result Headers ({totalCount})</h2>
          {query.error ? (
            <ErrorState message={apiErrorMessage(query.error, 'Failed to load results')} onRetry={() => query.refetch()} />
          ) : (
            <DataTable
              data={results}
              columns={columns}
              isLoading={query.isLoading}
              enableFiltering={false}
              manualPagination
              pageCount={computePageCount(totalCount, PAGE_SIZE)}
              totalCount={totalCount}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          )}
        </div>
      </Card>
    </div>
  )
}
