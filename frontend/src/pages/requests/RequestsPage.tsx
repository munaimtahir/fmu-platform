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
import { requestsService, type Request } from '@/services/requests'

export const RequestsPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['requests', search],
    queryFn: () => requestsService.getAll({ search }),
  })

  const columns = useMemo<ColumnDef<Request>[]>(
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
        accessorKey: 'request_type',
        header: 'Request Type',
        cell: ({ row }) => (
          <span className="capitalize">{row.original.request_type}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const variant = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'
          return (
            <Badge variant={variant}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'requested_at',
        header: 'Requested At',
        cell: ({ row }) => row.original.requested_at ? new Date(row.original.requested_at).toLocaleDateString() : '-',
      },
    ],
    []
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageShell title="Requests">
          <LoadingState />
        </PageShell>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <PageShell title="Requests">
          <ErrorState message="Failed to load requests" onRetry={() => refetch()} />
        </PageShell>
      </DashboardLayout>
    )
  }

  const requests = data?.results || []

  return (
    <DashboardLayout>
      <PageShell 
        title="Requests"
        description="Manage student requests (Bonafide, Transcript, NOC)"
        actions={
          <Input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        }
      >
        {requests.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No requests found"
            description={search ? 'Try adjusting your search' : 'No requests have been submitted yet'}
          />
        ) : (
          <DataTable
            data={requests}
            columns={columns}
          />
        )}
      </PageShell>
    </DashboardLayout>
  )
}
