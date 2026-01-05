import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { academicsNewService, type Module } from '@/services/academicsNew'
import { ModuleFormModal } from './ModuleFormModal'

interface ModulesListProps {
  blockId: number
}

export const ModulesList: React.FC<ModulesListProps> = ({ blockId }) => {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)

  const { data: modules, isLoading } = useQuery({
    queryKey: ['academics-modules', blockId],
    queryFn: () => academicsNewService.getModules({ block: blockId }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => academicsNewService.deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-modules', blockId] })
    },
  })

  const handleEdit = (module: Module) => {
    setEditingModule(module)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingModule(null)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingModule(null)
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading modules...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h5 className="text-sm font-medium">Modules</h5>
        <Button size="sm" onClick={handleCreate}>
          Add Module
        </Button>
      </div>
      {modules && modules.length > 0 ? (
        <div className="space-y-1">
          {modules.map((module) => (
            <div
              key={module.id}
              className="flex justify-between items-center p-2 bg-white rounded border text-sm"
            >
              <div>
                <span className="font-medium">{module.name}</span>
                {module.description && (
                  <span className="text-gray-600 ml-2">- {module.description}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(module)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Delete this module?')) {
                      deleteMutation.mutate(module.id)
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No modules. Click "Add Module" to create one.</p>
      )}

      {isFormOpen && (
        <ModuleFormModal
          blockId={blockId}
          module={editingModule}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

