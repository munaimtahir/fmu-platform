import { ColumnDef } from '@tanstack/react-table'

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
}

export interface PaginationState {
  pageIndex: number
  pageSize: number
}

export type SortingState = {
  id: string
  desc: boolean
}[];
