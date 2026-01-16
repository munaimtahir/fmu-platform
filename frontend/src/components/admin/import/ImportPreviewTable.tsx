import { useState, useMemo } from 'react'
import { SimpleTable } from '@/components/ui/SimpleTable'
import { Badge } from '@/components/ui/Badge'
import type { PreviewRow } from '@/types/studentImport'

interface ImportPreviewTableProps {
  previewRows: PreviewRow[]
}

export function ImportPreviewTable({
  previewRows,
}: ImportPreviewTableProps) {
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid'>('all')
  const [actionFilter, setActionFilter] = useState<
    'all' | 'CREATE' | 'UPDATE' | 'SKIP'
  >('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState<number | 'all'>(50)

  const filteredRows = useMemo(() => {
    return previewRows.filter((row) => {
      if (filter === 'valid' && row.errors.length > 0) return false
      if (filter === 'invalid' && row.errors.length === 0) return false
      if (actionFilter !== 'all' && row.action !== actionFilter) return false
      return true
    })
  }, [previewRows, filter, actionFilter])

  // Get all unique column names from the data
  const allColumns = useMemo(() => {
    const columnSet = new Set<string>()
    previewRows.forEach((row) => {
      Object.keys(row.data).forEach((key) => columnSet.add(key))
    })
    return Array.from(columnSet).sort()
  }, [previewRows])

  // Pagination
  const paginatedRows = useMemo(() => {
    if (rowsPerPage === 'all') {
      return filteredRows
    }
    const pageSize = rowsPerPage as number
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredRows.slice(startIndex, endIndex)
  }, [filteredRows, currentPage, rowsPerPage])

  const totalPages = useMemo(() => {
    if (rowsPerPage === 'all') return 1
    return Math.ceil(filteredRows.length / rowsPerPage)
  }, [filteredRows.length, rowsPerPage])

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'success'
      case 'UPDATE':
        return 'primary'
      case 'SKIP':
        return 'danger'
      default:
        return 'default'
    }
  }

  // Build columns dynamically
  const columns = useMemo(() => {
    const cols: any[] = [
      {
        header: 'Row',
        accessor: 'row_number',
      },
      {
        header: 'Action',
        accessor: (row: PreviewRow) => (
          <Badge variant={getActionBadgeVariant(row.action)}>
            {row.action}
          </Badge>
        ),
      },
      // Add all CSV columns dynamically
      ...allColumns.map((colName) => {
        // Handle generated fields with special labels
        const isGenerated = colName.startsWith('_generated_')
        const displayName = isGenerated 
          ? colName.replace('_generated_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
          : colName
        
        return {
          header: isGenerated ? `Generated: ${displayName}` : displayName,
          accessor: (row: PreviewRow) => {
            const value = row.data[colName]
            // Mask password fields for security
            if (colName.toLowerCase().includes('password')) {
              return value ? '••••••••' : '-'
            }
            return value || '-'
          },
        }
      }),
      {
        header: 'Errors',
        accessor: (row: PreviewRow) =>
          row.errors.length > 0 ? (
            <div className="text-red-600 text-sm">
              {row.errors.map((err, idx) => (
                <div key={idx}>
                  {err.column}: {err.message}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-green-600">✓ Valid</span>
          ),
      },
      {
        header: 'Comment',
        accessor: (row: PreviewRow) => {
          if (row.errors.length === 0) {
            return <span className="text-green-600 font-medium">Valid</span>
          } else {
            const errorMessages = row.errors.map((err) => 
              err.column ? `${err.column}: ${err.message}` : err.message
            ).join('; ')
            return (
              <span className="text-red-600 text-sm" title={errorMessages}>
                {errorMessages}
              </span>
            )
          }
        },
      },
    ]
    return cols
  }, [allColumns])

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center flex-wrap">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">
            Filter:
          </label>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as 'all' | 'valid' | 'invalid')
              setCurrentPage(1) // Reset to first page when filter changes
            }}
            className="border rounded px-2 py-1"
          >
            <option value="all">All Rows</option>
            <option value="valid">Valid Only</option>
            <option value="invalid">Invalid Only</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">
            Action:
          </label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(
                e.target.value as 'all' | 'CREATE' | 'UPDATE' | 'SKIP'
              )
              setCurrentPage(1) // Reset to first page when filter changes
            }}
            className="border rounded px-2 py-1"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="SKIP">Skip</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">
            Rows per page:
          </label>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              const value = e.target.value
              setRowsPerPage(value === 'all' ? 'all' : parseInt(value, 10))
              setCurrentPage(1)
            }}
            className="border rounded px-2 py-1"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Showing {rowsPerPage === 'all' 
            ? filteredRows.length 
            : `${(currentPage - 1) * (rowsPerPage as number) + 1}-${Math.min(currentPage * (rowsPerPage as number), filteredRows.length)}`} of {filteredRows.length} rows (Total: {previewRows.length})
        </div>
      </div>

      <div className="overflow-x-auto">
        <SimpleTable data={paginatedRows} columns={columns as any} keyField="row_number" />
      </div>

      {/* Pagination Controls */}
      {rowsPerPage !== 'all' && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              « First
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ‹ Prev
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded border ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Last »
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
