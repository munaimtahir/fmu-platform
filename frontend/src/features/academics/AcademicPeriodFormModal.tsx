import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { academicsService, type AcademicPeriod, type CreateAcademicPeriodData } from '@/services/academics'
import toast from 'react-hot-toast'

interface AcademicPeriodFormModalProps {
  period?: AcademicPeriod | null
  onClose: () => void
}

const PERIOD_TYPES = [
  { value: 'YEAR', label: 'Year' },
  { value: 'BLOCK', label: 'Block' },
  { value: 'MODULE', label: 'Module' },
  { value: 'SEMESTER', label: 'Semester' },
]

export const AcademicPeriodFormModal: React.FC<AcademicPeriodFormModalProps> = ({ period, onClose }) => {
  const queryClient = useQueryClient()
  const [periodType, setPeriodType] = useState('')
  const [name, setName] = useState('')
  const [parentPeriod, setParentPeriod] = useState<number | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: periods } = useQuery({
    queryKey: ['academic-periods'],
    queryFn: () => academicsService.getAcademicPeriods(),
  })

  useEffect(() => {
    if (period) {
      setPeriodType(period.period_type || '')
      setName(period.name || '')
      setParentPeriod(period.parent_period || '')
      setStartDate(period.start_date ? period.start_date.split('T')[0] : '')
      setEndDate(period.end_date ? period.end_date.split('T')[0] : '')
    }
  }, [period])

  const createMutation = useMutation({
    mutationFn: (data: CreateAcademicPeriodData) => academicsService.createAcademicPeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-periods'] })
      toast.success('Academic period created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to create academic period')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateAcademicPeriodData>) => academicsService.updateAcademicPeriod(period!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-periods'] })
      toast.success('Academic period updated successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update academic period')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!periodType) {
      toast.error('Please select a period type')
      return
    }

    const data: CreateAcademicPeriodData = {
      period_type: periodType,
      name,
      parent_period: parentPeriod ? Number(parentPeriod) : null,
      start_date: startDate || null,
      end_date: endDate || null,
    }

    if (period) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const availableParents = periods?.filter(
    (p) => (!period || p.id !== period.id) && p.period_type !== periodType
  ) || []

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {period ? 'Edit Academic Period' : 'Create Academic Period'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Period Type"
            value={periodType}
            onChange={(value) => setPeriodType(value)}
            options={[
              { value: '', label: 'Select period type' },
              ...PERIOD_TYPES,
            ]}
            required
          />
          <Input
            label="Period Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Year 1, Block 1"
          />
          <Select
            label="Parent Period (Optional)"
            value={parentPeriod ? String(parentPeriod) : ''}
            onChange={(value) => setParentPeriod(value ? Number(value) : '')}
            options={[
              { value: '', label: 'None (Top-level)' },
              ...availableParents.map((p) => ({
                value: String(p.id),
                label: `${p.name} (${p.period_type})`,
              })),
            ]}
          />
          <Input
            label="Start Date (Optional)"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date (Optional)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {period ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
