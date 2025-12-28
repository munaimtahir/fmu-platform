/**
 * Courses CRUD Page
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { coursesService } from '@/services'
import { Course } from '@/types'
import { CourseForm } from './CourseForm'

export function CoursesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search],
    queryFn: () => coursesService.getAll({ search }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => coursesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      toast.success('Course deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete course')
    },
  })

  const handleAdd = () => {
    setEditingCourse(null)
    setIsFormOpen(true)
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingCourse(null)
  }

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Course Code',
      },
      {
        accessorKey: 'title',
        header: 'Title',
      },
      {
        accessorKey: 'credits',
        header: 'Credits',
      },
      {
        accessorKey: 'program',
        header: 'Program',
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
          <h1 className="text-3xl font-bold">Courses</h1>
          <Button onClick={handleAdd}>Add Course</Button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search courses..."
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
          <CourseForm
            course={editingCourse}
            onClose={handleFormClose}
            onSuccess={() => {
              handleFormClose()
              queryClient.invalidateQueries({ queryKey: ['courses'] })
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
