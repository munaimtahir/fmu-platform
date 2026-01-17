import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { academicsService, type AcademicPeriod } from '@/services/academics'
import { AcademicPeriodFormModal } from '@/features/academics/AcademicPeriodFormModal'
import toast from 'react-hot-toast'

export const AcademicPeriodsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['academic-periods', search],
    queryFn: () => academicsService.getAcademicPeriods(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => academicsService.deleteAcademicPeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-periods'] })
      toast.success('Academic period deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to delete academic period')
    },
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
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingPeriod(row.original)
                setIsFormOpen(true)
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm('Delete this academic period?')) {
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
    [deleteMutation]
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
          <div className="flex gap-2">
            <Input
              placeholder="Search periods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={() => {
              setEditingPeriod(null)
              setIsFormOpen(true)
            }}>
              Create Period
            </Button>
          </div>
        }
      >
        {periods.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No academic periods found"
            description={search ? 'Try adjusting your search' : 'No academic periods have been created yet'}
            action={{
              label: 'Create First Period',
              onClick: () => {
                setEditingPeriod(null)
                setIsFormOpen(true)
              },
            }}
          />
        ) : (
          <DataTable
            data={periods.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))}
            columns={columns}
          />
        )}
      </PageShell>
      {isFormOpen && (
        <AcademicPeriodFormModal
          period={editingPeriod}
          onClose={() => {
            setIsFormOpen(false)
            setEditingPeriod(null)
          }}
        />
      )}
    </DashboardLayout>
  )
}
