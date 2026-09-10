import { ColumnDef } from '@tanstack/react-table'

export interface PaginationState {
  pageIndex: number
  pageSize: number
}

export interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  isLoading?: boolean
  enableSorting?: boolean
  enableFiltering?: boolean
  enablePagination?: boolean
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  pageSize?: number
  onRowClick?: (row: TData) => void
  /**
   * Switches pagination to server-driven mode: `data` is treated as just the
   * current page's rows, and the caller owns page state via `pagination` /
   * `onPaginationChange`. Requires `pageCount` and `totalCount`. Defaults to
   * false (client-side pagination over the full `data` array), so existing
   * consumers are unaffected.
   */
  manualPagination?: boolean
  /** Total number of pages, required when `manualPagination` is true. */
  pageCount?: number
  /** Total row count across all pages, used for the "Showing X to Y of Z" footer in manual mode. */
  totalCount?: number
  /** Controlled pagination state, required when `manualPagination` is true. */
  pagination?: PaginationState
  /** Called when the user changes page/page size in manual mode. */
  onPaginationChange?: (pagination: PaginationState) => void
}

export type SortingState = {
  id: string
  desc: boolean
}[];
