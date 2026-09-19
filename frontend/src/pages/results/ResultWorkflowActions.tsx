import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Can } from '@/components/shared/Can'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { resultsService, type ResultHeader } from '@/services/results'

export type WorkflowAction = 'verify' | 'publish' | 'freeze'

const ACTIONS: Record<
  WorkflowAction,
  { task: string; label: string; done: string; allowedFrom: ResultHeader['status'][]; variant: 'primary' | 'secondary'; consequence: string }
> = {
  verify: {
    task: 'results.result_headers.verify',
    label: 'Verify',
    done: 'verified',
    allowedFrom: ['DRAFT'],
    variant: 'secondary',
    consequence: 'Verifying marks the marks as checked and moves the result from Draft to Verified.',
  },
  publish: {
    task: 'results.result_headers.publish',
    label: 'Publish',
    done: 'published',
    allowedFrom: ['DRAFT', 'VERIFIED'],
    variant: 'primary',
    consequence: 'Publishing makes the result visible to the student. Published results can only be changed through a correction request.',
  },
  freeze: {
    task: 'results.result_headers.freeze',
    label: 'Freeze',
    done: 'frozen',
    allowedFrom: ['PUBLISHED'],
    variant: 'secondary',
    consequence: 'Freezing locks the result permanently. This cannot be undone.',
  },
}

const ORDER: WorkflowAction[] = ['verify', 'publish', 'freeze']

interface ResultWorkflowActionsProps {
  result: ResultHeader
  /** Called after the backend accepted a transition. */
  onDone?: (updated: ResultHeader, action: WorkflowAction) => void
}

export const ResultWorkflowActions: React.FC<ResultWorkflowActionsProps> = ({ result, onDone }) => {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<WorkflowAction | null>(null)

  const runner = async (action: WorkflowAction) => {
    const updated = await resultsService[action](result.id)
    for (const key of ['results', 'publish-results', 'result', 'exam-results']) {
      queryClient.invalidateQueries({ queryKey: [key] })
    }
    toast.success(`Result ${result.student_reg_no ?? result.id} ${ACTIONS[action].done}`)
    onDone?.(updated, action)
  }

  const who = `${result.student_name ?? 'this student'}${result.exam_title ? ` (${result.exam_title})` : ''}`

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {ORDER.map((action) => {
          const config = ACTIONS[action]
          return (
            <Can key={action} tasks={[config.task]}>
              <Button
                size="sm"
                variant={config.variant}
                disabled={!config.allowedFrom.includes(result.status)}
                onClick={() => setPending(action)}
              >
                {config.label}
              </Button>
            </Can>
          )
        })}
      </div>

      {pending && (
        <ConfirmDialog
          title={`${ACTIONS[pending].label} result`}
          variant={pending === 'freeze' ? 'danger' : 'primary'}
          confirmLabel={ACTIONS[pending].label}
          message={
            <>
              {ACTIONS[pending].label} the result for <strong>{who}</strong>? {ACTIONS[pending].consequence}
            </>
          }
          onConfirm={() => runner(pending)}
          onClose={() => setPending(null)}
        />
      )}
    </>
  )
}
