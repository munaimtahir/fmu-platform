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
import { programsService } from '@/services/programs'
import { Program } from '@/types'

export const ProgramsPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['programs', search],
    queryFn: () => programsService.getAll({ search }),
  })

  const columns = useMemo<ColumnDef<Program>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Program Name',
      },
      {
        accessorKey: 'structure_type',
        header: 'Structure Type',
      },
      {
        accessorKey: 'is_finalized',
        header: 'Finalized',
        cell: ({ row }) => (
          <span className={row.original.is_finalized ? 'text-green-600' : 'text-gray-400'}>
            {row.original.is_finalized ? 'Yes' : 'No'}
          </span>
        ),
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
        <PageShell title="Programs">
          <LoadingState />
        </PageShell>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageShell title="Programs">
          <ErrorState message="Failed to load programs" onRetry={() => refetch()} />
        </PageShell>
      </DashboardLayout>
    )
  }

  const programs = data?.results || []

  return (
    <DashboardLayout>
      <PageShell 
        title="Programs"
        description="Manage academic programs"
        actions={
          <div className="flex gap-2">
            <Input
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        }
      >
        {programs.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No programs found"
            description={search ? 'Try adjusting your search' : 'No programs have been created yet'}
          />
        ) : (
          <DataTable
            data={programs}
            columns={columns}
          />
        )}
      </PageShell>
    </DashboardLayout>
  )
}
