import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PageShell } from '@/components/shared/PageShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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
      <DashboardLayout>
        <PageShell title="Program Details">
          <LoadingState />
        </PageShell>
      </DashboardLayout>
    )
  }

  if (error || !program) {
    return (
      <DashboardLayout>
        <PageShell title="Program Details">
          <ErrorState message="Failed to load program" onRetry={() => refetch()} />
        </PageShell>
      </DashboardLayout>
    )
  }

  const canFinalize = !program.is_finalized
  const canGeneratePeriods = program.is_finalized && (!periods || periods.length === 0)

  return (
    <DashboardLayout>
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
              <span className="text-sm text-gray-500 flex items-center">
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
              <h3 className="text-lg font-semibold mb-4">Program Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Structure Type</label>
                  <div className="mt-1">
                    <Badge variant="default">{program.structure_type}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge variant={program.is_finalized ? 'success' : 'warning'}>
                      {program.is_finalized ? 'Finalized' : 'Draft'}
                    </Badge>
                  </div>
                </div>
                {program.structure_type === 'CUSTOM' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-600">Period Length (Months)</label>
                      <div className="mt-1">{program.period_length_months || <span className="text-red-500">Not set</span>}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Total Periods</label>
                      <div className="mt-1">{program.total_periods || <span className="text-red-500">Not set</span>}</div>
                    </div>
                    {(!program.period_length_months || !program.total_periods) && (
                      <div className="col-span-2">
                        <p className="text-sm text-amber-600 mt-2">
                          ⚠️ CUSTOM structure requires both Period Length (Months) and Total Periods to be set before finalizing.
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="text-sm text-gray-600">Active</label>
                  <div className="mt-1">
                    {program.is_active ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('batches')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'batches'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Batches ({batches?.results?.length || batches?.count || 0})
              </button>
              <button
                onClick={() => setActiveTab('tracks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tracks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title="Tracks are parallel pathways within a program (e.g., different clinical tracks)"
              >
                Tracks ({tracks?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('periods')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'periods'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Blocks ({periods?.length || 0})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Overview</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Tracks</h4>
                    <p className="text-gray-600">{tracks?.length || 0} track(s) defined</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Tracks represent parallel pathways or streams within the program (e.g., "Track A", "Clinical Track"). 
                      Different tracks can have different learning blocks scheduled in the same period.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Periods</h4>
                    <p className="text-gray-600">{periods?.length || 0} block(s) generated</p>
                    {!program.is_finalized && (
                      <p className="text-sm text-amber-600 mt-1">
                        ⚠️ Program must be finalized before blocks can be generated.
                      </p>
                    )}
                    {program.is_finalized && periods && periods.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Click "Generate Blocks" button above to create blocks for this program.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'batches' && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Batches</h3>
                {batches?.results && batches.results.length > 0 ? (
                  <div className="space-y-2">
                    {batches.results.map((batch: any) => (
                      <div key={batch.id} className="border rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{batch.name}</h4>
                            <p className="text-sm text-gray-600">Year: {batch.year || batch.start_year}</p>
                          </div>
                          <Badge variant={batch.is_active ? 'success' : 'secondary'}>
                            {batch.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No batches found for this program.</p>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'tracks' && (
            <TracksManagement programId={Number(id!)} />
          )}

          {activeTab === 'periods' && (
            <PeriodsView programId={Number(id!)} />
          )}
        </div>
      </PageShell>
    </DashboardLayout>
  )
}

