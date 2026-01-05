import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { academicsNewService, type LearningBlock, type Department } from '@/services/academicsNew'

interface BlockFormModalProps {
  block?: LearningBlock | null
  periodId?: number
  trackId?: number
  onClose: () => void
}

export const BlockFormModal: React.FC<BlockFormModalProps> = ({
  block,
  periodId,
  trackId,
  onClose,
}) => {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [blockType, setBlockType] = useState<'INTEGRATED_BLOCK' | 'ROTATION_BLOCK'>('INTEGRATED_BLOCK')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [primaryDepartment, setPrimaryDepartment] = useState<number | ''>('')
  const [subDepartment, setSubDepartment] = useState<number | ''>('')

  const { data: departments } = useQuery({
    queryKey: ['academics-departments'],
    queryFn: () => academicsNewService.getDepartments(),
  })

  useEffect(() => {
    if (block) {
      setName(block.name)
      setBlockType(block.block_type)
      setStartDate(block.start_date)
      setEndDate(block.end_date)
      setPrimaryDepartment(block.primary_department || '')
      setSubDepartment(block.sub_department || '')
    }
  }, [block])

  const createMutation = useMutation({
    mutationFn: (data: any) => academicsNewService.createBlock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-blocks'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => academicsNewService.updateBlock(block!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-blocks'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: any = {
      period: block?.period || periodId!,
      track: block?.track || trackId!,
      name,
      block_type: blockType,
      start_date: startDate,
      end_date: endDate,
    }

    if (blockType === 'ROTATION_BLOCK') {
      if (primaryDepartment) data.primary_department = Number(primaryDepartment)
      if (subDepartment) data.sub_department = Number(subDepartment)
    }

    if (block) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const filteredSubDepartments = departments?.filter(
    (d) => d.parent === primaryDepartment
  ) || []

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {block ? 'Edit Block' : 'Create Block'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Block Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Select
            label="Block Type"
            value={blockType}
            onChange={(e) => setBlockType(e.target.value as any)}
            required
          >
            <option value="INTEGRATED_BLOCK">Integrated Block</option>
            <option value="ROTATION_BLOCK">Rotation Block</option>
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>
          {blockType === 'ROTATION_BLOCK' && (
            <>
              <Select
                label="Primary Department"
                value={primaryDepartment}
                onChange={(e) => {
                  setPrimaryDepartment(e.target.value ? Number(e.target.value) : '')
                  setSubDepartment('')
                }}
                required
              >
                <option value="">Select Department</option>
                {departments?.filter((d) => !d.parent).map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Select>
              {primaryDepartment && filteredSubDepartments.length > 0 && (
                <Select
                  label="Sub Department (Optional)"
                  value={subDepartment}
                  onChange={(e) => setSubDepartment(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">None</option>
                  {filteredSubDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Select>
              )}
            </>
          )}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {block ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

