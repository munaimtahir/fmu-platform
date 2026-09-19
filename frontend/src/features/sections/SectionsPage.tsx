/**
 * Sections list: search, open detail, and (task-gated) create / edit / delete.
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorState } from '@/components/shared/ErrorState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { pageCount } from '@/lib/pagination'
import { sectionsService, type AcademicSection } from '@/services/sections'
import { SectionForm } from './SectionForm'

const PAGE_SIZE = 50

export function SectionsPage() {
  const queryClient = useQueryClient()
  const { can } = useCapabilities()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<AcademicSection | null>(null)
  const [deleting, setDeleting] = useState<AcademicSection | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [page, setPage] = useState(1)

  const canCreate = can('academics.sections.create')
  const canUpdate = can('academics.sections.update')
  const canDelete = can('academics.sections.delete')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sections', page, debouncedSearch],
    queryFn: () => sectionsService.list({ page, search: debouncedSearch || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sectionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      toast.success('Section deleted successfully')
    },
  })

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingSection(null)
  }

  const columns = useMemo<ColumnDef<AcademicSection>[]>(
    () => [
      {
        id: 'course',
        header: 'Course',
        cell: ({ row }) => (
          <Link className="text-primary-600 hover:underline" to={`/sections/${row.original.id}`}>
            {row.original.course_code} {row.original.course_name}
          </Link>
        ),
      },
      { accessorKey: 'name', header: 'Section' },
      { accessorKey: 'academic_period_name', header: 'Academic Period' },
      { id: 'group', header: 'Group', cell: ({ row }) => row.original.group_name ?? '-' },
      { id: 'faculty', header: 'Faculty', cell: ({ row }) => row.original.faculty_username ?? '-' },
      {
        id: 'enrolment',
        header: 'Enrolled / Capacity',
        cell: ({ row }) => `${row.original.enrolled_count} / ${row.original.capacity}`,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <Link to={`/sections/${row.original.id}`}>
              <Button size="sm" variant="secondary">
                View
              </Button>
            </Link>
            {canUpdate && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingSection(row.original)
                  setIsFormOpen(true)
                }}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="danger" onClick={() => setDeleting(row.original)}>
                Delete
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canUpdate, canDelete]
  )

  const pages = pageCount(data?.count ?? 0, PAGE_SIZE)

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-h1">Sections</h1>
        <div className="flex gap-2">
          <Input
            aria-label="Search sections"
            placeholder="Search by course or section..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-64"
          />
          {canCreate && (
            <Button
              onClick={() => {
                setEditingSection(null)
                setIsFormOpen(true)
              }}
            >
              Add Section
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState message={apiErrorMessage(error, 'Failed to load sections')} onRetry={() => refetch()} />
      ) : (
        <DataTable data={data?.results || []} columns={columns} isLoading={isLoading} />
      )}

      {pages > 1 && (
        <div className="flex items-center justify-end gap-3 mt-4 text-sm">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {pages}
          </span>
          <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

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

      {deleting && (
        <ConfirmDialog
          title="Delete section"
          message={`Delete ${deleting.course_code} section ${deleting.name} (${deleting.academic_period_name})? This cannot be undone.`}
          confirmLabel="Delete section"
          variant="danger"
          onConfirm={() => deleteMutation.mutateAsync(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
