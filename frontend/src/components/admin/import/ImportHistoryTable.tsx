import { useState, useEffect, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { listImportJobs as listStudentImportJobs } from '@/api/studentImport'
import type { ImportJob as StudentImportJob } from '@/types/studentImport'

interface ImportHistoryTableProps {
  onDownloadErrors: (jobId: string) => void
  onViewDetails: (jobId: string) => void
}

export function ImportHistoryTable({
  onDownloadErrors,
  onViewDetails,
}: ImportHistoryTableProps) {
  const [jobs, setJobs] = useState<StudentImportJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listStudentImportJobs()
      setJobs(data)
    } catch (err: any) {
      setError('Failed to load import history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const columns = useMemo<ColumnDef<StudentImportJob>[]>(
    () => [
      {
        id: 'date',
        header: 'Date',
        accessorFn: (job) => job.created_at,
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        id: 'filename',
        header: 'Filename',
        accessorFn: (job) => job.original_filename,
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (job) => job.status,
        cell: ({ row }) => <StatusBadge domain="import" status={row.original.status} />,
      },
      {
        id: 'total_rows',
        header: 'Total',
        accessorFn: (job) => job.total_rows,
      },
      {
        id: 'valid_rows',
        header: 'Valid',
        accessorFn: (job) => job.valid_rows,
        cell: ({ row }) => (
          <span className="text-success">{row.original.valid_rows}</span>
        ),
      },
      {
        id: 'invalid_rows',
        header: 'Invalid',
        accessorFn: (job) => job.invalid_rows,
        cell: ({ row }) => (
          <span className="text-danger">{row.original.invalid_rows}</span>
        ),
      },
      {
        id: 'created_count',
        header: 'Created',
        accessorFn: (job) => job.created_count,
        cell: ({ row }) => (
          <span className="text-info">{row.original.created_count}</span>
        ),
      },
      {
        id: 'updated_count',
        header: 'Unchanged',
        accessorFn: (job) => job.unchanged_count,
        cell: ({ row }) => (
          <span className="text-purple-600">
            {row.original.unchanged_count}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const job = row.original
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onViewDetails(job.id)}
              >
                Details
              </Button>
              {job.has_error_report && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onDownloadErrors(job.id)}
                >
                  Errors
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [onDownloadErrors, onViewDetails]
  )

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <div className="text-danger">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-h4">Import History</h3>
        <Button onClick={fetchJobs} variant="secondary" size="sm">
          Refresh
        </Button>
      </div>
      <DataTable data={jobs} columns={columns} />
    </div>
  )
}
