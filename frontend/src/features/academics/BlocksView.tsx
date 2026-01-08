import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { academicsNewService, type LearningBlock } from '@/services/academicsNew'
import { BlockFormModal } from './BlockFormModal'
import { ModulesList } from './ModulesList'

interface BlocksViewProps {
  blocks: LearningBlock[]
}

export const BlocksView: React.FC<BlocksViewProps> = ({ blocks }) => {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<LearningBlock | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => academicsNewService.deleteBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-blocks'] })
    },
  })

  const handleEdit = (block: LearningBlock) => {
    setEditingBlock(block)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingBlock(null)
  }

  return (
    <div className="space-y-2">
      {blocks.map((block) => (
        <div
          key={block.id}
          className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{block.name}</span>
                <Badge
                  variant={block.block_type === 'INTEGRATED_BLOCK' ? 'default' : 'secondary'}
                >
                  {block.block_type === 'INTEGRATED_BLOCK' ? 'Integrated' : 'Rotation'}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {new Date(block.start_date).toLocaleDateString()} -{' '}
                {new Date(block.end_date).toLocaleDateString()}
              </p>
              {block.primary_department_name && (
                <p className="text-xs text-gray-600 mt-1">
                  Department: {block.primary_department_name}
                  {block.sub_department_name && ` / ${block.sub_department_name}`}
                </p>
              )}
              {block.block_type === 'INTEGRATED_BLOCK' && block.modules_count > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {block.modules_count} module(s)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => handleEdit(block)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  if (confirm('Delete this block?')) {
                    deleteMutation.mutate(block.id)
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
          {block.block_type === 'INTEGRATED_BLOCK' && (
            <div className="mt-2 pt-2 border-t">
              <ModulesList blockId={block.id} />
            </div>
          )}
        </div>
      ))}

      {isFormOpen && editingBlock && (
        <BlockFormModal
          block={editingBlock}
          periodId={editingBlock.period}
          trackId={editingBlock.track}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

