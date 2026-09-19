import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { PageShell } from '@/components/shared/PageShell'
import { ErrorState } from '@/components/shared/ErrorState'
import { Can } from '@/components/shared/Can'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { peopleService, type PersonListItem } from '@/services/people'
import { PersonForm } from './PersonForm'

const PAGE_SIZE = 50

export const PeopleListPage: React.FC = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['people', debouncedSearch, pageIndex],
    queryFn: () => peopleService.listPersons({ page: pageIndex + 1, search: debouncedSearch || undefined }),
  })

  const columns = useMemo<ColumnDef<PersonListItem>[]>(
    () => [
      { accessorKey: 'full_name', header: 'Name' },
      { accessorKey: 'gender', header: 'Gender', cell: ({ row }) => row.original.gender || '—' },
      { accessorKey: 'date_of_birth', header: 'Date of birth', cell: ({ row }) => row.original.date_of_birth || '—' },
      {
        accessorKey: 'created_at',
        header: 'Added',
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
      },
    ],
    []
  )

  return (
    <PageShell
      title="People"
      description="Identity records shared by students, faculty and staff."
      actions={
        <Can tasks={['people.persons.create']}>
          <Button onClick={() => setIsCreating(true)}>Add person</Button>
        </Can>
      }
    >
      <div className="mb-4 max-w-sm">
        <Input
          aria-label="Search people"
          placeholder="Search by name or national ID..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPageIndex(0)
          }}
        />
      </div>

      {isError ? (
        <ErrorState message={apiErrorMessage(error, 'Could not load people.')} onRetry={() => refetch()} />
      ) : (
        <DataTable
          data={data?.results ?? []}
          columns={columns}
          isLoading={isLoading}
          enableFiltering={false}
          onRowClick={(row) => navigate(`/people/${row.id}`)}
          manualPagination
          pageSize={PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE))}
          totalCount={data?.count ?? 0}
          pagination={{ pageIndex, pageSize: PAGE_SIZE }}
          onPaginationChange={(next) => setPageIndex(next.pageIndex)}
        />
      )}

      {isCreating && (
        <PersonForm
          onClose={() => setIsCreating(false)}
          onSaved={(person) => {
            setIsCreating(false)
            navigate(`/people/${person.id}`)
          }}
        />
      )}
    </PageShell>
  )
}
