import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { academicsNewService, type Period, type Track, type LearningBlock } from '@/services/academicsNew'
import { BlocksView } from './BlocksView'
import { BlockFormModal } from './BlockFormModal'

interface PeriodsViewProps {
  programId: number
}

export const PeriodsView: React.FC<PeriodsViewProps> = ({ programId }) => {
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['academics-periods', programId],
    queryFn: () => academicsNewService.getPeriods({ program: programId }),
  })

  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['academics-tracks', programId],
    queryFn: () => academicsNewService.getTracks({ program: programId }),
  })

  const isLoading = periodsLoading || tracksLoading

  if (isLoading) {
    return <LoadingState />
  }

  if (!periods || periods.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No periods found"
        description="Generate periods for this program to get started"
      />
    )
  }

  return (
    <div className="space-y-6">
      {periods.map((period) => (
        <PeriodCard
          key={period.id}
          period={period}
          tracks={tracks || []}
        />
      ))}
    </div>
  )
}

interface PeriodCardProps {
  period: Period
  tracks: Track[]
}

const PeriodCard: React.FC<PeriodCardProps> = ({ period, tracks }) => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)

  const { data: blocks } = useQuery({
    queryKey: ['academics-blocks', period.id],
    queryFn: () => academicsNewService.getBlocks({ period: period.id }),
  })

  const handleCreateBlock = (track: Track) => {
    setSelectedTrack(track)
    setIsFormOpen(true)
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{period.name}</h3>
            {period.start_date && period.end_date && (
              <p className="text-sm text-gray-600">
                {new Date(period.start_date).toLocaleDateString()} -{' '}
                {new Date(period.end_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <span className="text-sm text-gray-500">Order: {period.order}</span>
        </div>

        {tracks.length > 0 ? (
          <div className="space-y-4">
            {tracks.map((track) => {
              const trackBlocks = blocks?.filter((b) => b.track === track.id) || []
              return (
                <div key={track.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{track.name}</h4>
                    <Button size="sm" onClick={() => handleCreateBlock(track)}>
                      Add Block
                    </Button>
                  </div>
                  {trackBlocks.length > 0 ? (
                    <BlocksView blocks={trackBlocks} />
                  ) : (
                    <p className="text-sm text-gray-500">No blocks scheduled</p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No tracks defined. Create tracks to schedule blocks.</p>
        )}
      </div>
      {isFormOpen && selectedTrack && (
        <BlockFormModal
          periodId={period.id}
          trackId={selectedTrack.id}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedTrack(null)
          }}
        />
      )}
    </Card>
  )
}

