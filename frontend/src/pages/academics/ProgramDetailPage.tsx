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
import { academicsNewService, type Program, type Period, type Track } from '@/services/academicsNew'
import { TracksManagement } from '@/features/academics/TracksManagement'
import { PeriodsView } from '@/features/academics/PeriodsView'

export const ProgramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'tracks' | 'periods'>('overview')

  const { data: program, isLoading, error, refetch } = useQuery({
    queryKey: ['academics-program', id],
    queryFn: () => academicsNewService.getProgram(Number(id!)),
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
  })

  const generatePeriodsMutation = useMutation({
    mutationFn: () => academicsNewService.generatePeriods(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academics-periods', id] })
      alert('Periods generated successfully!')
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
            <Button variant="outline" onClick={() => navigate('/academics/programs')}>
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
                  if (confirm('Generate periods for this program?')) {
                    generatePeriodsMutation.mutate()
                  }
                }}
                disabled={generatePeriodsMutation.isPending}
              >
                Generate Periods
              </Button>
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
                      <div className="mt-1">{program.period_length_months}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Total Periods</label>
                      <div className="mt-1">{program.total_periods}</div>
                    </div>
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
                onClick={() => setActiveTab('tracks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tracks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
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
                Periods ({periods?.length || 0})
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
                  </div>
                  <div>
                    <h4 className="font-medium">Periods</h4>
                    <p className="text-gray-600">{periods?.length || 0} period(s) generated</p>
                  </div>
                </div>
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

