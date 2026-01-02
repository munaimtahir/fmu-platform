import { useState, useEffect } from 'react'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { listImportJobs } from '@/api/studentImport'
import type { ImportJob } from '@/types/studentImport'

interface ImportHistoryTableProps {
  onDownloadErrors: (jobId: string) => void
  onViewDetails: (jobId: string) => void
}

export function ImportHistoryTable({
  onDownloadErrors,
  onViewDetails,
}: ImportHistoryTableProps) {
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listImportJobs()
      setJobs(data)
    } catch (err: any) {
      setError('Failed to load import history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMMITTED':
        return 'success'
      case 'PREVIEWED':
        return 'primary'
      case 'FAILED':
        return 'danger'
      case 'PENDING':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const columns = [
    {
      header: 'Date',
      accessor: (job: ImportJob) => formatDate(job.created_at),
    },
    {
      header: 'Filename',
      accessor: (job: ImportJob) => job.original_filename,
    },
    {
      header: 'Mode',
      accessor: (job: ImportJob) => job.mode,
    },
    {
      header: 'Status',
      accessor: (job: ImportJob) => (
        <Badge variant={getStatusBadgeVariant(job.status)}>
          {job.status}
        </Badge>
      ),
    },
    {
      header: 'Total',
      accessor: (job: ImportJob) => job.total_rows,
    },
    {
      header: 'Valid',
      accessor: (job: ImportJob) => (
        <span className="text-green-600">{job.valid_rows}</span>
      ),
    },
    {
      header: 'Invalid',
      accessor: (job: ImportJob) => (
        <span className="text-red-600">{job.invalid_rows}</span>
      ),
    },
    {
      header: 'Created',
      accessor: (job: ImportJob) => (
        <span className="text-blue-600">{job.created_count}</span>
      ),
    },
    {
      header: 'Updated',
      accessor: (job: ImportJob) => (
        <span className="text-purple-600">{job.updated_count}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (job: ImportJob) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onViewDetails(job.id)}
          >
            Details
          </Button>
          {job.error_report_file && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onDownloadErrors(job.id)}
            >
              Errors
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <div className="text-red-600">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Import History</h3>
        <Button onClick={fetchJobs} variant="secondary" size="sm">
          Refresh
        </Button>
      </div>
      <SimpleTable data={jobs} columns={columns as any} keyField="id" />
    </div>
  )
}
