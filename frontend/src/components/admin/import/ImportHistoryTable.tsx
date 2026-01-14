import { useState, useEffect } from 'react'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { listImportJobs as listStudentImportJobs } from '@/api/studentImport'
import { listImportJobs as listFacultyImportJobs } from '@/api/facultyImport'
import type { ImportJob as StudentImportJob } from '@/types/studentImport'
import type { ImportJob as FacultyImportJob } from '@/types/facultyImport'

interface ImportHistoryTableProps {
  onDownloadErrors: (jobId: string) => void
  onViewDetails: (jobId: string) => void
  importType: 'student' | 'faculty'
}

export function ImportHistoryTable({
  onDownloadErrors,
  onViewDetails,
  importType,
}: ImportHistoryTableProps) {
  const [jobs, setJobs] = useState<(StudentImportJob | FacultyImportJob)[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [importType])

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = importType === 'student'
        ? await listStudentImportJobs()
        : await listFacultyImportJobs()
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
      accessor: (job: StudentImportJob | FacultyImportJob) => formatDate(job.created_at),
    },
    {
      header: 'Filename',
      accessor: (job: StudentImportJob | FacultyImportJob) => job.original_filename,
    },
    {
      header: 'Mode',
      accessor: (job: StudentImportJob | FacultyImportJob) => job.mode,
    },
    {
      header: 'Status',
      accessor: (job: StudentImportJob | FacultyImportJob) => (
        <Badge variant={getStatusBadgeVariant(job.status)}>
          {job.status}
        </Badge>
      ),
    },
    {
      header: 'Total',
      accessor: (job: StudentImportJob | FacultyImportJob) => job.total_rows,
    },
    {
      header: 'Valid',
      accessor: (job: StudentImportJob | FacultyImportJob) => (
        <span className="text-green-600">{job.valid_rows}</span>
      ),
    },
    {
      header: 'Invalid',
      accessor: (job: StudentImportJob | FacultyImportJob) => (
        <span className="text-red-600">{job.invalid_rows}</span>
      ),
    },
    {
      header: 'Created',
      accessor: (job: StudentImportJob | FacultyImportJob) => (
        <span className="text-blue-600">{job.created_count}</span>
      ),
    },
    {
      header: 'Updated',
      accessor: (job: StudentImportJob | FacultyImportJob) => (
        <span className="text-purple-600">{job.updated_count}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (job: StudentImportJob | FacultyImportJob) => (
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
