import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { ErrorState } from '@/components/shared/ErrorState'
import { pageCount } from '@/lib/pagination'
import { FINANCE_PAGE_SIZE } from '@/services/finance'

export interface PagedTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  /** 1-based page number. */
  page: number
  total: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  /** Query failure message; renders an error state with retry instead of the table. */
  errorMessage?: string | null
  onRetry?: () => void
  onRowClick?: (row: T) => void
}

/** Server-paginated table: the backend owns paging (fixed page size), search and filters. */
export function PagedTable<T>({
  data,
  columns,
  page,
  total,
  onPageChange,
  isLoading,
  errorMessage,
  onRetry,
  onRowClick,
}: PagedTableProps<T>) {
  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />
  }
  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      enablePagination
      manualPagination
      pageSize={FINANCE_PAGE_SIZE}
      pageCount={pageCount(total, FINANCE_PAGE_SIZE)}
      totalCount={total}
      pagination={{ pageIndex: page - 1, pageSize: FINANCE_PAGE_SIZE }}
      onPaginationChange={(next) => onPageChange(next.pageIndex + 1)}
      onRowClick={onRowClick}
    />
  )
}

export const FilterBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 items-end">{children}</div>
)
