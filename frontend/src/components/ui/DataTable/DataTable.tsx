import { flexRender } from '@tanstack/react-table'
import { DataTableProps } from './types'
import { useDataTable } from './useDataTable'
import { TableSkeleton } from '../Skeleton'
import { EmptyState } from '../EmptyState'

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableRowSelection = false,
  enableColumnVisibility = false,
  pageSize = 10,
  onRowClick,
  manualPagination = false,
  pageCount,
  totalCount,
  pagination,
  onPaginationChange,
}: DataTableProps<TData>) {
  const { table, globalFilter, setGlobalFilter, rowSelection } = useDataTable({
    data,
    columns,
    enableSorting,
    enableFiltering,
    enablePagination,
    enableRowSelection,
    enableColumnVisibility,
    pageSize,
    manualPagination,
    pageCount,
    pagination,
    onPaginationChange,
  })

  const exportToCSV = () => {
    const rows = Object.keys(rowSelection).length > 0
      ? table.getSelectedRowModel().rows
      : table.getRowModel().rows

    if (rows.length === 0) {
      alert('No data to export')
      return
    }

    // Get headers
    const headers = table.getAllColumns()
      .filter(col => col.getIsVisible())
      .map(col => col.id)
      .join(',')

    // Get data
    const csvData = rows.map(row => 
      table.getAllColumns()
        .filter(col => col.getIsVisible())
        .map(col => {
          const cell = row.getValue(col.id)
          // Escape CSV values
          const value = String(cell ?? '')
          return value.includes(',') || value.includes('"') || value.includes('\n')
            ? `"${value.replace(/"/g, '""')}"`
            : value
        })
        .join(',')
    ).join('\n')

    // Download
    const csv = `${headers}\n${csvData}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `export-${new Date().toISOString()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-surface-border p-6">
        <TableSkeleton rows={pageSize} columns={columns.length} />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-surface-border">
        <EmptyState
          icon="📊"
          title="No data available"
          description="There are no records to display at the moment."
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-surface-border overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-surface-border">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search */}
          {enableFiltering && (
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search..."
                className="w-full px-4 py-2 pl-10 rounded-2xl border border-surface-border focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-150"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {enableRowSelection && Object.keys(rowSelection).length > 0 && (
              <span className="px-3 py-2 text-sm text-ink-secondary bg-neutral-subtle rounded-lg">
                {Object.keys(rowSelection).length} selected
              </span>
            )}
            
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-[#10B981] text-white rounded-2xl hover:bg-success transition-colors duration-150 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export CSV
            </button>

            {enableColumnVisibility && (
              <button
                className="px-4 py-2 border border-surface-border rounded-2xl hover:bg-surface transition-colors duration-150"
                onClick={() => {
                  // Column visibility toggle would go here
                }}
              >
                Columns
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface border-b border-surface-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-ink-secondary uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'flex items-center gap-2 cursor-pointer select-none hover:text-ink-primary'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-ink-muted">
                            {{
                              asc: '↑',
                              desc: '↓',
                            }[header.column.getIsSorted() as string] ?? '↕'}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-surface-border">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={`
                  transition-colors duration-150
                  ${onRowClick ? 'cursor-pointer hover:bg-surface' : ''}
                  ${row.getIsSelected() ? 'bg-blue-50' : ''}
                `}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-ink-primary">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="p-4 border-t border-surface-border">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="text-sm text-ink-secondary">
              {(() => {
                const total = manualPagination ? totalCount ?? 0 : table.getFilteredRowModel().rows.length
                const { pageIndex, pageSize: currentPageSize } = table.getState().pagination
                return (
                  <>
                    Showing {total === 0 ? 0 : pageIndex * currentPageSize + 1} to{' '}
                    {Math.min((pageIndex + 1) * currentPageSize, total)} of {total} results
                  </>
                )
              })()}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 rounded-lg border border-surface-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors duration-150"
              >
                «
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 rounded-lg border border-surface-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors duration-150"
              >
                ‹
              </button>
              
              <span className="px-3 py-1 text-sm text-ink-secondary">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 rounded-lg border border-surface-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors duration-150"
              >
                ›
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 rounded-lg border border-surface-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors duration-150"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
