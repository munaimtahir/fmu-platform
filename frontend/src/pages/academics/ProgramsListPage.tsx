import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ColumnDef } from '@tanstack/react-table'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { academicsNewService, type Program } from '@/services/academicsNew'

export const ProgramsListPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['academics-programs', search],
    queryFn: () => academicsNewService.getPrograms({ search }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => academicsNewService.deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-programs'] })
    },
  })

  const columns = useMemo<ColumnDef<Program>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Program Name',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/academics/programs/${row.original.id}`)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'structure_type',
        header: 'Structure Type',
        cell: ({ row }) => (
          <Badge variant={row.original.structure_type === 'YEARLY' ? 'default' : 'secondary'}>
            {row.original.structure_type}
          </Badge>
        ),
      },
      {
        accessorKey: 'is_finalized',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.is_finalized ? 'success' : 'warning'}>
            {row.original.is_finalized ? 'Finalized' : 'Draft'}
          </Badge>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Active',
        cell: ({ row }) => (
          <span className={row.original.is_active ? 'text-green-600' : 'text-gray-400'}>
            {row.original.is_active ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(`/academics/programs/${row.original.id}`)}
            >
              View
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm('Are you sure you want to delete this program?')) {
                  deleteMutation.mutate(row.original.id)
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [navigate, deleteMutation]
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

  const programs = data || []

  return (
    <DashboardLayout>
      <PageShell
        title="Programs"
        description="Manage academic programs and their structure"
        actions={
          <div className="flex gap-2">
            <Input
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={() => navigate('/academics/programs/new')}>
              Create Program
            </Button>
          </div>
        }
      >
        {programs.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No programs found"
            description={search ? 'Try adjusting your search' : 'No programs have been created yet'}
            action={{
              label: 'Create First Program',
              onClick: () => navigate('/academics/programs/new'),
            }}
          />
        ) : (
          <DataTable data={programs} columns={columns} />
        )}
      </PageShell>
    </DashboardLayout>
  )
}

