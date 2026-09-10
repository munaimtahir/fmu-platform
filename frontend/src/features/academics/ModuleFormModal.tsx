import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Modal } from '@/components/ui/Modal'
import { academicsNewService, type Module } from '@/services/academicsNew'

interface ModuleFormModalProps {
  blockId: number
  module?: Module | null
  onClose: () => void
}

export const ModuleFormModal: React.FC<ModuleFormModalProps> = ({ blockId, module, onClose }) => {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [order, setOrder] = useState(1)

  useEffect(() => {
    if (module) {
      setName(module.name)
      setDescription(module.description || '')
      setOrder(module.order)
    }
  }, [module])

  const createMutation = useMutation({
    mutationFn: (data: any) => academicsNewService.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-modules', blockId] })
      queryClient.invalidateQueries({ queryKey: ['academics-blocks'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => academicsNewService.updateModule(module!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-modules', blockId] })
      queryClient.invalidateQueries({ queryKey: ['academics-blocks'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      block: blockId,
      name,
      description,
      order,
    }

    if (module) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal title={module ? 'Edit Module' : 'Create Module'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Module Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Input
          label="Order"
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          min={1}
          required
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {module ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

