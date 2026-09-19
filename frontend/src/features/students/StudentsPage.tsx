/**
 * Students directory: server-side search and paging, row links to the student detail page,
 * and task-gated create / edit / delete.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { studentsService } from '@/services'
import { Student } from '@/types'
import { StudentForm } from './StudentForm'

const PAGE_SIZE = 50

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: 'success',
  graduated: 'info',
  inactive: 'warning',
  suspended: 'danger',
  on_leave: 'warning',
}

export function StudentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['students', debouncedSearch, pageIndex],
    queryFn: () => studentsService.getAll({ page: pageIndex + 1, search: debouncedSearch || undefined }),
  })

  const handleAdd = () => {
    setEditingStudent(null)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingStudent(null)
  }

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      { accessorKey: 'reg_no', header: 'Registration No' },
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'program',
        header: 'Program',
        cell: ({ row }) => row.original.program_name || row.original.program,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status] ?? 'default'}>
            {row.original.status_display ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex space-x-2" onClick={(event) => event.stopPropagation()}>
            <Button size="sm" variant="ghost" onClick={() => navigate(`/students/${row.original.id}`)} aria-label={`View ${row.original.name}`}>
              View
            </Button>
            <Can tasks={['students.students.update']}>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Edit ${row.original.name}`}
                onClick={() => {
                  setEditingStudent(row.original)
                  setIsFormOpen(true)
                }}
              >
                Edit
              </Button>
            </Can>
            <Can tasks={['students.students.delete']}>
              <Button size="sm" variant="danger" aria-label={`Delete ${row.original.name}`} onClick={() => setDeletingStudent(row.original)}>
                Delete
              </Button>
            </Can>
          </div>
        ),
      },
    ],
    [navigate]
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-h1">Students</h1>
        <div className="flex flex-wrap gap-3">
          <Can roles={['Admin', 'Coordinator']}>
            <Button onClick={() => navigate('/system/students/import')} variant="secondary">
              Bulk Upload
            </Button>
          </Can>
          <Can tasks={['students.students.create']}>
            <Button onClick={handleAdd}>Add Student</Button>
          </Can>
        </div>
      </div>

      <div className="mb-4">
        <Input
          aria-label="Search students"
          placeholder="Search students..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPageIndex(0)
          }}
          className="max-w-sm"
        />
      </div>

      {isError ? (
        <ErrorState message={apiErrorMessage(error, 'Could not load students.')} onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data?.results || []}
          columns={columns}
          isLoading={isLoading}
          enableFiltering={false}
          onRowClick={(student) => navigate(`/students/${student.id}`)}
          manualPagination
          pageSize={PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE))}
          totalCount={data?.count ?? 0}
          pagination={{ pageIndex, pageSize: PAGE_SIZE }}
          onPaginationChange={(next) => setPageIndex(next.pageIndex)}
        />
      )}

      {isFormOpen && (
        <StudentForm
          student={editingStudent}
          onClose={handleFormClose}
          onSuccess={() => {
            handleFormClose()
            queryClient.invalidateQueries({ queryKey: ['students'] })
          }}
        />
      )}

      {deletingStudent && (
        <ConfirmDialog
          title="Delete student"
          message={`Delete ${deletingStudent.name} (${deletingStudent.reg_no})? This cannot be undone.`}
          confirmLabel="Delete student"
          variant="danger"
          onConfirm={async () => {
            await studentsService.delete(deletingStudent.id)
            toast.success('Student deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['students'] })
          }}
          onClose={() => setDeletingStudent(null)}
        />
      )}
    </div>
  )
}
