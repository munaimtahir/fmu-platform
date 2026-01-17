import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { batchesService, type Batch, type CreateBatchData } from '@/services/batches'
import { academicsNewService } from '@/services/academicsNew'
import toast from 'react-hot-toast'

interface BatchFormModalProps {
  batch?: Batch | null
  onClose: () => void
}

export const BatchFormModal: React.FC<BatchFormModalProps> = ({ batch, onClose }) => {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [program, setProgram] = useState<number | ''>('')
  const [startYear, setStartYear] = useState('')
  const [isActive, setIsActive] = useState(true)

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => academicsNewService.getPrograms(),
  })

  useEffect(() => {
    if (batch) {
      setName(batch.name)
      setProgram(batch.program)
      setStartYear(String(batch.start_year || new Date().getFullYear()))
      setIsActive(batch.is_active ?? true)
    } else {
      setStartYear(String(new Date().getFullYear()))
    }
  }, [batch])

  const createMutation = useMutation({
    mutationFn: (data: CreateBatchData) => batchesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      toast.success('Batch created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to create batch')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateBatchData>) => batchesService.update(batch!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      toast.success('Batch updated successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update batch')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!program) {
      toast.error('Please select a program')
      return
    }
    if (!startYear) {
      toast.error('Please enter a start year')
      return
    }

    const data: CreateBatchData = {
      name,
      program: Number(program),
      start_year: Number(startYear),
      is_active: isActive,
    }

    if (batch) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {batch ? 'Edit Batch' : 'Create Batch'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Batch Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., 2024 Batch"
          />
          <Select
            label="Program"
            value={program ? String(program) : ''}
            onChange={(value) => setProgram(value ? Number(value) : '')}
            options={[
              { value: '', label: 'Select a program' },
              ...(programs || []).map((p) => ({
                value: String(p.id),
                label: p.name,
              })),
            ]}
            required
          />
          <Input
            label="Start Year (Graduation Year)"
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            required
            min="2000"
            max="2100"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm">
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {batch ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
