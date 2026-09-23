import { useState } from 'react'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Can } from '@/components/shared/Can'
import { ImportUploader } from '@/components/admin/import/ImportUploader'
import { ImportPreviewTable } from '@/components/admin/import/ImportPreviewTable'
import { ImportHistoryTable } from '@/components/admin/import/ImportHistoryTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  previewImport as previewStudentImport,
  commitImport as commitStudentImport,
  downloadTemplate as downloadStudentTemplate,
  downloadErrorReport as downloadStudentErrorReport,
  getImportJob,
} from '@/api/studentImport'
import type { PreviewResponse as StudentPreviewResponse, ImportJob } from '@/types/studentImport'

type ViewMode = 'upload' | 'preview' | 'history'

export function StudentsImportPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<StudentPreviewResponse | null>(null)
  const [importJobId, setImportJobId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showCommitConfirmation, setShowCommitConfirmation] = useState(false)
  const [detail, setDetail] = useState<ImportJob | null>(null)

  const handlePreview = async (file: File) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await previewStudentImport(file)
      setSelectedFile(file)
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
    if (!importJobId || !selectedFile) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await commitStudentImport(importJobId, selectedFile, true)
      setSuccess(`Import completed! Created: ${result.created_count}, Unchanged: ${result.unchanged_count}, Failed: ${result.failed_count}`)
      setViewMode('history')
      setPreviewData(null)
      setImportJobId(null)
      setSelectedFile(null)
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
      const blob = await downloadStudentTemplate()
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
      const blob = await downloadStudentErrorReport(jobId)
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
    setSelectedFile(null)
    setError(null)
    setSuccess(null)
  }

  return (
    <PageShell
      title="Student CSV Import"
      description="Provision student accounts from a validated, create-only CSV file."
      actions={
        <Button
          onClick={() => setViewMode('history')}
          variant={viewMode === 'history' ? 'primary' : 'secondary'}
        >
          Import History
        </Button>
      }
    >
      <div className="space-y-6">
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
            <div className="mb-4">
              <h2 className="text-h2 mb-2">
                Student CSV Import
              </h2>
              <p className="text-ink-secondary">
                Upload the approved student list. Preview is read-only and temporary passwords are never returned or stored as plaintext.
              </p>
            </div>
            <Can tasks={['students.imports.execute']}><ImportUploader
              onPreview={handlePreview}
              loading={loading}
              onReset={handleReset}
              onDownloadTemplate={handleDownloadTemplate}
            /></Can>
          </Card>
        )}

        {viewMode === 'preview' && previewData && (
          <Card>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-h2">
                  Student Import Preview
                </h2>
                <Button onClick={handleReset} variant="secondary">
                  Upload New File
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-info-subtle rounded">
                  <div className="text-sm text-ink-secondary">Total Rows</div>
                  <div className="text-h2">{previewData.total_rows}</div>
                </div>
                <div className="p-4 bg-success-subtle rounded">
                  <div className="text-sm text-ink-secondary">Valid Rows</div>
                  <div className="text-h2 text-success">
                    {previewData.valid_rows}
                  </div>
                </div>
                <div className="p-4 bg-danger-subtle rounded">
                  <div className="text-sm text-ink-secondary">Invalid Rows</div>
                  <div className="text-h2 text-danger">
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
                  onClick={() => setShowCommitConfirmation(true)}
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
                <h2 className="text-h2">Import History</h2>
                <Button onClick={() => setViewMode('upload')} variant="secondary">
                  New Import
                </Button>
              </div>
              <ImportHistoryTable
                onDownloadErrors={handleDownloadErrors}
                onViewDetails={async (jobId) => {
                  try { setDetail(await getImportJob(jobId)) } catch { setError('Failed to load import details') }
                }}
              />
            </div>
          </Card>
        )}
        {detail && <Modal title={`Import ${detail.original_filename}`} onClose={() => setDetail(null)}><dl className="grid grid-cols-2 gap-3 text-sm"><dt>Status</dt><dd>{detail.status}</dd><dt>Created</dt><dd>{detail.created_count}</dd><dt>Unchanged</dt><dd>{detail.unchanged_count}</dd><dt>Failed</dt><dd>{detail.failed_count}</dd><dt>Preview expires</dt><dd>{new Date(detail.expires_at).toLocaleString()}</dd><dt>Started by</dt><dd>{detail.created_by_username}</dd></dl>{detail.summary && <pre className="mt-4 overflow-auto rounded bg-surface-subtle p-3 text-xs">{JSON.stringify(detail.summary, null, 2)}</pre>}</Modal>}
        {showCommitConfirmation && previewData && (
          <ConfirmDialog
            title="Commit student import"
            message={`Create ${previewData.summary.create_count ?? 0} student account(s) from this file? Valid rows will be committed even if other rows are rejected.`}
            confirmLabel="Commit import"
            onConfirm={handleCommit}
            onClose={() => setShowCommitConfirmation(false)}
          />
        )}
      </div>
    </PageShell>
  )
}
