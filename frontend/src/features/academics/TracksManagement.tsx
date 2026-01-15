import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { academicsNewService, type Track } from '@/services/academicsNew'
import { TrackFormModal } from './TrackFormModal'

interface TracksManagementProps {
  programId: number
}

export const TracksManagement: React.FC<TracksManagementProps> = ({ programId }) => {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)

  const { data: tracks, isLoading } = useQuery({
    queryKey: ['academics-tracks', programId],
    queryFn: () => academicsNewService.getTracks({ program: programId }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => academicsNewService.deleteTrack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-tracks', programId] })
    },
  })

  const handleEdit = (track: Track) => {
    setEditingTrack(track)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingTrack(null)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingTrack(null)
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Batches</h3>
        <Button onClick={handleCreate}>Create Batch</Button>
      </div>

      {tracks && tracks.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No batches found"
          description="Create batches to organize parallel learning paths"
          action={{ label: 'Create First Batch', onClick: handleCreate }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tracks?.map((track) => (
            <Card key={track.id}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{track.name}</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(track)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (confirm('Delete this batch?')) {
                          deleteMutation.mutate(track.id)
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {track.description && (
                  <p className="text-sm text-gray-600">{track.description}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {isFormOpen && (
        <TrackFormModal
          programId={programId}
          track={editingTrack}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

