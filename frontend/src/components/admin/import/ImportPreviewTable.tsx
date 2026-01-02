import { useState } from 'react'
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

  const filteredRows = previewRows.filter((row) => {
    if (filter === 'valid' && row.errors.length > 0) return false
    if (filter === 'invalid' && row.errors.length === 0) return false
    if (actionFilter !== 'all' && row.action !== actionFilter) return false
    return true
  })

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

  const columns = [
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
    {
      header: 'reg_no',
      accessor: (row: PreviewRow) => row.data.reg_no || '-',
    },
    {
      header: 'name',
      accessor: (row: PreviewRow) => row.data.name || '-',
    },
    {
      header: 'program_name',
      accessor: (row: PreviewRow) => row.data.program_name || '-',
    },
    {
      header: 'batch_name',
      accessor: (row: PreviewRow) => row.data.batch_name || '-',
    },
    {
      header: 'group_name',
      accessor: (row: PreviewRow) => row.data.group_name || '-',
    },
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
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">
            Filter:
          </label>
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as 'all' | 'valid' | 'invalid')
            }
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
            onChange={(e) =>
              setActionFilter(
                e.target.value as 'all' | 'CREATE' | 'UPDATE' | 'SKIP'
              )
            }
            className="border rounded px-2 py-1"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="SKIP">Skip</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredRows.length} of {previewRows.length} rows
        </div>
      </div>

      <div className="overflow-x-auto">
        <SimpleTable data={filteredRows} columns={columns as any} keyField="row_index" />
      </div>
    </div>
  )
}
