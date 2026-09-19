import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PageShell } from '@/components/shared/PageShell'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Can } from '@/components/shared/Can'
import { apiErrorMessage } from '@/lib/apiErrors'
import { learningService, type LearningMaterial, type MaterialStatus } from '@/services/learning'
import { MaterialForm } from './MaterialForm'
import { AudienceDialog } from './AudienceDialog'

const statuses: Array<{ value: MaterialStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' }, { value: 'DRAFT', label: 'Drafts' }, { value: 'PUBLISHED', label: 'Published' }, { value: 'ARCHIVED', label: 'Archived' },
]

export const LearningMaterialsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<MaterialStatus | ''>('')
  const [editing, setEditing] = useState<LearningMaterial | 'new' | null>(null)
  const [audience, setAudience] = useState<LearningMaterial | null>(null)
  const [pending, setPending] = useState<{ material: LearningMaterial; action: 'publish' | 'archive' | 'delete' } | null>(null)
  const query = useQuery({ queryKey: ['learning-materials', status], queryFn: () => learningService.listMaterials({ status: status || undefined }) })
  const mutation = useMutation({
    mutationFn: async ({ material, action }: { material: LearningMaterial; action: 'publish' | 'archive' | 'delete' }) => { if (action === 'publish') await learningService.publish(material.id); else if (action === 'archive') await learningService.archive(material.id); else await learningService.deleteMaterial(material.id) },
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: ['learning-materials'] }); toast.success(`Material ${variables.action}${variables.action === 'delete' ? 'd' : 'ed'}`) },
  })
  if (query.isLoading) return <LoadingState message="Loading learning materials..." />
  if (query.isError) return <ErrorState message={apiErrorMessage(query.error, 'Could not load learning materials.')} onRetry={() => query.refetch()} />
  const materials = query.data?.results ?? []
  return <PageShell title="Learning Materials" description="Create, schedule, publish and archive learning materials." actions={<Can tasks={['learning.materials.create']}><Button onClick={() => setEditing('new')}>New material</Button></Can>}>
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Material status">{statuses.map((option) => <Button key={option.value} size="sm" variant={status === option.value ? 'primary' : 'secondary'} onClick={() => setStatus(option.value)}>{option.label}</Button>)}</div>
    {materials.length === 0 ? <EmptyState icon="📚" title="No materials found" description="Create a draft to begin sharing learning content." /> : <div className="space-y-3">{materials.map((material) => <div key={material.id} className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-elevation-1">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-h4">{material.title}</h2><p className="mt-1 text-sm text-ink-secondary">{material.kind} · {material.description || 'No description'}</p></div><Badge variant={material.status === 'PUBLISHED' ? 'success' : material.status === 'ARCHIVED' ? 'secondary' : 'warning'}>{material.status}</Badge></div>
      <div className="mt-4 flex flex-wrap gap-2"><Can tasks={['learning.materials.update']}><Button size="sm" variant="secondary" onClick={() => setEditing(material)}>Edit</Button></Can><Can tasks={['learning.materials.manage_audience']}><Button size="sm" variant="secondary" onClick={() => setAudience(material)}>Audience</Button></Can><Can tasks={['learning.materials.publish']}><Button size="sm" disabled={material.status === 'PUBLISHED'} onClick={() => setPending({ material, action: 'publish' })}>Publish</Button></Can><Can tasks={['learning.materials.archive']}><Button size="sm" variant="secondary" disabled={material.status === 'ARCHIVED'} onClick={() => setPending({ material, action: 'archive' })}>Archive</Button></Can><Can tasks={['learning.materials.delete']}><Button size="sm" variant="danger" onClick={() => setPending({ material, action: 'delete' })}>Delete</Button></Can></div>
    </div>)}</div>}
    {editing && <MaterialForm material={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    {audience && <AudienceDialog material={audience} onClose={() => setAudience(null)} />}
    {pending && <ConfirmDialog title={`${pending.action[0].toUpperCase()}${pending.action.slice(1)} material`} variant={pending.action === 'delete' ? 'danger' : 'primary'} message={`Are you sure you want to ${pending.action} “${pending.material.title}”?`} confirmLabel={pending.action} onClose={() => setPending(null)} onConfirm={async () => { await mutation.mutateAsync(pending); setPending(null) }} />}
  </PageShell>
}
