/**
 * Students CRUD Page
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { studentsService } from '@/services'
import { Student } from '@/types'
import { StudentForm } from './StudentForm'

export function StudentsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  // Fetch students
  const { data, isLoading } = useQuery({
    queryKey: ['students', search],
    queryFn: () => studentsService.getAll({ search }),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete student')
    },
  })

  const handleAdd = () => {
    setEditingStudent(null)
    setIsFormOpen(true)
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingStudent(null)
  }

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        accessorKey: 'reg_no',
        header: 'Registration No',
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'program',
        header: 'Program',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          const variant = status === 'Active' ? 'success' : 
                        status === 'Inactive' ? 'warning' : 
                        status === 'Graduated' ? 'info' : 'danger'
          return <Badge variant={variant as any}>{status}</Badge>
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(row.original)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(row.original.id)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Students</h1>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/admin/students/import')}
              variant="secondary"
            >
              Bulk Upload
            </Button>
            <Button onClick={handleAdd}>Add Student</Button>
          </div>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <DataTable
          data={data?.results || []}
          columns={columns}
          isLoading={isLoading}
        />

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
      </div>
    </DashboardLayout>
  )
}
