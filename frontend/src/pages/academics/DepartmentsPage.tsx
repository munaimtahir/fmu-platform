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
import { academicsService, type Department } from '@/services/academics'

export const DepartmentsPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['departments', search],
    queryFn: () => academicsService.getDepartments(),
  })

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Department Name',
      },
      {
        accessorKey: 'code',
        header: 'Code',
      },
    ],
    []
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageShell title="Departments">
          <LoadingState />
        </PageShell>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageShell title="Departments">
          <ErrorState message="Failed to load departments" onRetry={() => refetch()} />
        </PageShell>
      </DashboardLayout>
    )
  }

  const departments = Array.isArray(data) ? data : []

  return (
    <DashboardLayout>
      <PageShell 
        title="Departments"
        description="Manage academic departments"
        actions={
          <Input
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        }
      >
        {departments.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="No departments found"
            description={search ? 'Try adjusting your search' : 'No departments have been created yet'}
          />
        ) : (
          <DataTable
            data={departments.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))}
            columns={columns}
            searchKey="name"
          />
        )}
      </PageShell>
    </DashboardLayout>
  )
}
