import React, { useEffect, useState } from 'react'
import { PageShell } from '@/components/shared/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { FileUpload } from '@/components/ui/FileUpload'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Can } from '@/components/shared/Can'
import { apiErrorMessage } from '@/lib/apiErrors'
import { saveBlob } from '@/lib/download'
import { commitImport, downloadErrorReport, downloadTemplate, listImportJobs, previewImport } from '@/api/facultyImport'
import type { ImportJob, ImportMode, PreviewResponse } from '@/types/facultyImport'

export const FacultyImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ImportMode>('CREATE_ONLY')
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const refreshJobs = async () => { try { setJobs(await listImportJobs()) } catch (err) { setError(apiErrorMessage(err, 'Could not load import history.')) } }
  useEffect(() => { void refreshJobs() }, [])

  const handlePreview = async () => {
    if (!file) return
    setLoading(true); setError(null); setMessage(null)
    try { setPreview(await previewImport(file, mode)) } catch (err) { setError(apiErrorMessage(err, 'Could not validate the faculty CSV.')) } finally { setLoading(false) }
  }
  const handleCommit = async () => {
    if (!preview) return
    setLoading(true); setError(null); setConfirm(false)
    try { const result = await commitImport(preview.import_job_id, true); setMessage(`Import ${result.status.toLowerCase()}: ${result.created_count} created, ${result.updated_count} updated, ${result.failed_count} failed.`); setPreview(null); setFile(null); await refreshJobs() } catch (err) { setError(apiErrorMessage(err, 'Could not commit the faculty import.')) } finally { setLoading(false) }
  }
  const download = async (kind: 'template' | 'errors', job?: ImportJob) => { try { const blob = kind === 'template' ? await downloadTemplate() : await downloadErrorReport(job!.id); saveBlob(blob, kind === 'template' ? 'faculty_import_template.csv' : `faculty_import_errors_${job!.id}.csv`) } catch (err) { setError(apiErrorMessage(err, 'Download failed.')) } }

  return <PageShell title="Faculty Import" description="Preview and commit faculty records from a CSV file.">
    {error && <Alert variant="error" className="mb-4">{error}</Alert>}{message && <Alert variant="success" className="mb-4">{message}</Alert>}
    <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-h4">Upload faculty CSV</h2><p className="mt-1 text-sm text-ink-secondary">Validate rows before any faculty records are created or updated.</p></div><Button variant="secondary" onClick={() => void download('template')}>Download template</Button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm text-ink-secondary">Import mode<select className="mt-1 w-full rounded-2xl border border-surface-border px-4 py-2" value={mode} onChange={(event) => setMode(event.target.value as ImportMode)}><option value="CREATE_ONLY">Create only</option><option value="UPSERT">Upsert existing records</option></select></label><FileUpload id="faculty-import-file" label="CSV file" accept=".csv,text/csv" maxSize={10 * 1024 * 1024} onChange={(files) => setFile(files?.[0] ?? null)} /></div><div className="mt-4 flex justify-end"><Can roles={['Admin', 'Coordinator']}><Button onClick={() => void handlePreview()} disabled={!file || loading} isLoading={loading}>Preview import</Button></Can></div></Card>
    {preview && <Card className="mt-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-h4">Preview</h2><p className="text-sm text-ink-secondary">{preview.total_rows} rows · {preview.valid_rows} valid · {preview.invalid_rows} invalid</p></div>{preview.duplicate_file_warning && <Badge variant="warning">Duplicate file warning</Badge>}</div><div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b border-surface-border text-left"><th className="p-2">Row</th><th className="p-2">Action</th><th className="p-2">Data</th><th className="p-2">Errors</th></tr></thead><tbody>{preview.preview_rows.map((row) => <tr key={row.row_number} className="border-b border-surface-border align-top"><td className="p-2">{row.row_number}</td><td className="p-2"><Badge variant={row.errors.length ? 'danger' : row.action === 'UPDATE' ? 'info' : 'success'}>{row.action}</Badge></td><td className="max-w-md whitespace-pre-wrap p-2">{Object.entries(row.data).map(([key, value]) => <div key={key}><span className="font-medium">{key}:</span> {key.toLowerCase().includes('password') ? '••••••••' : value}</div>)}</td><td className="p-2 text-danger">{row.errors.map((item) => <div key={`${item.column}-${item.message}`}>{item.column}: {item.message}</div>)}</td></tr>)}</tbody></table></div><div className="mt-4 flex justify-end"><Can roles={['Admin', 'Coordinator']}><Button onClick={() => setConfirm(true)} disabled={preview.invalid_rows > 0 || loading}>Commit valid rows</Button></Can></div></Card>}
    <Card className="mt-4"><div className="flex items-center justify-between"><h2 className="text-h4">Import history</h2><Button size="sm" variant="secondary" onClick={() => void refreshJobs()}>Refresh</Button></div>{jobs.length === 0 ? <EmptyState icon="🗂️" title="No imports yet" /> : <div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b border-surface-border text-left"><th className="p-2">Date</th><th className="p-2">File</th><th className="p-2">Status</th><th className="p-2">Rows</th><th className="p-2">Actions</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id} className="border-b border-surface-border"><td className="p-2">{new Date(job.created_at).toLocaleString()}</td><td className="p-2">{job.original_filename}</td><td className="p-2"><Badge variant={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'danger' : 'warning'}>{job.status}</Badge></td><td className="p-2">{job.total_rows}</td><td className="p-2">{job.error_report_file && <Button size="sm" variant="secondary" onClick={() => void download('errors', job)}>Download errors</Button>}</td></tr>)}</tbody></table></div>}</Card>
    {confirm && <ConfirmDialog title="Commit faculty import" message="Commit all valid rows from this preview? This will create or update faculty records." confirmLabel="Commit import" onClose={() => setConfirm(false)} onConfirm={handleCommit} />}
  </PageShell>
}
