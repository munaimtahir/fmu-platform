/**
 * Assessments CRUD Page
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { assessmentsService } from '@/services'
import { Assessment } from '@/types'
import { AssessmentForm } from './AssessmentForm'

export function AssessmentsPage() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => assessmentsService.getAll({}),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assessmentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
      toast.success('Assessment deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete assessment')
    },
  })

  const handleAdd = () => {
    setEditingAssessment(null)
    setIsFormOpen(true)
  }

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingAssessment(null)
  }

  const columns = useMemo<ColumnDef<Assessment>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'section',
        header: 'Section',
      },
      {
        accessorKey: 'max_score',
        header: 'Max Score',
      },
      {
        accessorKey: 'weight',
        header: 'Weight (%)',
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
          <h1 className="text-3xl font-bold">Assessments</h1>
          <Button onClick={handleAdd}>Add Assessment</Button>
        </div>

        <DataTable
          data={data?.results || []}
          columns={columns}
          isLoading={isLoading}
        />

        {isFormOpen && (
          <AssessmentForm
            assessment={editingAssessment}
            onClose={handleFormClose}
            onSuccess={() => {
              handleFormClose()
              queryClient.invalidateQueries({ queryKey: ['assessments'] })
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
