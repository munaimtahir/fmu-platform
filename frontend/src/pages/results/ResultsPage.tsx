import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { useNavigate } from 'react-router-dom'
import { PageShell } from '@/components/shared/PageShell'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import type { PaginationState } from '@/components/ui/DataTable/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { pageCount as computePageCount } from '@/lib/pagination'
import { examsService } from '@/services/exams'
import { resultsService, type ResultHeader, type ResultStatus } from '@/services/results'

const PAGE_SIZE = 50

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'FROZEN', label: 'Frozen' },
]

const OUTCOME_VARIANT = { PASS: 'success', FAIL: 'danger', PENDING: 'warning' } as const

export function summarise(results: ResultHeader[]) {
  return {
    total: results.length,
    pass: results.filter((r) => r.final_outcome === 'PASS').length,
    fail: results.filter((r) => r.final_outcome === 'FAIL').length,
    pending: results.filter((r) => r.final_outcome === 'PENDING').length,
  }
}

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate()
  const { can } = useCapabilities()
  const isStaffView = can('results.result_headers.view')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ResultStatus | ''>('')
  const [examId, setExamId] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const debouncedSearch = useDebouncedValue(search)

  const exams = useQuery({
    queryKey: ['exams', 'result-filter'],
    queryFn: () => examsService.getAll(),
    enabled: isStaffView,
  })

  // A student sees only their own published or frozen results.
  const mine = useQuery({
    queryKey: ['results', 'mine'],
    queryFn: () => resultsService.getMine(),
    enabled: !isStaffView,
  })

  // With an exam chosen, load every result for it (unpaginated); otherwise page through all results.
  const byExam = useQuery({
    queryKey: ['results', 'exam', examId],
    queryFn: () => resultsService.getByExam(Number(examId)),
    enabled: isStaffView && examId !== '',
  })

  const paged = useQuery({
    queryKey: ['results', 'list', debouncedSearch, status, pagination.pageIndex],
    queryFn: () =>
      resultsService.getAll({
        page: pagination.pageIndex + 1,
        search: debouncedSearch || undefined,
        status: status || undefined,
      }),
    enabled: isStaffView && examId === '',
  })

  const examResults = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()
    return (byExam.data ?? []).filter(
      (r) =>
        (!status || r.status === status) &&
        (!term || `${r.student_reg_no ?? ''} ${r.student_name ?? ''}`.toLowerCase().includes(term))
    )
  }, [byExam.data, debouncedSearch, status])

  const active = !isStaffView ? mine : examId !== '' ? byExam : paged
  const rows: ResultHeader[] = !isStaffView ? (mine.data ?? []) : examId !== '' ? examResults : (paged.data?.results ?? [])
  const totalCount = paged.data?.count ?? 0
  const serverPaged = isStaffView && examId === ''

  const columns = useMemo<ColumnDef<ResultHeader>[]>(
    () => [
      ...(isStaffView
        ? ([
            { accessorKey: 'student_reg_no', header: 'Registration No' },
            { accessorKey: 'student_name', header: 'Student Name' },
          ] as ColumnDef<ResultHeader>[])
        : []),
      { accessorKey: 'exam_title', header: 'Exam' },
      {
        accessorKey: 'total_obtained',
        header: 'Total Score',
        cell: ({ row }) => `${row.original.total_obtained} / ${row.original.total_max}`,
      },
      {
        accessorKey: 'final_outcome',
        header: 'Outcome',
        cell: ({ row }) => (
          <Badge variant={OUTCOME_VARIANT[row.original.final_outcome] ?? 'default'}>{row.original.final_outcome}</Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge domain="results" status={row.original.status} />,
      },
    ],
    [isStaffView]
  )

  const summary = examId !== '' ? summarise(examResults) : null
  const examOptions = [
    { value: '', label: 'All exams' },
    ...(exams.data?.results ?? []).map((exam) => ({ value: String(exam.id), label: exam.title })),
  ]

  return (
    <PageShell
      title={isStaffView ? 'Results' : 'My Results'}
      description={isStaffView ? 'View and manage student results' : 'Your published examination results'}
    >
      <div className="space-y-4">
        {isStaffView && (
          <Card>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                aria-label="Search results"
                label="Search"
                placeholder="Registration number or name"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                }}
              />
              <Select
                label="Status"
                searchable={false}
                options={STATUS_OPTIONS}
                value={status}
                onChange={(value) => {
                  setStatus(value as ResultStatus | '')
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                }}
              />
              <Select label="Exam" options={examOptions} value={examId} onChange={setExamId} />
            </div>
          </Card>
        )}

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="exam-summary">
            <Card><div className="p-4"><div className="text-sm text-ink-secondary">Results</div><div className="text-h2">{summary.total}</div></div></Card>
            <Card><div className="p-4"><div className="text-sm text-ink-secondary">Pass</div><div className="text-h2 text-success">{summary.pass}</div></div></Card>
            <Card><div className="p-4"><div className="text-sm text-ink-secondary">Fail</div><div className="text-h2 text-danger">{summary.fail}</div></div></Card>
            <Card><div className="p-4"><div className="text-sm text-ink-secondary">Pending</div><div className="text-h2 text-warning">{summary.pending}</div></div></Card>
          </div>
        )}

        {active.error ? (
          <ErrorState message={apiErrorMessage(active.error, 'Failed to load results')} onRetry={() => active.refetch()} />
        ) : !active.isLoading && rows.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No results found"
            description={
              isStaffView
                ? search || status || examId
                  ? 'Try adjusting your filters'
                  : 'No results have been recorded yet'
                : 'No results have been published for you yet'
            }
          />
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            isLoading={active.isLoading}
            enableFiltering={false}
            onRowClick={(row) => navigate(`/results/${row.id}`)}
            {...(serverPaged
              ? {
                  manualPagination: true,
                  pageCount: computePageCount(totalCount, PAGE_SIZE),
                  totalCount,
                  pagination,
                  onPaginationChange: setPagination,
                }
              : {})}
          />
        )}
      </div>
    </PageShell>
  )
}
