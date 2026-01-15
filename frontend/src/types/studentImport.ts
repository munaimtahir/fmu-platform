/**
 * Types for Student CSV Import feature
 */

export type ImportMode = 'CREATE_ONLY' | 'UPSERT'

export type ImportJobStatus = 'PENDING' | 'PREVIEWED' | 'COMMITTED' | 'FAILED'

export interface RowError {
  column: string
  message: string
}

export interface PreviewRow {
  row_number: number
  action: 'CREATE' | 'UPDATE' | 'SKIP'
  errors: RowError[]
  data: Record<string, string>
}

export interface PreviewResponse {
  import_job_id: string
  total_rows: number
  valid_rows: number
  invalid_rows: number
  duplicate_file_warning: boolean
  preview_rows: PreviewRow[]
  summary: {
    create_count: number
    update_count: number
    skip_count: number
  }
}

export interface CommitRequest {
  import_job_id: string
  confirm: boolean
  auto_create?: boolean
}

export interface CommitResponse {
  import_job_id: string
  status: ImportJobStatus
  created_count: number
  updated_count: number
  failed_count: number
  has_error_report: boolean
}

export interface ImportJob {
  id: string
  created_by: number
  created_by_username: string
  created_at: string
  finished_at: string | null
  status: ImportJobStatus
  mode: ImportMode
  auto_create: boolean
  original_filename: string
  file_hash: string
  total_rows: number
  valid_rows: number
  invalid_rows: number
  created_count: number
  updated_count: number
  failed_count: number
  error_report_file: string | null
  summary: Record<string, any> | null
}
