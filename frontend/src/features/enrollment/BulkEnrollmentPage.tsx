/**
 * Bulk Enrollment Page
 * Allows enrolling multiple students into a section at once
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { sectionsService, studentsService, enrollmentService } from '@/services'
import { Student } from '@/types'

export function BulkEnrollmentPage() {
  const queryClient = useQueryClient()
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set())

  // Fetch sections
  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: () => sectionsService.getAll({}),
  })

  // Fetch students
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsService.getAll({}),
  })

  // Fetch existing enrollments for selected section
  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments', selectedSectionId],
    queryFn: () => enrollmentService.getAll({ section: selectedSectionId! }),
    enabled: !!selectedSectionId,
  })

  // Bulk enrollment mutation
  const bulkEnrollMutation = useMutation({
    mutationFn: ({ sectionId, studentIds }: { sectionId: number; studentIds: number[] }) =>
      enrollmentService.enrollStudentsBulk(sectionId, studentIds),
    onSuccess: (results) => {
      const { successful, failed } = results
      
      if (successful.length > 0) {
        toast.success(`Successfully enrolled ${successful.length} student(s)`)
      }
      
      if (failed.length > 0) {
        toast.error(`Failed to enroll ${failed.length} student(s)`)
        // Show details of failures
        failed.forEach(({ studentId, error }) => {
          const student = studentsData?.results.find(s => s.id === studentId)
          console.error(`Failed to enroll ${student?.name || studentId}: ${error}`)
        })
      }
      
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      setSelectedStudentIds(new Set())
    },
    onError: () => {
      toast.error('Failed to process enrollments')
    },
  })

  const handleEnroll = () => {
    if (!selectedSectionId) {
      toast.error('Please select a section')
      return
    }

    if (selectedStudentIds.size === 0) {
      toast.error('Please select at least one student')
      return
    }

    bulkEnrollMutation.mutate({
      sectionId: selectedSectionId,
      studentIds: Array.from(selectedStudentIds),
    })
  }

  // Get already enrolled student IDs
  const enrolledStudentIds = useMemo(() => {
    if (!enrollmentsData) return new Set<number>()
    return new Set(enrollmentsData.results.map(e => e.student))
  }, [enrollmentsData])

  // Filter out already enrolled students
  const availableStudents = useMemo(() => {
    if (!studentsData) return []
    return studentsData.results.filter(s => !enrolledStudentIds.has(s.id))
  }, [studentsData, enrolledStudentIds])

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedStudentIds.has(row.original.id)}
            onChange={() => {
              const newSet = new Set(selectedStudentIds)
              if (newSet.has(row.original.id)) {
                newSet.delete(row.original.id)
              } else {
                newSet.add(row.original.id)
              }
              setSelectedStudentIds(newSet)
            }}
            className="rounded border-gray-300"
          />
        ),
      },
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
          const variant = status === 'Active' ? 'success' : 'warning'
          return <Badge variant={variant as any}>{status}</Badge>
        },
      },
    ],
    [selectedStudentIds]
  )

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Bulk Enrollment</h1>
          <p className="text-gray-600">Enroll multiple students into a section at once</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Section Selection */}
          <Card className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">1. Select Section</h2>
            {sectionsLoading ? (
              <div className="text-gray-500">Loading sections...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sectionsData?.results.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setSelectedSectionId(section.id)
                      setSelectedStudentIds(new Set())
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSectionId === section.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Section {section.id}</div>
                    <div className="text-sm text-gray-600">
                      Course: {section.course} | Term: {section.term}
                    </div>
                    <div className="text-sm text-gray-600">
                      Teacher: {section.teacher}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Summary */}
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Enrollment Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Selected Section</div>
                <div className="text-2xl font-bold">
                  {selectedSectionId ? `Section ${selectedSectionId}` : 'None'}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Students Selected</div>
                <div className="text-2xl font-bold">{selectedStudentIds.size}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Already Enrolled</div>
                <div className="text-2xl font-bold">{enrolledStudentIds.size}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Available Students</div>
                <div className="text-2xl font-bold">{availableStudents.length}</div>
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={handleEnroll}
                disabled={
                  !selectedSectionId ||
                  selectedStudentIds.size === 0 ||
                  bulkEnrollMutation.isPending
                }
                className="w-full"
              >
                {bulkEnrollMutation.isPending
                  ? 'Enrolling...'
                  : `Enroll ${selectedStudentIds.size} Student(s)`}
              </Button>
            </div>
          </Card>
        </div>

        {/* Student Selection Table */}
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">2. Select Students</h2>
            {!selectedSectionId && (
              <p className="text-sm text-gray-600 mt-1">Please select a section first</p>
            )}
            {selectedSectionId && enrolledStudentIds.size > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {enrolledStudentIds.size} student(s) already enrolled in this section
              </p>
            )}
          </div>

          <DataTable
            data={availableStudents}
            columns={columns}
            isLoading={studentsLoading}
            enableRowSelection={false}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}
