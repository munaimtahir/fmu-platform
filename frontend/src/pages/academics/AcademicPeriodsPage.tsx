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
import { academicsService, type AcademicPeriod } from '@/services/academics'

export const AcademicPeriodsPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['academic-periods', search],
    queryFn: () => academicsService.getAcademicPeriods(),
  })

  const columns = useMemo<ColumnDef<AcademicPeriod>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Period Name',
      },
      {
        accessorKey: 'period_type',
        header: 'Type',
      },
      {
        accessorKey: 'start_date',
        header: 'Start Date',
        cell: ({ row }) => row.original.start_date ? new Date(row.original.start_date).toLocaleDateString() : '-',
      },
      {
        accessorKey: 'end_date',
        header: 'End Date',
        cell: ({ row }) => row.original.end_date ? new Date(row.original.end_date).toLocaleDateString() : '-',
      },
    ],
    []
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageShell title="Academic Periods">
          <LoadingState />
        </PageShell>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageShell title="Academic Periods">
          <ErrorState message="Failed to load academic periods" onRetry={() => refetch()} />
        </PageShell>
      </DashboardLayout>
    )
  }

  const periods = Array.isArray(data) ? data : []

  return (
    <DashboardLayout>
      <PageShell 
        title="Academic Periods"
        description="Manage academic periods and terms"
        actions={
          <Input
            placeholder="Search periods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        }
      >
        {periods.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No academic periods found"
            description={search ? 'Try adjusting your search' : 'No academic periods have been created yet'}
          />
        ) : (
          <DataTable
            data={periods.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))}
            columns={columns}
            searchKey="name"
          />
        )}
      </PageShell>
    </DashboardLayout>
  )
}
