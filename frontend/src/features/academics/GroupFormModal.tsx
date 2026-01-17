import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { academicsService, type Group, type CreateGroupData } from '@/services/academics'
import { batchesService } from '@/services/batches'
import toast from 'react-hot-toast'

interface GroupFormModalProps {
  group?: Group | null
  onClose: () => void
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({ group, onClose }) => {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [batch, setBatch] = useState<number | ''>('')

  const { data: batches } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchesService.getAll(),
  })

  useEffect(() => {
    if (group) {
      setName(group.name)
      setBatch(group.batch)
    }
  }, [group])

  const createMutation = useMutation({
    mutationFn: (data: CreateGroupData) => academicsService.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Group created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to create group')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateGroupData>) => academicsService.updateGroup(group!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Group updated successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update group')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!batch) {
      toast.error('Please select a batch')
      return
    }

    const data: CreateGroupData = {
      name,
      batch: Number(batch),
    }

    if (group) {
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
          {group ? 'Edit Group' : 'Create Group'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Group A"
          />
          <Select
            label="Batch"
            value={batch ? String(batch) : ''}
            onChange={(value) => setBatch(value ? Number(value) : '')}
            options={[
              { value: '', label: 'Select a batch' },
              ...(batches?.results || []).map((b) => ({
                value: String(b.id),
                label: `${b.name} (${b.program_name || ''})`,
              })),
            ]}
            required
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {group ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
