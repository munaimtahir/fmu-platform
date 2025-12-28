/**
 * Sections CRUD Page
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { sectionsService } from '@/services'
import { Section } from '@/types'
import { SectionForm } from './SectionForm'

export function SectionsPage() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsService.getAll({}),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sectionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      toast.success('Section deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete section')
    },
  })

  const handleAdd = () => {
    setEditingSection(null)
    setIsFormOpen(true)
  }

  const handleEdit = (section: Section) => {
    setEditingSection(section)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingSection(null)
  }

  const columns = useMemo<ColumnDef<Section>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
      },
      {
        accessorKey: 'course',
        header: 'Course',
      },
      {
        accessorKey: 'term',
        header: 'Term',
      },
      {
        accessorKey: 'teacher',
        header: 'Teacher',
      },
      {
        accessorKey: 'capacity',
        header: 'Capacity',
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
          <h1 className="text-3xl font-bold">Sections</h1>
          <Button onClick={handleAdd}>Add Section</Button>
        </div>

        <DataTable
          data={data?.results || []}
          columns={columns}
          isLoading={isLoading}
        />

        {isFormOpen && (
          <SectionForm
            section={editingSection}
            onClose={handleFormClose}
            onSuccess={() => {
              handleFormClose()
              queryClient.invalidateQueries({ queryKey: ['sections'] })
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
