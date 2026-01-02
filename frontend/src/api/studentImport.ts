/**
 * API client for Student CSV Import
 */
import api from './axios'
import type {
  CommitRequest,
  CommitResponse,
  ImportJob,
  ImportMode,
  PreviewResponse,
} from '@/types/studentImport'

/**
 * Upload CSV file and get preview
 */
export async function previewImport(
  file: File,
  mode: ImportMode = 'CREATE_ONLY'
): Promise<PreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('mode', mode)

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
  confirm: boolean = true
): Promise<CommitResponse> {
  const response = await api.post<CommitResponse>(
    '/api/admin/students/import/commit/',
    {
      import_job_id: importJobId,
      confirm,
    } as CommitRequest
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
