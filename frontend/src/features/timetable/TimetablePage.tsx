/**
 * Timetable CRUD Page
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { sessionsService, academicsService } from '@/services'
import { Session } from '@/types'
import { SessionForm } from './SessionForm'

export function TimetablePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [filterAcademicPeriod, setFilterAcademicPeriod] = useState<string>('')
  const [filterGroup, setFilterGroup] = useState<string>('')
  const [filterDepartment, setFilterDepartment] = useState<string>('')

  // Fetch dropdown data
  const { data: academicPeriods } = useQuery({
    queryKey: ['academicPeriods'],
    queryFn: () => academicsService.getAcademicPeriods(),
  })

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => academicsService.getGroups(),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => academicsService.getDepartments(),
  })

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      ordering: 'starts_at',
    }
    if (search) {
      params.search = search
    }
    if (filterAcademicPeriod) {
      params.academic_period = parseInt(filterAcademicPeriod, 10)
    }
    if (filterGroup) {
      params.group = parseInt(filterGroup, 10)
    }
    if (filterDepartment) {
      params.department = parseInt(filterDepartment, 10)
    }
    return params
  }, [search, filterAcademicPeriod, filterGroup, filterDepartment])

  // Fetch sessions
  const { data, isLoading } = useQuery({
    queryKey: ['sessions', queryParams],
    queryFn: () => sessionsService.getAll(queryParams),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => sessionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete session')
    },
  })

  const handleAdd = () => {
    setEditingSession(null)
    setIsFormOpen(true)
  }

  const handleEdit = (session: Session) => {
    setEditingSession(session)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingSession(null)
  }

  const columns = useMemo<ColumnDef<Session>[]>(
    () => [
      {
        accessorKey: 'academic_period_name',
        header: 'Academic Period',
        cell: ({ row }) => row.original.academic_period_name || `Period ${row.original.academic_period}`,
      },
      {
        accessorKey: 'group_name',
        header: 'Group',
        cell: ({ row }) => row.original.group_name || `Group ${row.original.group}`,
      },
      {
        accessorKey: 'department_name',
        header: 'Department',
        cell: ({ row }) => row.original.department_name || `Dept ${row.original.department}`,
      },
      {
        accessorKey: 'faculty_name',
        header: 'Faculty',
        cell: ({ row }) => row.original.faculty_name || `Faculty ${row.original.faculty}`,
      },
      {
        accessorKey: 'starts_at',
        header: 'Start Time',
        cell: ({ row }) => {
          const date = new Date(row.original.starts_at)
          return format(date, 'MMM dd, yyyy HH:mm')
        },
      },
      {
        accessorKey: 'ends_at',
        header: 'End Time',
        cell: ({ row }) => {
          const date = new Date(row.original.ends_at)
          return format(date, 'MMM dd, yyyy HH:mm')
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

  const academicPeriodOptions = [
    { value: '', label: 'All Academic Periods' },
    ...(academicPeriods || []).map((ap) => ({
      value: String(ap.id),
      label: ap.name,
    })),
  ]

  const groupOptions = [
    { value: '', label: 'All Groups' },
    ...(groups || []).map((g) => ({
      value: String(g.id),
      label: g.batch_name ? `${g.name} (${g.batch_name})` : g.name,
    })),
  ]

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...(departments || []).map((d) => ({
      value: String(d.id),
      label: d.code ? `${d.code} - ${d.name}` : d.name,
    })),
  ]

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Timetable</h1>
          <Button onClick={handleAdd}>Add Session</Button>
        </div>

        <div className="mb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:col-span-1"
            />
            <Select
              options={academicPeriodOptions}
              value={filterAcademicPeriod}
              onChange={setFilterAcademicPeriod}
              placeholder="Filter by academic period..."
              className="md:col-span-1"
            />
            <Select
              options={groupOptions}
              value={filterGroup}
              onChange={setFilterGroup}
              placeholder="Filter by group..."
              className="md:col-span-1"
            />
            <Select
              options={departmentOptions}
              value={filterDepartment}
              onChange={setFilterDepartment}
              placeholder="Filter by department..."
              className="md:col-span-1"
            />
          </div>
        </div>

        <DataTable
          data={data?.results || []}
          columns={columns}
          isLoading={isLoading}
        />

        {isFormOpen && (
          <SessionForm
            session={editingSession}
            onClose={handleFormClose}
            onSuccess={() => {
              handleFormClose()
              queryClient.invalidateQueries({ queryKey: ['sessions'] })
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
