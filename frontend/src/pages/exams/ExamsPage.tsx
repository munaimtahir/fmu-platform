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
import { examsService, type Exam } from '@/services/exams'

export const ExamsPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['exams', search],
    queryFn: () => examsService.getAll({ search, page_size: 100 }),
  })

  const columns = useMemo<ColumnDef<Exam>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Exam Name',
      },
      {
        accessorKey: 'exam_type',
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
        <PageShell title="Exams">
          <LoadingState />
        </PageShell>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageShell title="Exams">
          <ErrorState message="Failed to load exams" onRetry={() => refetch()} />
        </PageShell>
      </DashboardLayout>
    )
  }

  const exams = data?.results || []

  return (
    <DashboardLayout>
      <PageShell 
        title="Exams"
        description="Manage exams and exam components"
        actions={
          <Input
            placeholder="Search exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        }
      >
        {exams.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No exams found"
            description={search ? 'Try adjusting your search' : 'No exams have been created yet'}
          />
        ) : (
          <DataTable
            data={exams}
            columns={columns}
            searchKey="name"
          />
        )}
      </PageShell>
    </DashboardLayout>
  )
}
