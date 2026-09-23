/**
 * API client for Student CSV Import
 */
import api from './axios'
import type {
  CommitResponse,
  ImportJob,
  PreviewResponse,
} from '@/types/studentImport'

/**
 * Upload CSV file and get preview
 */
export async function previewImport(
  file: File
): Promise<PreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<PreviewResponse>(
    '/api/admin/students/import/preview/',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  return response.data
}

/**
 * Commit validated import
 */
export async function commitImport(
  importJobId: string,
  file: File,
  confirm: boolean = true
): Promise<CommitResponse> {
  const payload = new FormData()
  payload.append('import_job_id', importJobId)
  payload.append('confirm', String(confirm))
  payload.append('file', file)

  const response = await api.post<CommitResponse>(
    '/api/admin/students/import/commit/',
    payload,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )

  return response.data
}

/**
 * Download CSV template
 */
export async function downloadTemplate(): Promise<Blob> {
  const response = await api.get('/api/admin/students/import/template/', {
    responseType: 'blob',
  })

  return response.data
}

/**
 * List all import jobs
 */
export async function listImportJobs(): Promise<ImportJob[]> {
  const response = await api.get<ImportJob[]>('/api/admin/students/import/jobs/')
  return response.data
}

/**
 * Get import job details
 */
export async function getImportJob(id: string): Promise<ImportJob> {
  const response = await api.get<ImportJob>(
    `/api/admin/students/import/${id}/detail/`
  )
  return response.data
}

/**
 * Download error CSV for an import job
 */
export async function downloadErrorReport(id: string): Promise<Blob> {
  const response = await api.get(
    `/api/admin/students/import/${id}/errors.csv/`,
    {
      responseType: 'blob',
    }
  )

  return response.data
}
