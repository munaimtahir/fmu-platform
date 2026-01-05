import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select } from '@/components/ui/Select'
import { academicsNewService, type Department } from '@/services/academicsNew'

interface DepartmentFormModalProps {
  department?: Department | null
  onClose: () => void
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({ department, onClose }) => {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [parent, setParent] = useState<number | ''>('')

  const { data: departments } = useQuery({
    queryKey: ['academics-departments'],
    queryFn: () => academicsNewService.getDepartments(),
  })

  useEffect(() => {
    if (department) {
      setName(department.name)
      setCode(department.code || '')
      setDescription(department.description || '')
      setParent(department.parent || '')
    }
  }, [department])

  const createMutation = useMutation({
    mutationFn: (data: any) => academicsNewService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-departments'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => academicsNewService.updateDepartment(department!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-departments'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: any = {
      name,
      code: code || undefined,
      description: description || undefined,
    }
    if (parent) {
      data.parent = Number(parent)
    }

    if (department) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const availableParents = departments?.filter(
    (d) => !department || d.id !== department.id
  ) || []

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {department ? 'Edit Department' : 'Create Department'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Code (Optional)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Select
            label="Parent Department (Optional)"
            value={parent}
            onChange={(e) => setParent(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">None (Top-level)</option>
            {availableParents.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </Select>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {department ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

