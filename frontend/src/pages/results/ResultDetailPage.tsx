import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { PageShell } from '@/components/shared/PageShell'
import { Can } from '@/components/shared/Can'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { apiErrorMessage } from '@/lib/apiErrors'
import { resultsService } from '@/services/results'
import { CorrectionRequestModal } from './CorrectionRequestModal'
import { ResultWorkflowActions } from './ResultWorkflowActions'

const OUTCOME_VARIANT = { PASS: 'success', FAIL: 'danger', PENDING: 'warning', NA: 'default' } as const

export const ResultDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const resultId = Number(id)
  const [showCorrection, setShowCorrection] = useState(false)

  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['result', resultId],
    queryFn: () => resultsService.getById(resultId),
    enabled: Number.isInteger(resultId) && resultId > 0,
  })

  if (isLoading) {
    return (
      <PageShell title="Result">
        <LoadingState />
      </PageShell>
    )
  }

  if (error || !result) {
    return (
      <PageShell title="Result">
        <ErrorState message={apiErrorMessage(error, 'Failed to load this result')} onRetry={() => refetch()} />
      </PageShell>
    )
  }

  const entries = result.component_entries ?? []
  const canRequestCorrection = result.status === 'PUBLISHED' || result.status === 'FROZEN'

  return (
    <PageShell
      title={`${result.exam_title ?? 'Result'} - ${result.student_name ?? `Student ${result.student}`}`}
      description={result.student_reg_no ? `Registration no. ${result.student_reg_no}` : undefined}
      breadcrumbs={[{ label: 'Results', path: '/results' }, { label: `Result ${result.id}` }]}
      actions={<ResultWorkflowActions result={result} />}
    >
      <div className="space-y-6">
        <Card>
          <dl className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-ink-secondary">Total</dt>
              <dd className="text-h3">
                {result.total_obtained} / {result.total_max}
              </dd>
            </div>
            <div>
              <dt className="text-ink-secondary">Outcome</dt>
              <dd>
                <Badge variant={OUTCOME_VARIANT[result.final_outcome] ?? 'default'}>{result.final_outcome}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-ink-secondary">Status</dt>
              <dd>
                <StatusBadge domain="results" status={result.status} />
              </dd>
            </div>
            <div>
              <dt className="text-ink-secondary">Last updated</dt>
              <dd>{result.updated_at ? new Date(result.updated_at).toLocaleString() : '-'}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-h3 mb-4">Components</h2>
            {entries.length === 0 ? (
              <p className="text-sm text-ink-secondary">No component marks have been recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-secondary border-b">
                      <th className="py-2 pr-3">Component</th>
                      <th className="py-2 pr-3">Marks</th>
                      <th className="py-2">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">{entry.exam_component_name ?? `Component ${entry.exam_component}`}</td>
                        <td className="py-2 pr-3">
                          {entry.marks_obtained} / {entry.exam_component_max_marks ?? '?'}
                        </td>
                        <td className="py-2">
                          <Badge variant={OUTCOME_VARIANT[entry.component_outcome as keyof typeof OUTCOME_VARIANT] ?? 'default'}>
                            {entry.component_outcome ?? 'NA'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {canRequestCorrection && (
          <Can tasks={['results.result_corrections.create']} roles={['Student']}>
            <Card>
              <div className="p-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-secondary">
                  Published results are locked. If a mark is wrong, request a correction for review.
                </p>
                <div className="flex gap-3">
                  <Link className="text-sm text-primary-600 hover:underline self-center" to="/results/corrections">
                    View corrections
                  </Link>
                  <Button variant="secondary" onClick={() => setShowCorrection(true)}>
                    Request correction
                  </Button>
                </div>
              </div>
            </Card>
          </Can>
        )}
      </div>

      {showCorrection && <CorrectionRequestModal result={result} onClose={() => setShowCorrection(false)} />}
    </PageShell>
  )
}
