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
import { academicsNewService, type Department } from '@/services/academicsNew'
import { DepartmentFormModal } from '@/features/academics/DepartmentFormModal'

export const DepartmentsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['academics-departments', search],
    queryFn: () => academicsNewService.getDepartments(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => academicsNewService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-departments'] })
    },
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
      {
        accessorKey: 'parent_name',
        header: 'Parent Department',
        cell: ({ row }) => row.original.parent_name || '-',
      },
      {
        accessorKey: 'children_count',
        header: 'Sub-departments',
        cell: ({ row }) => row.original.children_count || 0,
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
                setEditingDepartment(row.original)
                setIsFormOpen(true)
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm('Delete this department?')) {
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
        description="Manage academic departments with hierarchical structure"
        actions={
          <div className="flex gap-2">
            <Input
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={() => {
              setEditingDepartment(null)
              setIsFormOpen(true)
            }}>
              Create Department
            </Button>
          </div>
        }
      >
        {departments.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="No departments found"
            description={search ? 'Try adjusting your search' : 'No departments have been created yet'}
            action={{
              label: 'Create First Department',
              onClick: () => {
                setEditingDepartment(null)
                setIsFormOpen(true)
              },
            }}
          />
        ) : (
          <DataTable
            data={departments.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))}
            columns={columns}
          />
        )}
      </PageShell>
      {isFormOpen && (
        <DepartmentFormModal
          department={editingDepartment}
          onClose={() => {
            setIsFormOpen(false)
            setEditingDepartment(null)
          }}
        />
      )}
    </DashboardLayout>
  )
}
