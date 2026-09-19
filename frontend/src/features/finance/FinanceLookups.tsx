import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { financeService } from '@/services/finance'
import { studentsService } from '@/services/students'
import { apiErrorMessage } from '@/lib/apiErrors'

const LOOKUP_STALE_MS = 5 * 60 * 1000

export function useProgramOptions(): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'lookup', 'programs'],
    queryFn: () => financeService.getPrograms(),
    staleTime: LOOKUP_STALE_MS,
  })
  return { options: (data ?? []).map((p) => ({ value: String(p.id), label: p.name })), isLoading }
}

export function useTermOptions(): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'lookup', 'terms'],
    queryFn: () => financeService.getAcademicPeriods(),
    staleTime: LOOKUP_STALE_MS,
  })
  return { options: (data ?? []).map((t) => ({ value: String(t.id), label: t.name })), isLoading }
}

export function useFeeTypeOptions(): { options: SelectOption[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'lookup', 'fee-types'],
    queryFn: () => financeService.getFeeTypes(),
    staleTime: LOOKUP_STALE_MS,
  })
  return {
    options: (data ?? []).map((f) => ({ value: String(f.id), label: `${f.code} - ${f.name}` })),
    isLoading,
  }
}

export interface StudentPickerProps {
  id: string
  label?: string
  /** Selected student id, as a string (empty for none). */
  value: string
  onChange: (studentId: string) => void
  required?: boolean
  error?: string
  disabled?: boolean
  /** Shown for an already-selected student whose record is not in the current search results. */
  selectedLabel?: string
}

/**
 * Server-side student search: type at least two characters of a name or registration
 * number, then choose from the matches.  Avoids loading every student up front.
 */
export const StudentPicker: React.FC<StudentPickerProps> = ({
  id,
  label = 'Student',
  value,
  onChange,
  required,
  error,
  disabled,
  selectedLabel,
}) => {
  const [search, setSearch] = useState('')
  const [chosenLabel, setChosenLabel] = useState(selectedLabel ?? '')
  const debounced = useDebouncedValue(search.trim(), 300)

  useEffect(() => {
    if (selectedLabel) setChosenLabel(selectedLabel)
  }, [selectedLabel])

  const { data, isFetching, error: searchError } = useQuery({
    queryKey: ['finance', 'lookup', 'students', debounced],
    queryFn: () => studentsService.getAll({ search: debounced }),
    enabled: debounced.length >= 2,
  })

  const options: SelectOption[] = (data?.results ?? []).map((s) => ({
    value: String(s.id),
    label: `${s.reg_no} - ${s.name}`,
  }))
  if (value && !options.some((o) => o.value === value)) {
    options.unshift({ value, label: chosenLabel || `Student #${value}` })
  }

  return (
    <div className="space-y-2">
      <Input
        id={`${id}-search`}
        label={`Find ${label.toLowerCase()} (name or reg. no.)`}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Type at least 2 characters"
        disabled={disabled}
        helperText={
          searchError
            ? apiErrorMessage(searchError)
            : isFetching
              ? 'Searching...'
              : debounced.length >= 2 && options.length === 0
                ? 'No students match.'
                : undefined
        }
      />
      <Select
        id={id}
        label={label}
        required={required}
        error={error}
        disabled={disabled}
        searchable={false}
        options={options}
        value={value}
        placeholder="Select a student..."
        onChange={(next) => {
          const match = options.find((o) => o.value === next)
          setChosenLabel(match?.label ?? '')
          onChange(next)
        }}
      />
    </div>
  )
}
