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
import { academicsService, type Group } from '@/services/academics'

export const GroupsPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['groups', search],
    queryFn: () => academicsService.getGroups(),
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
    ],
    []
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
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        }
      >
        {groups.length === 0 ? (
          <EmptyState
            icon="🏫"
            title="No groups found"
            description={search ? 'Try adjusting your search' : 'No groups have been created yet'}
          />
        ) : (
          <DataTable
            data={groups.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()))}
            columns={columns}
            searchKey="name"
          />
        )}
      </PageShell>
    </DashboardLayout>
  )
}
