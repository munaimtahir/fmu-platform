import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { ImportUploader } from '@/components/admin/import/ImportUploader'
import { ImportPreviewTable } from '@/components/admin/import/ImportPreviewTable'
import { ImportHistoryTable } from '@/components/admin/import/ImportHistoryTable'
import {
  previewImport,
  commitImport,
  downloadTemplate,
  downloadErrorReport,
} from '@/api/studentImport'
import type {
  PreviewResponse,
  CommitResponse,
  ImportMode,
} from '@/types/studentImport'

type ViewMode = 'upload' | 'preview' | 'history'

export function StudentsImportPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [importJobId, setImportJobId] = useState<string | null>(null)

  const handlePreview = async (file: File, mode: ImportMode) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await previewImport(file, mode)
      setPreviewData(result)
      setImportJobId(result.import_job_id)
      setViewMode('preview')
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Failed to preview import'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async () => {
    if (!importJobId) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result: CommitResponse = await commitImport(importJobId, true)
      setSuccess(
        `Import completed! Created: ${result.created_count}, Updated: ${result.updated_count}, Failed: ${result.failed_count}`
      )
      setViewMode('history')
      setPreviewData(null)
      setImportJobId(null)
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Failed to commit import'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_import_template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError('Failed to download template')
    }
  }

  const handleDownloadErrors = async (jobId: string) => {
    try {
      const blob = await downloadErrorReport(jobId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `errors_${jobId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError('Failed to download error report')
    }
  }

  const handleReset = () => {
    setViewMode('upload')
    setPreviewData(null)
    setImportJobId(null)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Student CSV Import</h1>
        <div className="flex gap-2">
          <Button onClick={handleDownloadTemplate} variant="secondary">
            Download Template
          </Button>
          <Button
            onClick={() => setViewMode('history')}
            variant={viewMode === 'history' ? 'primary' : 'secondary'}
          >
            Import History
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" >
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" >
          {success}
        </Alert>
      )}

      {viewMode === 'upload' && (
        <Card>
          <ImportUploader
            onPreview={handlePreview}
            loading={loading}
            onReset={handleReset}
          />
        </Card>
      )}

      {viewMode === 'preview' && previewData && (
        <Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Import Preview</h2>
              <Button onClick={handleReset} variant="secondary">
                Upload New File
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <div className="text-sm text-gray-600">Total Rows</div>
                <div className="text-2xl font-bold">{previewData.total_rows}</div>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <div className="text-sm text-gray-600">Valid Rows</div>
                <div className="text-2xl font-bold text-green-600">
                  {previewData.valid_rows}
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded">
                <div className="text-sm text-gray-600">Invalid Rows</div>
                <div className="text-2xl font-bold text-red-600">
                  {previewData.invalid_rows}
                </div>
              </div>
            </div>

            {previewData.duplicate_file_warning && (
              <Alert variant="warning">
                Warning: A file with the same content has been imported before.
              </Alert>
            )}

            <ImportPreviewTable previewRows={previewData.preview_rows} />

            <div className="flex justify-end gap-2">
              <Button onClick={handleReset} variant="secondary">
                Cancel
              </Button>
              <Button
                onClick={handleCommit}
                disabled={loading || previewData.valid_rows === 0}
                variant="primary"
              >
                {loading ? <Spinner size="sm" /> : 'Commit Import'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {viewMode === 'history' && (
        <Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Import History</h2>
              <Button onClick={() => setViewMode('upload')} variant="secondary">
                New Import
              </Button>
            </div>
            <ImportHistoryTable
              onDownloadErrors={handleDownloadErrors}
              onViewDetails={(jobId) => {
                // Could navigate to detail view
                console.log('View details for job:', jobId)
              }}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
