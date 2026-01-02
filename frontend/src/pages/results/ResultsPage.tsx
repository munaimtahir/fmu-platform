import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { resultsService, type ResultHeader } from '@/services/results'

export const ResultsPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results', search],
    queryFn: () => resultsService.getAll({ search, page_size: 100 }),
  })

  const columns = useMemo<ColumnDef<ResultHeader>[]>(
    () => [
      {
        accessorKey: 'student_reg_no',
        header: 'Registration No',
      },
      {
        accessorKey: 'student_name',
        header: 'Student Name',
      },
      {
        accessorKey: 'program_name',
        header: 'Program',
      },
      {
        accessorKey: 'total_score',
        header: 'Total Score',
      },
      {
        accessorKey: 'grade',
        header: 'Grade',
      },
      {
        accessorKey: 'published',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.published ? 'success' : 'warning'}>
            {row.original.published ? 'Published' : 'Draft'}
          </Badge>
        ),
      },
    ],
    []
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageShell title="Results">
          <LoadingState />
        </PageShell>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageShell title="Results">
          <ErrorState message="Failed to load results" onRetry={() => refetch()} />
        </PageShell>
      </DashboardLayout>
    )
  }

  const results = data?.results || []

  return (
    <DashboardLayout>
      <PageShell 
        title="Results"
        description="View and manage student results"
        actions={
          <Input
            placeholder="Search results..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        }
      >
        {results.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No results found"
            description={search ? 'Try adjusting your search' : 'No results have been recorded yet'}
          />
        ) : (
          <DataTable
            data={results}
            columns={columns}
            searchKey="student_name"
          />
        )}
      </PageShell>
    </DashboardLayout>
  )
}
