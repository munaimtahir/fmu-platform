import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { academicsNewService } from '@/services/academicsNew'
import { batchesService } from '@/services/batches'
import { TracksManagement } from '@/features/academics/TracksManagement'
import { PeriodsView } from '@/features/academics/PeriodsView'

export const ProgramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'tracks' | 'periods'>('overview')

  const { data: program, isLoading, error, refetch } = useQuery({
    queryKey: ['academics-program', id],
    queryFn: () => academicsNewService.getProgram(Number(id!)),
    enabled: !!id,
  })

  const { data: batches } = useQuery({
    queryKey: ['batches', id],
    queryFn: () => batchesService.getAll({ program: Number(id!) }),
    enabled: !!id,
  })

  const { data: periods } = useQuery({
    queryKey: ['academics-periods', id],
    queryFn: () => academicsNewService.getPeriods({ program: Number(id!) }),
    enabled: !!id,
  })

  const { data: tracks } = useQuery({
    queryKey: ['academics-tracks', id],
    queryFn: () => academicsNewService.getTracks({ program: Number(id!) }),
    enabled: !!id,
  })

  const finalizeMutation = useMutation({
    mutationFn: () => academicsNewService.finalizeProgram(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-program', id] })
      alert('Program finalized successfully!')
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to finalize program'
      alert(`Error: ${errorMessage}`)
    },
  })

  const generatePeriodsMutation = useMutation({
    mutationFn: () => academicsNewService.generatePeriods(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-periods', id] })
      queryClient.invalidateQueries({ queryKey: ['academics-program', id] })
      alert('Blocks generated successfully!')
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to generate blocks'
      alert(`Error: ${errorMessage}`)
      console.error('Error generating periods:', error)
    },
  })

  if (isLoading) {
    return (
      
        <PageShell title="Program Details">
          <LoadingState />
        </PageShell>
      
    )
  }

  if (error || !program) {
    return (
      
        <PageShell title="Program Details">
          <ErrorState message="Failed to load program" onRetry={() => refetch()} />
        </PageShell>
      
    )
  }

  const canFinalize = !program.is_finalized
  const canGeneratePeriods = program.is_finalized && (!periods || periods.length === 0)

  return (
    
      <PageShell
        title={program.name}
        description={program.description}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/academics/programs')}>
              Back to List
            </Button>
            {canFinalize && (
              <Button
                onClick={() => {
                  if (confirm('Are you sure you want to finalize this program? This will lock structure fields.')) {
                    finalizeMutation.mutate()
                  }
                }}
                disabled={finalizeMutation.isPending}
              >
                Finalize Program
              </Button>
            )}
            {canGeneratePeriods && (
              <Button
                onClick={() => {
                  if (confirm('Generate blocks for this program? This will create time blocks (e.g., Year 1-5, Semester 1-10) based on the program structure.')) {
                    generatePeriodsMutation.mutate()
                  }
                }}
                disabled={generatePeriodsMutation.isPending}
              >
                {generatePeriodsMutation.isPending ? 'Generating...' : 'Generate Blocks'}
              </Button>
            )}
            {program.is_finalized && periods && periods.length === 0 && !canGeneratePeriods && (
              <span className="text-sm text-ink-muted flex items-center">
                (Program is finalized but blocks generation may have failed. Check console for errors.)
              </span>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          {/* Program Info */}
          <Card>
            <div className="p-6">
              <h3 className="text-h4 mb-4">Program Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-ink-secondary">Structure Type</label>
                  <div className="mt-1">
                    <Badge variant="default">{program.structure_type}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-ink-secondary">Status</label>
                  <div className="mt-1">
                    <Badge variant={program.is_finalized ? 'success' : 'warning'}>
                      {program.is_finalized ? 'Finalized' : 'Draft'}
                    </Badge>
                  </div>
                </div>
                {program.structure_type === 'CUSTOM' && (
                  <>
                    <div>
                      <label className="text-sm text-ink-secondary">Period Length (Months)</label>
                      <div className="mt-1">{program.period_length_months || <span className="text-danger">Not set</span>}</div>
                    </div>
                    <div>
                      <label className="text-sm text-ink-secondary">Total Periods</label>
                      <div className="mt-1">{program.total_periods || <span className="text-danger">Not set</span>}</div>
                    </div>
                    {(!program.period_length_months || !program.total_periods) && (
                      <div className="col-span-2">
                        <p className="text-sm text-warning mt-2">
                          ⚠️ CUSTOM structure requires both Period Length (Months) and Total Periods to be set before finalizing.
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="text-sm text-ink-secondary">Active</label>
                  <div className="mt-1">
                    <StatusBadge
                      domain="record"
                      status={program.is_active ? 'Active' : 'Inactive'}
                      label={program.is_active ? 'Yes' : 'No'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8" role="tablist" aria-label="Program sections">
              <button
                role="tab"
                aria-selected={activeTab === 'overview'}
                id="program-tab-overview"
                aria-controls="program-tabpanel-overview"
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink-secondary hover:border-surface-border'
                }`}
              >
                Overview
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'batches'}
                id="program-tab-batches"
                aria-controls="program-tabpanel-batches"
                onClick={() => setActiveTab('batches')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'batches'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink-secondary hover:border-surface-border'
                }`}
              >
                Batches ({batches?.results?.length || batches?.count || 0})
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'tracks'}
                id="program-tab-tracks"
                aria-controls="program-tabpanel-tracks"
                onClick={() => setActiveTab('tracks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tracks'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink-secondary hover:border-surface-border'
                }`}
                title="Tracks are parallel pathways within a program (e.g., different clinical tracks)"
              >
                Tracks ({tracks?.length || 0})
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'periods'}
                id="program-tab-periods"
                aria-controls="program-tabpanel-periods"
                onClick={() => setActiveTab('periods')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'periods'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink-secondary hover:border-surface-border'
                }`}
              >
                Blocks ({periods?.length || 0})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div role="tabpanel" id="program-tabpanel-overview" aria-labelledby="program-tab-overview">
              <Card>
                <div className="p-6">
                  <h3 className="text-h4 mb-4">Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Tracks</h4>
                      <p className="text-ink-secondary">{tracks?.length || 0} track(s) defined</p>
                      <p className="text-sm text-ink-muted mt-1">
                        Tracks represent parallel pathways or streams within the program (e.g., "Track A", "Clinical Track").
                        Different tracks can have different learning blocks scheduled in the same period.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Periods</h4>
                      <p className="text-ink-secondary">{periods?.length || 0} block(s) generated</p>
                      {!program.is_finalized && (
                        <p className="text-sm text-warning mt-1">
                          ⚠️ Program must be finalized before blocks can be generated.
                        </p>
                      )}
                      {program.is_finalized && periods && periods.length === 0 && (
                        <p className="text-sm text-ink-muted mt-1">
                          Click "Generate Blocks" button above to create blocks for this program.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'batches' && (
            <div role="tabpanel" id="program-tabpanel-batches" aria-labelledby="program-tab-batches">
              <Card>
                <div className="p-6">
                  <h3 className="text-h4 mb-4">Batches</h3>
                  {batches?.results && batches.results.length > 0 ? (
                    <div className="space-y-2">
                      {batches.results.map((batch: any) => (
                        <div key={batch.id} className="border rounded p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{batch.name}</h4>
                              <p className="text-sm text-ink-secondary">Year: {batch.year || batch.start_year}</p>
                            </div>
                            <StatusBadge domain="record" status={batch.is_active ? 'Active' : 'Inactive'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-ink-muted">No batches found for this program.</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'tracks' && (
            <div role="tabpanel" id="program-tabpanel-tracks" aria-labelledby="program-tab-tracks">
              <TracksManagement programId={Number(id!)} />
            </div>
          )}

          {activeTab === 'periods' && (
            <div role="tabpanel" id="program-tabpanel-periods" aria-labelledby="program-tab-periods">
              <PeriodsView programId={Number(id!)} />
            </div>
          )}
        </div>
      </PageShell>
    
  )
}

