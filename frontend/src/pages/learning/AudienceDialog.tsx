import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LabeledSelect } from '@/components/shared/LabeledSelect'
import { apiErrorMessage } from '@/lib/apiErrors'
import { academicsService } from '@/services/academics'
import { batchesService } from '@/services/batches'
import { coursesService } from '@/services/courses'
import { programsService } from '@/services/programs'
import { sectionsService } from '@/services/sections'
import { learningService, type AudienceScope, type LearningMaterial, type MaterialAudience } from '@/services/learning'

type ScopeKey = 'program' | 'batch' | 'term' | 'course' | 'section'
const SCOPE_KEYS: ScopeKey[] = ['program', 'batch', 'term', 'course', 'section']

/** Options are loaded once per dialog; audiences reference records by ID. */
function useScopeOptions() {
  const programs = useQuery({ queryKey: ['audience-programs'], queryFn: () => programsService.getAll({ is_active: true }) })
  const batches = useQuery({ queryKey: ['audience-batches'], queryFn: () => batchesService.getAll() })
  const terms = useQuery({ queryKey: ['audience-terms'], queryFn: () => academicsService.getAcademicPeriods() })
  const courses = useQuery({ queryKey: ['audience-courses'], queryFn: () => coursesService.getAll() })
  const sections = useQuery({ queryKey: ['audience-sections'], queryFn: () => sectionsService.list() })

  const maps: Record<ScopeKey, Array<{ value: number; label: string }>> = {
    program: (programs.data?.results ?? []).map((p) => ({ value: p.id, label: p.name })),
    batch: (batches.data?.results ?? []).map((b) => ({ value: b.id, label: b.program_name ? `${b.name} (${b.program_name})` : b.name })),
    term: (terms.data ?? []).map((t) => ({ value: t.id, label: t.name })),
    course: (courses.data?.results ?? []).map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` })),
    section: (sections.data?.results ?? []).map((s) => ({ value: s.id, label: `${s.course_code} ${s.name} (${s.academic_period_name})` })),
  }
  return { maps, isLoading: [programs, batches, terms, courses, sections].some((q) => q.isLoading) }
}

const SCOPE_LABEL: Record<ScopeKey, string> = {
  program: 'Program',
  batch: 'Batch',
  term: 'Academic period',
  course: 'Course',
  section: 'Section',
}

interface AudienceDialogProps {
  material: LearningMaterial
  onClose: () => void
}

export const AudienceDialog: React.FC<AudienceDialogProps> = ({ material, onClose }) => {
  const queryClient = useQueryClient()
  const { maps, isLoading: optionsLoading } = useScopeOptions()
  const [scope, setScope] = useState<Record<ScopeKey, string>>({ program: '', batch: '', term: '', course: '', section: '' })
  const [removing, setRemoving] = useState<MaterialAudience | null>(null)
  const [error, setError] = useState<string | null>(null)

  const audiencesKey = ['learning-audiences', material.id]
  const { data: audiences, isLoading } = useQuery({
    queryKey: audiencesKey,
    queryFn: () => learningService.listAudiences(material.id),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: audiencesKey })
    queryClient.invalidateQueries({ queryKey: ['learning-materials'] })
  }

  const add = useMutation({
    mutationFn: () => {
      const payload: AudienceScope = {}
      for (const key of SCOPE_KEYS) if (scope[key]) payload[key] = Number(scope[key])
      return learningService.addAudience(material.id, payload)
    },
    onSuccess: () => {
      toast.success('Audience added')
      setScope({ program: '', batch: '', term: '', course: '', section: '' })
      refresh()
    },
    onError: (err) => setError(apiErrorMessage(err)),
  })

  const describe = (audience: MaterialAudience) => {
    const parts = SCOPE_KEYS.filter((key) => audience[key] !== null).map((key) => {
      const label = maps[key].find((option) => option.value === audience[key])?.label
      return `${SCOPE_LABEL[key]}: ${label ?? `#${audience[key]}`}`
    })
    return parts.join(' · ') || 'No scope'
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!SCOPE_KEYS.some((key) => scope[key])) {
      setError('Choose at least one scope (program, batch, period, course or section).')
      return
    }
    add.mutate()
  }

  return (
    <Modal title={`Audience: ${material.title}`} onClose={onClose} size="lg">
      <div className="space-y-6">
        <section aria-label="Current audiences">
          <h3 className="text-sm font-medium text-ink-primary mb-2">Who can see this material</h3>
          {isLoading ? (
            <Spinner />
          ) : audiences && audiences.length > 0 ? (
            <ul className="divide-y divide-surface-border">
              {audiences.map((audience) => (
                <li key={audience.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-ink-primary">{describe(audience)}</span>
                  <Can tasks={['learning.materials.manage_audience']}>
                    <Button size="sm" variant="danger" onClick={() => setRemoving(audience)} aria-label={`Remove audience ${audience.id}`}>
                      Remove
                    </Button>
                  </Can>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="👥" title="No audience yet" description="Students only see a published material once an audience matches them." />
          )}
        </section>

        <Can tasks={['learning.materials.manage_audience']}>
          <form onSubmit={submit} className="space-y-3" noValidate aria-label="Add audience">
            <h3 className="text-sm font-medium text-ink-primary">Add an audience</h3>
            <p className="text-sm text-ink-muted">Fill in one or more fields; a student matches when all chosen fields match.</p>
            {error && <Alert variant="error">{error}</Alert>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SCOPE_KEYS.map((key) => (
                <LabeledSelect
                  key={key}
                  id={`audience-${key}`}
                  label={SCOPE_LABEL[key]}
                  value={scope[key]}
                  placeholder="Any"
                  disabled={optionsLoading}
                  options={maps[key]}
                  onChange={(value) => setScope((prev) => ({ ...prev, [key]: value }))}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={add.isPending}>
                Add audience
              </Button>
            </div>
          </form>
        </Can>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {removing && (
        <ConfirmDialog
          title="Remove audience"
          message="Students matched only by this audience will no longer see the material."
          confirmLabel="Remove"
          variant="danger"
          onConfirm={async () => {
            await learningService.removeAudience(removing.id)
            toast.success('Audience removed')
            refresh()
          }}
          onClose={() => setRemoving(null)}
        />
      )}
    </Modal>
  )
}
