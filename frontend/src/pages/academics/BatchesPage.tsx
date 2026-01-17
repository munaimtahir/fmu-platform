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
import { batchesService } from '@/services/batches'
import type { Batch } from '@/services/batches'
import { BatchFormModal } from '@/features/academics/BatchFormModal'
import toast from 'react-hot-toast'

export const BatchesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['batches', search],
    queryFn: () => batchesService.getAll({ search }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => batchesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      toast.success('Batch deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to delete batch')
    },
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
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingBatch(row.original)
                setIsFormOpen(true)
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm('Delete this batch?')) {
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
          <div className="flex gap-2">
            <Input
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={() => {
              setEditingBatch(null)
              setIsFormOpen(true)
            }}>
              Create Batch
            </Button>
          </div>
        }
      >
        {batches.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No batches found"
            description={search ? 'Try adjusting your search' : 'No batches have been created yet'}
            action={{
              label: 'Create First Batch',
              onClick: () => {
                setEditingBatch(null)
                setIsFormOpen(true)
              },
            }}
          />
        ) : (
          <DataTable
            data={batches}
            columns={columns}
          />
        )}
      </PageShell>
      {isFormOpen && (
        <BatchFormModal
          batch={editingBatch}
          onClose={() => {
            setIsFormOpen(false)
            setEditingBatch(null)
          }}
        />
      )}
    </DashboardLayout>
  )
}
