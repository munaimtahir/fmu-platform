import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { Program } from '@/services/academicsNew'
import type { Batch } from '@/services/batches'
import type { RequirementDefinition } from '@/services/compliance'
import { allPages } from '@/lib/allPages'
import { complianceService, type RequirementScopeType } from '@/services/compliance'
import { apiErrorMessage } from '@/lib/apiErrors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { LoadingState } from '@/components/shared/LoadingState'
import { Can } from '@/components/shared/Can'
import { ErrorState } from '@/components/shared/ErrorState'

export function OnboardingRulesTab() {
  const client = useQueryClient()
  const [definition, setDefinition] = useState('')
  const [scopeType, setScopeType] = useState<RequirementScopeType>('global')
  const [program, setProgram] = useState('')
  const [batch, setBatch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const definitions = useQuery({ queryKey: ['compliance', 'definitions', 'all'], queryFn: async () => ({ results: await allPages<RequirementDefinition>('/api/compliance/definitions/') }) })
  const scopes = useQuery({ queryKey: ['compliance', 'scopes'], queryFn: complianceService.listScopes })
  const programs = useQuery({ queryKey: ['programs', 'onboarding-scopes'], queryFn: () => allPages<Program>('/api/academics/programs/', { is_active: true }) })
  const batches = useQuery({ queryKey: ['batches', 'onboarding-scopes'], queryFn: async () => ({ results: await allPages<Batch>('/api/academics/batches/', { is_active: true }) }) })

  const create = useMutation({
    mutationFn: () => complianceService.createScope({
      definition: Number(definition), scope_type: scopeType,
      program: scopeType === 'program' ? Number(program) : null,
      batch: scopeType === 'batch' ? Number(batch) : null,
      is_active: true,
    }),
    onSuccess: () => { toast.success('Onboarding rule added'); setError(null); client.invalidateQueries({ queryKey: ['compliance'] }) },
    onError: (err) => setError(apiErrorMessage(err, 'Could not add onboarding rule.')),
  })
  const archive = useMutation({
    mutationFn: complianceService.archiveScope,
    onSuccess: () => { toast.success('Onboarding rule archived'); client.invalidateQueries({ queryKey: ['compliance'] }) },
    onError: (err) => setError(apiErrorMessage(err, 'Could not archive onboarding rule.')),
  })
  const reactivate = useMutation({
    mutationFn: (id: number) => complianceService.updateScope(id, { is_active: true }),
    onSuccess: () => { toast.success('Onboarding rule reactivated'); client.invalidateQueries({ queryKey: ['compliance'] }) },
    onError: (err) => setError(apiErrorMessage(err, 'Could not reactivate onboarding rule.')),
  })
  if (definitions.isLoading || scopes.isLoading || programs.isLoading || batches.isLoading) return <LoadingState message="Loading onboarding rules..." />
  if (definitions.isError || scopes.isError || programs.isError || batches.isError) return <ErrorState message="Could not load onboarding rules and academic choices." onRetry={() => { definitions.refetch(); scopes.refetch(); programs.refetch(); batches.refetch() }} />
  const eligible = (definitions.data?.results ?? []).filter((item) => item.is_active && item.is_onboarding_required && item.requirement_type === 'document')
  const definitionName = (id: number) => definitions.data?.results.find((item) => item.id === id)?.title ?? `Definition #${id}`
  const programName = (id: number | null) => programs.data?.find((item) => item.id === id)?.name
  const batchName = (id: number | null) => batches.data?.results?.find((item) => item.id === id)?.name
  const valid = !!definition && (scopeType === 'global' || (scopeType === 'program' && !!program) || (scopeType === 'batch' && !!batch))
  return <div className="space-y-4">
    {error && <Alert variant="error">{error}</Alert>}
    <Can tasks={['compliance.definitions.create']}><Card>
      <h2 className="text-h4 mb-4">Add onboarding requirement scope</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <LabeledSelect id="scope-definition" label="Document requirement" value={definition} placeholder="Select requirement" options={eligible.map((item) => ({ value: item.id, label: item.title }))} onChange={setDefinition} />
        <LabeledSelect id="scope-type" label="Applies to" value={scopeType} options={[{ value: 'global', label: 'All students' }, { value: 'program', label: 'Program' }, { value: 'batch', label: 'Batch' }]} onChange={(value) => setScopeType(value as RequirementScopeType)} />
        {scopeType === 'program' && <LabeledSelect id="scope-program" label="Program" value={program} placeholder="Select program" options={(programs.data ?? []).map((item) => ({ value: item.id, label: item.name }))} onChange={setProgram} />}
        {scopeType === 'batch' && <LabeledSelect id="scope-batch" label="Batch" value={batch} placeholder="Select batch" options={(batches.data?.results ?? []).map((item) => ({ value: item.id, label: `${item.program_name ?? ''} ${item.name}`.trim() }))} onChange={setBatch} />}
      </div>
      <div className="mt-4 flex justify-end"><Button disabled={!valid} isLoading={create.isPending} onClick={() => create.mutate()}>Add rule</Button></div>
    </Card></Can>
    <Card>
      {(scopes.data ?? []).length ? <ul className="divide-y divide-surface-border">{(scopes.data ?? []).map((scope) => <li key={scope.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{definitionName(scope.definition)}</p><p className="text-sm text-ink-muted">{scope.scope_type === 'global' ? 'All students' : scope.scope_type === 'program' ? `Program: ${programName(scope.program) ?? scope.program}` : `Batch: ${batchName(scope.batch) ?? scope.batch}`}{!scope.is_active ? ' · Archived' : ''}</p></div>{scope.is_active ? <Can tasks={['compliance.definitions.delete']}><Button size="sm" variant="danger" disabled={archive.isPending} onClick={() => archive.mutate(scope.id)}>Archive</Button></Can> : <Can tasks={['compliance.definitions.update']}><Button size="sm" variant="secondary" disabled={reactivate.isPending} onClick={() => reactivate.mutate(scope.id)}>Reactivate</Button></Can>}</li>)}</ul> : <EmptyState icon="📎" title="No onboarding rules" description="Add a document scope to assign it automatically during onboarding." />}
    </Card>
  </div>
}
