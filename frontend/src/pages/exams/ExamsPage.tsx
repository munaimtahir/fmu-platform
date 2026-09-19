import React, { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import type { PaginationState } from '@/components/ui/DataTable/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { pageCount as computePageCount } from '@/lib/pagination'
import { examsService, PASSING_MODE_LABELS, type Exam } from '@/services/exams'
import { ExamComponentsModal } from './ExamComponentsModal'
import { ExamFormModal } from './ExamFormModal'

const PAGE_SIZE = 50

const PUBLISHED_OPTIONS = [
  { value: '', label: 'All exams' },
  { value: 'true', label: 'Published' },
  { value: 'false', label: 'Not published' },
]

export const ExamsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [published, setPublished] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const debouncedSearch = useDebouncedValue(search)

  const [formExam, setFormExam] = useState<Exam | 'new' | null>(null)
  const [componentsExam, setComponentsExam] = useState<Exam | null>(null)
  const [publishExam, setPublishExam] = useState<Exam | null>(null)
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['exams', debouncedSearch, published, pagination.pageIndex],
    queryFn: () =>
      examsService.getAll({
        page: pagination.pageIndex + 1,
        search: debouncedSearch || undefined,
        published: published === '' ? undefined : published === 'true',
      }),
  })

  const exams = data?.results ?? []
  const totalCount = data?.count ?? 0

  const columns = useMemo<ColumnDef<Exam>[]>(
    () => [
      { accessorKey: 'title', header: 'Exam' },
      {
        accessorKey: 'exam_type',
        header: 'Type',
        cell: ({ row }) => row.original.exam_type || '-',
      },
      {
        accessorKey: 'academic_period_name',
        header: 'Academic period',
        cell: ({ row }) => row.original.academic_period_name || '-',
      },
      {
        accessorKey: 'scheduled_at',
        header: 'Scheduled',
        cell: ({ row }) =>
          row.original.scheduled_at ? new Date(row.original.scheduled_at).toLocaleString() : 'Not scheduled',
      },
      {
        accessorKey: 'passing_mode',
        header: 'Passing mode',
        cell: ({ row }) => PASSING_MODE_LABELS[row.original.passing_mode] ?? row.original.passing_mode,
      },
      {
        id: 'components',
        header: 'Components',
        cell: ({ row }) => row.original.components?.length ?? 0,
      },
      {
        accessorKey: 'published',
        header: 'Status',
        cell: ({ row }) =>
          row.original.published ? <Badge variant="success">Published</Badge> : <Badge variant="warning">Not published</Badge>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const exam = row.original
          return (
            <div className="flex flex-wrap gap-2">
              <Can tasks={['exams.components.view']}>
                <Button size="sm" variant="secondary" onClick={() => setComponentsExam(exam)}>
                  Components
                </Button>
              </Can>
              <Can tasks={['exams.exams.update']}>
                <Button size="sm" variant="secondary" onClick={() => setFormExam(exam)}>
                  Edit
                </Button>
              </Can>
              <Can tasks={['exams.exams.publish']}>
                <Button size="sm" variant="primary" disabled={exam.published} onClick={() => setPublishExam(exam)}>
                  Publish
                </Button>
              </Can>
              <Can tasks={['exams.exams.delete']}>
                <Button size="sm" variant="danger" onClick={() => setDeleteExam(exam)}>
                  Delete
                </Button>
              </Can>
            </div>
          )
        },
      },
    ],
    []
  )

  const resetToFirstPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }))

  return (
    <PageShell
      title="Exams"
      description="Manage exams, their components and publication"
      actions={
        <div className="flex flex-wrap items-end gap-3">
          <Input
            aria-label="Search exams"
            placeholder="Search exams..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              resetToFirstPage()
            }}
            className="w-64"
          />
          <Select
            label="Publication"
            searchable={false}
            options={PUBLISHED_OPTIONS}
            value={published}
            onChange={(value) => {
              setPublished(value)
              resetToFirstPage()
            }}
          />
          <Can tasks={['exams.exams.create']}>
            <Button onClick={() => setFormExam('new')}>New exam</Button>
          </Can>
        </div>
      }
    >
      {error ? (
        <ErrorState message="Failed to load exams" onRetry={() => refetch()} />
      ) : !isLoading && exams.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No exams found"
          description={search || published ? 'Try adjusting your search or filter' : 'No exams have been created yet'}
        />
      ) : (
        <DataTable
          data={exams}
          columns={columns}
          isLoading={isLoading}
          enableFiltering={false}
          manualPagination
          pageCount={computePageCount(totalCount, PAGE_SIZE)}
          totalCount={totalCount}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      )}

      {formExam && <ExamFormModal exam={formExam === 'new' ? null : formExam} onClose={() => setFormExam(null)} />}
      {componentsExam && <ExamComponentsModal exam={componentsExam} onClose={() => setComponentsExam(null)} />}

      {publishExam && (
        <ConfirmDialog
          title="Publish exam"
          confirmLabel="Publish exam"
          message={
            <>
              Publish <strong>{publishExam.title}</strong>? Publishing makes the exam live and increases its
              version. {publishExam.components?.length ? '' : 'This exam has no components yet.'}
            </>
          }
          onConfirm={async () => {
            await examsService.publish(publishExam.id)
            queryClient.invalidateQueries({ queryKey: ['exams'] })
            toast.success('Exam published')
          }}
          onClose={() => setPublishExam(null)}
        />
      )}

      {deleteExam && (
        <ConfirmDialog
          title="Delete exam"
          variant="danger"
          confirmLabel="Delete exam"
          message={
            <>
              Delete <strong>{deleteExam.title}</strong> and all of its components? Exams that already have results
              cannot be deleted.
            </>
          }
          onConfirm={async () => {
            await examsService.remove(deleteExam.id)
            queryClient.invalidateQueries({ queryKey: ['exams'] })
            toast.success('Exam deleted')
          }}
          onClose={() => setDeleteExam(null)}
        />
      )}
    </PageShell>
  )
}
