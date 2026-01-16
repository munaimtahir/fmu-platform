import React from 'react'

export interface SimpleColumn<T> {
  key?: string
  label?: string
  render?: (item: T) => React.ReactNode
  // Support for alternative format used by ImportPreviewTable and ImportHistoryTable
  header?: string
  accessor?: string | ((item: T) => React.ReactNode)
}

export interface SimpleTableProps<T> {
  data: T[]
  columns: SimpleColumn<T>[]
  keyField: string
}

export function SimpleTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
}: SimpleTableProps<T>) {
  const getValue = (item: T, key: string): any => {
    if (!key) return undefined
    const keys = key.split('.')
    let value: any = item
    for (const k of keys) {
      value = value?.[k]
    }
    return value
  }

  // Normalize columns to support both formats
  const normalizedColumns = columns.map((column, index) => {
    // If using new format (key/label/render), use as-is
    if (column.key !== undefined || column.label !== undefined) {
      return {
        key: column.key || `col-${index}`,
        label: column.label || '',
        render: column.render,
      }
    }
    // If using old format (header/accessor), convert it
    if (column.header !== undefined || column.accessor !== undefined) {
      const accessor = column.accessor
      const isFunction = typeof accessor === 'function'
      return {
        key: isFunction ? `col-${index}` : (accessor as string) || `col-${index}`,
        label: column.header || '',
        render: isFunction ? accessor : undefined,
      }
    }
    // Fallback
    return {
      key: `col-${index}`,
      label: '',
      render: undefined,
    }
  })

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {normalizedColumns.map((column, index) => (
              <th
                key={column.key || `header-${index}`}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={normalizedColumns.length}
                className="px-6 py-4 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => {
              const rowKey = getValue(item, keyField) ?? rowIndex
              return (
                <tr key={rowKey} className="hover:bg-gray-50">
                  {normalizedColumns.map((column, colIndex) => {
                    const cellKey = column.key || `cell-${rowIndex}-${colIndex}`
                    let cellValue: React.ReactNode
                    
                    if (column.render) {
                      cellValue = column.render(item)
                    } else if (column.key) {
                      cellValue = getValue(item, column.key)
                    } else {
                      cellValue = null
                    }

                    return (
                      <td
                        key={cellKey}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {cellValue}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
