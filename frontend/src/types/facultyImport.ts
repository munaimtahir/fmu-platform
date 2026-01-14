/**
 * Types for Faculty CSV Import
 */

export type ImportMode = 'CREATE_ONLY' | 'UPSERT'

export interface PreviewRow {
  row_number: number
  action: 'CREATE' | 'UPDATE' | 'SKIP'
  errors: Array<{
    column: string
    message: string
  }>
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
}

export interface CommitResponse {
  import_job_id: string
  status: string
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
  status: string
  mode: ImportMode
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
