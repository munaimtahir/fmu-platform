import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { batchesService } from '@/services/batches'
import type { Batch } from '@/services/batches'

export const BatchesPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['batches', search],
    queryFn: () => batchesService.getAll({ search, page_size: 100 }),
  })

  const columns = useMemo<ColumnDef<Batch>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Batch Name',
      },
      {
        accessorKey: 'program_name',
        header: 'Program',
      },
      {
        accessorKey: 'year',
        header: 'Year',
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <span className={row.original.is_active ? 'text-green-600' : 'text-gray-400'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    ],
    []
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageShell title="Batches">
          <LoadingState />
        </PageShell>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageShell title="Batches">
          <ErrorState message="Failed to load batches" onRetry={() => refetch()} />
        </PageShell>
      </DashboardLayout>
    )
  }

  const batches = data?.results || []

  return (
    <DashboardLayout>
      <PageShell 
        title="Batches"
        description="Manage student batches"
        actions={
          <Input
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        }
      >
        {batches.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No batches found"
            description={search ? 'Try adjusting your search' : 'No batches have been created yet'}
          />
        ) : (
          <DataTable
            data={batches}
            columns={columns}
            searchKey="name"
          />
        )}
      </PageShell>
    </DashboardLayout>
  )
}
