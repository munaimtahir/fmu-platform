import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useCapabilities } from '@/features/auth/useCapabilities'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiErrorMessage } from '@/lib/apiErrors'
import { resultsService, type ResultHeader } from '@/services/results'

interface CorrectionResultPickerProps {
  onPick: (result: ResultHeader) => void
  onClose: () => void
}

/** Choose the published or frozen result a correction is for (corrections are limited to those). */
export const CorrectionResultPicker: React.FC<CorrectionResultPickerProps> = ({ onPick, onClose }) => {
  const { can } = useCapabilities()
  const staff = can('results.result_headers.view')
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search)

  const query = useQuery({
    queryKey: ['correction-picker', staff, debounced],
    queryFn: async (): Promise<ResultHeader[]> => {
      if (!staff) return resultsService.getMine()
      const [published, frozen] = await Promise.all([
        resultsService.getAll({ status: 'PUBLISHED', search: debounced || undefined }),
        resultsService.getAll({ status: 'FROZEN', search: debounced || undefined }),
      ])
      return [...published.results, ...frozen.results]
    },
  })

  return (
    <Modal title="Choose a result to correct" size="lg" onClose={onClose}>
      <div className="space-y-4">
        {staff && (
          <Input
            label="Search"
            placeholder="Registration number, name or exam"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
        {query.isLoading && <LoadingState message="Loading results..." />}
        {query.error && <ErrorState message={apiErrorMessage(query.error)} onRetry={() => query.refetch()} />}
        {query.data && query.data.length === 0 && (
          <p className="text-sm text-ink-secondary">No published or frozen results were found.</p>
        )}
        <ul className="divide-y">
          {(query.data ?? []).map((result) => (
            <li key={result.id} className="py-2 flex items-center justify-between gap-3">
              <div className="text-sm">
                <div className="font-medium">
                  {result.student_name ?? `Student ${result.student}`} {result.student_reg_no ? `(${result.student_reg_no})` : ''}
                </div>
                <div className="text-ink-secondary">
                  {result.exam_title} - {result.total_obtained} / {result.total_max} - {result.status}
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onPick(result)}>
                Select
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
