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
import { academicsService, type Group } from '@/services/academics'
import { GroupFormModal } from '@/features/academics/GroupFormModal'
import toast from 'react-hot-toast'

export const GroupsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['groups', search],
    queryFn: () => academicsService.getGroups(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => academicsService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Group deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to delete group')
    },
  })

  const columns = useMemo<ColumnDef<Group>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Group Name',
      },
      {
        accessorKey: 'batch_name',
        header: 'Batch',
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
                setEditingGroup(row.original)
                setIsFormOpen(true)
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm('Delete this group?')) {
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
        <PageShell title="Groups">
          <LoadingState />
        </PageShell>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageShell title="Groups">
          <ErrorState message="Failed to load groups" onRetry={() => refetch()} />
        </PageShell>
      </DashboardLayout>
    )
  }

  const groups = Array.isArray(data) ? data : []

  return (
    <DashboardLayout>
      <PageShell 
        title="Groups"
        description="Manage student groups within batches"
        actions={
          <div className="flex gap-2">
            <Input
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={() => {
              setEditingGroup(null)
              setIsFormOpen(true)
            }}>
              Create Group
            </Button>
          </div>
        }
      >
        {groups.length === 0 ? (
          <EmptyState
            icon="🏫"
            title="No groups found"
            description={search ? 'Try adjusting your search' : 'No groups have been created yet'}
            action={{
              label: 'Create First Group',
              onClick: () => {
                setEditingGroup(null)
                setIsFormOpen(true)
              },
            }}
          />
        ) : (
          <DataTable
            data={groups.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()))}
            columns={columns}
          />
        )}
      </PageShell>
      {isFormOpen && (
        <GroupFormModal
          group={editingGroup}
          onClose={() => {
            setIsFormOpen(false)
            setEditingGroup(null)
          }}
        />
      )}
    </DashboardLayout>
  )
}
