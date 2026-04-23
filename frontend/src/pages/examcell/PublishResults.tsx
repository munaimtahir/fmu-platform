import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { resultsService, type ResultHeader } from '@/services/results'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'FROZEN', label: 'Frozen' },
]

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: unknown } }).response?.data === 'object'
  ) {
    const data = (error as { response: { data: { error?: { message?: string } | string } } }).response.data
    if (typeof data.error === 'string') return data.error
    if (data.error?.message) return data.error.message
  }
  return fallback
}

export function PublishResults() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ResultHeader['status'] | ''>('DRAFT')
  const [search, setSearch] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['publish-results', status, search],
    queryFn: () =>
      resultsService.getAll({
        status: status || undefined,
        search: search || undefined,
      }),
  })

  const workflowMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'verify' | 'publish' | 'freeze' }) => {
      if (action === 'verify') return resultsService.verify(id)
      if (action === 'publish') return resultsService.publish(id)
      return resultsService.freeze(id)
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['publish-results'] })
      setError(null)
      setSuccess(`Result ${result.student_reg_no || result.id} ${variables.action}ed successfully.`)
    },
    onError: (err, variables) => {
      setSuccess(null)
      setError(getErrorMessage(err, `Failed to ${variables.action} result`))
    },
  })

  const results = query.data?.results || []

  const counts = useMemo(
    () => ({
      draft: results.filter((result) => result.status === 'DRAFT').length,
      verified: results.filter((result) => result.status === 'VERIFIED').length,
      published: results.filter((result) => result.status === 'PUBLISHED').length,
      frozen: results.filter((result) => result.status === 'FROZEN').length,
    }),
    [results]
  )

  const runAction = (id: number, action: 'verify' | 'publish' | 'freeze') => {
    const labels = {
      verify: 'verify this result',
      publish: 'publish this result',
      freeze: 'freeze this result',
    }
    if (window.confirm(`Are you sure you want to ${labels[action]}?`)) {
      workflowMutation.mutate({ id, action })
    }
  }

  const columns = [
    { key: 'student_reg_no', label: 'Reg No' },
    { key: 'student_name', label: 'Student Name' },
    { key: 'exam_title', label: 'Exam' },
    {
      key: 'total',
      label: 'Total',
      render: (result: ResultHeader) => `${result.total_obtained} / ${result.total_max}`,
    },
    { key: 'final_outcome', label: 'Outcome' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (result: ResultHeader) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={workflowMutation.isPending || !['DRAFT', 'VERIFIED'].includes(result.status)}
            onClick={() => runAction(result.id, 'publish')}
          >
            Publish
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={workflowMutation.isPending || result.status !== 'PUBLISHED'}
            onClick={() => runAction(result.id, 'freeze')}
          >
            Freeze
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Publish Results</h1>
        <p className="text-sm text-gray-600 mt-1">
          Publish or freeze individual result headers using the canonical result workflow.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as ResultHeader['status'] | '')}
            options={STATUS_OPTIONS}
          />
          <Input
            label="Search"
            placeholder="Student, reg no, or exam"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => query.refetch()} disabled={query.isFetching}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><div className="p-4"><div className="text-sm text-gray-600">Draft</div><div className="text-3xl font-bold text-yellow-600">{counts.draft}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-600">Verified</div><div className="text-3xl font-bold text-sky-600">{counts.verified}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-600">Published</div><div className="text-3xl font-bold text-green-600">{counts.published}</div></div></Card>
        <Card><div className="p-4"><div className="text-sm text-gray-600">Frozen</div><div className="text-3xl font-bold text-blue-600">{counts.frozen}</div></div></Card>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : results.length === 0 ? (
        <Card>
          <div className="p-4 text-center text-gray-600">No results match the current filters.</div>
        </Card>
      ) : (
        <Card>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Result Headers</h2>
            <SimpleTable data={results} columns={columns} keyField="id" />
          </div>
        </Card>
      )}
    </div>
  )
}
