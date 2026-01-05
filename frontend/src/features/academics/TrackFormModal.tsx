import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { academicsNewService, type Track } from '@/services/academicsNew'

interface TrackFormModalProps {
  programId: number
  track?: Track | null
  onClose: () => void
}

export const TrackFormModal: React.FC<TrackFormModalProps> = ({ programId, track, onClose }) => {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (track) {
      setName(track.name)
      setDescription(track.description || '')
    }
  }, [track])

  const createMutation = useMutation({
    mutationFn: (data: { program: number; name: string; description?: string }) =>
      academicsNewService.createTrack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-tracks', programId] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      academicsNewService.updateTrack(track!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-tracks', programId] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (track) {
      updateMutation.mutate({ name, description })
    } else {
      createMutation.mutate({ program: programId, name, description })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {track ? 'Edit Track' : 'Create Track'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Track Name"
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
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {track ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

