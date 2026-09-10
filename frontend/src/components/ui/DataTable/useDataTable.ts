import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table'
import { DataTableProps, PaginationState } from './types'

export function useDataTable<TData>(props: DataTableProps<TData>) {
  const {
    data,
    columns,
    enableSorting = true,
    enableFiltering = true,
    enablePagination = true,
    pageSize = 10,
    manualPagination = false,
    pageCount,
    pagination: controlledPagination,
    onPaginationChange,
  } = props

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [uncontrolledPagination, setUncontrolledPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

  const pagination = manualPagination ? controlledPagination ?? uncontrolledPagination : uncontrolledPagination

  const handlePaginationChange: typeof setUncontrolledPagination = (updater) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater
    if (manualPagination) {
      onPaginationChange?.(next)
    } else {
      setUncontrolledPagination(next)
    }
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination && !manualPagination ? getPaginationRowModel() : undefined,
    manualPagination: manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: handlePaginationChange,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
  })

  return {
    table,
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    globalFilter,
    setGlobalFilter,
  }
}
