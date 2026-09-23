/**
 * Students directory: server-side search and paging, row links to the student detail page,
 * and onboarding visibility. Provisioning is handled only by the import workflow.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { ErrorState } from '@/components/shared/ErrorState'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { studentsService } from '@/services'
import { Student } from '@/types'
import { Select } from '@/components/ui/Select'
import { Can } from '@/components/shared/Can'

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
  const [search, setSearch] = useState('')
  const [onboardingState, setOnboardingState] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['students', debouncedSearch, onboardingState, pageIndex],
    queryFn: () => studentsService.getAll({
      page: pageIndex + 1,
      search: debouncedSearch || undefined,
      onboarding_state: onboardingState || undefined,
    }),
  })

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
        id: 'onboarding',
        header: 'Onboarding',
        cell: ({ row }) => (
          <div>
            <Badge variant={row.original.onboarding?.primary_state === 'complete' ? 'success' : 'warning'}>
              {row.original.onboarding?.primary_state.replace(/_/g, ' ') ?? 'Not provisioned'}
            </Badge>
            {row.original.onboarding && (
              <div className="text-xs text-ink-muted mt-1">{row.original.onboarding.profile_completion_percentage}% profile</div>
            )}
          </div>
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
          <Button onClick={() => navigate('/system/students/import')} variant="secondary">Provision students</Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
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
        <Can tasks={['students.onboarding.view']}><Select
          label="Onboarding state"
          value={onboardingState}
          onChange={(value) => { setOnboardingState(value); setPageIndex(0) }}
          options={[
            { value: '', label: 'All onboarding states' },
            { value: 'password_change_required', label: 'Password change required' },
            { value: 'profile_incomplete', label: 'Profile incomplete' },
            { value: 'profile_complete', label: 'Profile complete' },
            { value: 'documents_pending', label: 'Documents pending' },
            { value: 'complete', label: 'Onboarding complete' },
          ]}
        /></Can>
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
    </div>
  )
}
