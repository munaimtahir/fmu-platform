import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { academicsNewService, type Department } from '@/services/academicsNew'
import { departmentsKey } from '@/utils/queryKeys'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import toast from 'react-hot-toast'

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
    queryKey: departmentsKey(),
    queryFn: () => academicsNewService.getDepartments(),
  })

  const initialSnapshot = useRef({ name: '', code: '', description: '', parent: '' as number | '' })

  useEffect(() => {
    if (department) {
      const next = {
        name: department.name,
        code: department.code || '',
        description: department.description || '',
        parent: department.parent || ('' as number | ''),
      }
      setName(next.name)
      setCode(next.code)
      setDescription(next.description)
      setParent(next.parent)
      initialSnapshot.current = next
    }
  }, [department])

  const createMutation = useMutation({
    mutationFn: (data: any) => academicsNewService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKey() })
      toast.success('Department created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to create department')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => academicsNewService.updateDepartment(department!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKey() })
      toast.success('Department updated successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to update department')
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
  const isDirty =
    name !== initialSnapshot.current.name ||
    code !== initialSnapshot.current.code ||
    description !== initialSnapshot.current.description ||
    parent !== initialSnapshot.current.parent
  useUnsavedChangesWarning(isDirty)

  return (
    <Modal title={department ? 'Edit Department' : 'Create Department'} onClose={onClose}>
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
          value={parent ? String(parent) : ''}
          onChange={(value) => setParent(value ? Number(value) : '')}
          options={[
            { value: '', label: 'None (Top-level)' },
            ...availableParents.map((dept) => ({
              value: String(dept.id),
              label: dept.name,
            })),
          ]}
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {department ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

