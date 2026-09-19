import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { groupTasksByModule, rbacService } from '@/services/rbac'

export const TASKS_KEY = ['rbac-tasks']

/** Read-only browser of permission tasks, grouped by module. */
export const TasksTab: React.FC = () => {
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 200)
  const { data, isLoading, error, refetch } = useQuery({ queryKey: TASKS_KEY, queryFn: () => rbacService.listTasks() })

  const groups = useMemo(() => {
    const needle = debounced.trim().toLowerCase()
    const tasks = (data ?? []).filter(
      (task) =>
        !needle ||
        task.code.toLowerCase().includes(needle) ||
        task.name.toLowerCase().includes(needle) ||
        task.description.toLowerCase().includes(needle)
    )
    return groupTasksByModule(tasks)
  }, [data, debounced])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={apiErrorMessage(error, 'Failed to load permission tasks')} onRetry={() => refetch()} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          aria-label="Search tasks"
          placeholder="Search by code or name..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-72"
        />
        <span className="text-sm text-ink-secondary">{data?.length ?? 0} tasks</span>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="🔎" title="No tasks match" description="Try a different search." />
      ) : (
        groups.map((group) => (
          <Card key={group.module}>
            <div className="p-4" data-testid={`task-group-${group.module}`}>
              <h3 className="text-h4 mb-3 capitalize">
                {group.module} <span className="text-sm text-ink-muted">({group.tasks.length})</span>
              </h3>
              <ul className="divide-y">
                {group.tasks.map((task) => (
                  <li key={task.id} className="py-2 flex flex-wrap justify-between gap-2">
                    <code className="text-sm">{task.code}</code>
                    <span className="text-sm text-ink-secondary">{task.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
