/**
 * Weekly Timetable Page
 * Workflow: Select Batch → Select Academic Period → Auto-generate weekly templates → View → Publish
 */
import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/features/auth/useAuth'
import { weeklyTimetableService, academicsService, batchesService } from '@/services'
import { academicPeriodsKey } from '@/utils/queryKeys'
import { StudentTimetableView } from './StudentTimetableView'
import { EntriesPanel } from './EntriesPanel'

// NOTE (Workstream B / legacy TimetableCell retirement): the legacy free-text
// line1/2/3 grid editor (TimetableEditor/TimetableTableView) has been
// removed. Publishing now validates against TimetableEntry (see backend
// WeeklyTimetableViewSet.publish), and staff manage entries entirely through
// EntriesPanel/EntryForm below.

type ViewMode = 'list' | 'view'

export function TimetablePage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isFaculty = user?.role === 'Faculty'
  const isStudent = user?.role === 'Student'
  const canEdit = isFaculty || user?.role === 'Admin' || user?.role === 'Coordinator'

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterBatch, setFilterBatch] = useState<string>('')
  const [filterAcademicPeriod, setFilterAcademicPeriod] = useState<string>('')
  const [selectedTimetableId, setSelectedTimetableId] = useState<number | null>(null)

  // Fetch dropdown data
  const { data: batchesData } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchesService.getAll({ is_active: true }),
  })

  const { data: academicPeriods } = useQuery({
    queryKey: academicPeriodsKey(),
    queryFn: () => academicsService.getAcademicPeriods(),
    enabled: !!filterBatch, // Only fetch when batch is selected
  })

  const batches = batchesData?.results || []

  // Selected academic period details
  const selectedAcademicPeriod = useMemo(() => {
    if (!filterAcademicPeriod || !academicPeriods) return null
    return academicPeriods.find(ap => ap.id === parseInt(filterAcademicPeriod, 10)) || null
  }, [filterAcademicPeriod, academicPeriods])

  // Fetch all timetables for the selected batch and academic period (all weeks, not just one)
  const { data: timetablesData, isLoading: isLoadingTimetables } = useQuery({
    queryKey: ['weekly-timetables', filterBatch, filterAcademicPeriod],
    queryFn: () => weeklyTimetableService.getAll({
      batch: filterBatch ? parseInt(filterBatch, 10) : undefined,
      academic_period: filterAcademicPeriod ? parseInt(filterAcademicPeriod, 10) : undefined,
      status: isStudent ? 'published' : undefined,
      ordering: 'week_start_date',
      // Don't filter by week_start_date - we want all weeks for this period
    }),
    enabled: !!filterBatch && !!filterAcademicPeriod,
  })

  const allWeeks = timetablesData?.results || []

  // Fetch full timetable details when viewing
  const { data: fullTimetable } = useQuery({
    queryKey: ['weekly-timetable', selectedTimetableId],
    queryFn: () => weeklyTimetableService.getById(selectedTimetableId!),
    enabled: !!selectedTimetableId && viewMode === 'view',
  })

  // Generate templates mutation
  const generateTemplatesMutation = useMutation({
    mutationFn: ({ batchId, academicPeriodId }: { batchId: number; academicPeriodId: number }) =>
      weeklyTimetableService.generateWeeklyTemplates(batchId, academicPeriodId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timetables'] })
      toast.success(`Generated ${data.created_count} weekly templates. ${data.existing_count} already existed.`)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.message || 'Failed to generate templates'
      toast.error(message)
    },
  })

  // Publish mutation with validation
  const publishMutation = useMutation({
    mutationFn: (id: number) => weeklyTimetableService.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timetables'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-timetable'] })
      setViewMode('list')
      toast.success('Timetable published successfully')
    },
    onError: (error: any) => {
      if (error?.response?.data?.error?.code === 'INVALID_PERIOD_COUNT') {
        const days = error.response.data.error.days_with_wrong_count || []
        toast.error(`Cannot publish: ${error.response.data.error.message}. Days: ${days.join(', ')}`, {
          duration: 8000,
        })
      } else {
        const message = error?.response?.data?.detail || error?.message || 'Failed to publish timetable'
        toast.error(message)
      }
    },
  })

  // Handle batch selection
  const handleBatchChange = (batchId: string) => {
    setFilterBatch(batchId)
    setFilterAcademicPeriod('') // Reset academic period when batch changes
    setSelectedTimetableId(null)
    setViewMode('list')
  }

  // Handle academic period selection - auto-generate templates
  const handleAcademicPeriodChange = useCallback(async (periodId: string) => {
    setFilterAcademicPeriod(periodId)
    setSelectedTimetableId(null)
    setViewMode('list')

    if (!periodId || !filterBatch) return

    // Check if period has dates before generating
    const period = academicPeriods?.find(ap => ap.id === parseInt(periodId, 10))
    if (!period || !period.start_date || !period.end_date) {
      toast.error('Academic period must have start and end dates to generate weekly templates')
      return
    }

    // Auto-generate weekly templates for this period
    try {
      await generateTemplatesMutation.mutateAsync({
        batchId: parseInt(filterBatch, 10),
        academicPeriodId: parseInt(periodId, 10),
      })
    } catch (error) {
      // Error already handled by mutation
    }
  }, [filterBatch, academicPeriods, generateTemplatesMutation])

  // Handle week selection (view timetable)
  const handleWeekSelect = (timetableId: number) => {
    setSelectedTimetableId(timetableId)
    setViewMode('view')
  }

  // Handle publish with validation (exactly 3 scheduled periods per day,
  // sourced from TimetableEntry — mirrors WeeklyTimetableViewSet.publish)
  const handlePublish = () => {
    if (!fullTimetable) {
      toast.error('No timetable to publish')
      return
    }

    const entries = (fullTimetable.entries || []).filter(entry => entry.status !== 'CANCELLED')

    const dayPeriodCounts: Record<number, number> = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    }

    entries.forEach(entry => {
      dayPeriodCounts[entry.day_of_week] = (dayPeriodCounts[entry.day_of_week] || 0) + 1
    })

    // Check if each day has exactly 3 periods
    const daysWithWrongCount: string[] = []
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    for (let day = 0; day <= 5; day++) {
      const count = dayPeriodCounts[day] || 0
      if (count !== 3) {
        daysWithWrongCount.push(`${dayNames[day]} (${count} periods)`)
      }
    }

    if (daysWithWrongCount.length > 0) {
      toast.error(`Each day must have exactly 3 periods. Found: ${daysWithWrongCount.join(', ')}`, {
        duration: 8000,
      })
      return
    }

    if (window.confirm('Are you sure you want to publish this timetable? It has exactly 3 periods per day as required.')) {
      publishMutation.mutate(fullTimetable.id)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setViewMode('list')
    setSelectedTimetableId(null)
  }

  // Options for filters
  const batchOptions = [
    { value: '', label: 'Select Batch' },
    ...batches.map((b) => ({
      value: String(b.id),
      label: b.program_name ? `${b.name} (${b.program_name})` : b.name,
    })),
  ]

  const academicPeriodOptions = [
    { value: '', label: 'Select Academic Period' },
    ...(academicPeriods || []).map((ap) => ({
      value: String(ap.id),
      label: ap.name,
    })),
  ]

  // Group weeks by status for display
  const weeksByStatus = useMemo(() => {
    const draft = allWeeks.filter(w => w.status === 'draft')
    const published = allWeeks.filter(w => w.status === 'published')
    return { draft, published }
  }, [allWeeks])

  if (isStudent) {
    return (
      
        <div className="container mx-auto py-6 px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">My Timetable</h1>
          </div>
          <StudentTimetableView />
        </div>
      
    )
  }

  return (
    
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Weekly Timetable</h1>
        </div>

        {/* Selection: Batch → Academic Period */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              data-testid="timetable-batch-select"
              options={batchOptions}
              value={filterBatch}
              onChange={handleBatchChange}
              placeholder="1. Select Batch..."
            />
            <Select
              data-testid="timetable-academic-period-select"
              options={academicPeriodOptions}
              value={filterAcademicPeriod}
              onChange={handleAcademicPeriodChange}
              placeholder="2. Select Academic Period..."
              disabled={!filterBatch || generateTemplatesMutation.isPending}
            />
          </div>

          {generateTemplatesMutation.isPending && (
            <div className="text-sm text-blue-600">
              Generating weekly templates for all weeks in this period...
            </div>
          )}

          {filterBatch && filterAcademicPeriod && selectedAcademicPeriod && (
            <div className="text-sm text-gray-600">
              <strong>Period:</strong> {selectedAcademicPeriod.name}
              {selectedAcademicPeriod.start_date && selectedAcademicPeriod.end_date && (
                <> ({format(new Date(selectedAcademicPeriod.start_date), 'MMM dd, yyyy')} - {format(new Date(selectedAcademicPeriod.end_date), 'MMM dd, yyyy')})</>
              )}
              {(!selectedAcademicPeriod.start_date || !selectedAcademicPeriod.end_date) && (
                <span className="text-yellow-600 ml-2">⚠ Period dates not set - templates cannot be generated</span>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        {!filterBatch || !filterAcademicPeriod ? (
          <div className="text-center py-12 text-gray-500">
            Please select Batch first, then Academic Period to view weekly timetables
          </div>
        ) : viewMode === 'list' ? (
          <>
            {/* List View: Show all weeks */}
            {isLoadingTimetables ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : allWeeks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No weekly templates found. Templates will be auto-generated when you select an Academic Period.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Draft Weeks */}
                {weeksByStatus.draft.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Badge variant="warning">Draft</Badge>
                      <span>Weeks to Complete ({weeksByStatus.draft.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {weeksByStatus.draft.map((week, index) => {
                        const weekStart = parseISO(week.week_start_date)
                        const weekEnd = week.week_end_date ? parseISO(week.week_end_date) : new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000)
                        const weekRange = `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`

                        return (
                          <div
                            key={week.id}
                            data-testid={`week-card-draft-${week.id}`}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleWeekSelect(week.id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">Week {index + 1}</h3>
                                <p className="text-sm text-gray-600">{weekRange}</p>
                              </div>
                              <Badge variant="warning">Draft</Badge>
                            </div>
                            <div className="mt-3">
                              <Button
                                data-testid={`week-card-view-${week.id}`}
                                size="sm"
                                variant="primary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleWeekSelect(week.id)
                                }}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Published Weeks */}
                {weeksByStatus.published.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Badge variant="success">Published</Badge>
                      <span>Published Weeks ({weeksByStatus.published.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {weeksByStatus.published.map((week, index) => {
                        const weekStart = parseISO(week.week_start_date)
                        const weekEnd = week.week_end_date ? parseISO(week.week_end_date) : new Date(weekStart.getTime() + 5 * 24 * 60 * 60 * 1000)
                        const weekRange = `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`

                        return (
                          <div
                            key={week.id}
                            data-testid={`week-card-published-${week.id}`}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-green-50"
                            onClick={() => handleWeekSelect(week.id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">Week {index + 1}</h3>
                                <p className="text-sm text-gray-600">{weekRange}</p>
                              </div>
                              <Badge variant="success">Published</Badge>
                            </div>
                            <div className="mt-3">
                              <Button
                                data-testid={`week-card-view-${week.id}`}
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleWeekSelect(week.id)
                                }}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : viewMode === 'view' && fullTimetable ? (
          <>
            {/* View Mode */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={handleCancel}>
                  ← Back to List
                </Button>
                <StatusBadge
                  data-testid="timetable-status-badge"
                  domain="timetable"
                  status={fullTimetable.status}
                  label={fullTimetable.status === 'published' ? 'Published' : 'Draft'}
                />
                <span className="text-sm text-gray-600">
                  Week of {format(parseISO(fullTimetable.week_start_date), 'MMM dd')} - {format(parseISO(fullTimetable.week_end_date || fullTimetable.week_start_date), 'MMM dd, yyyy')}
                </span>
              </div>
              {canEdit && fullTimetable.status === 'draft' && (
                <div className="flex gap-2">
                  <Button
                    data-testid="timetable-publish-button"
                    onClick={handlePublish}
                    variant="primary"
                    disabled={publishMutation.isPending}
                  >
                    {publishMutation.isPending ? 'Publishing...' : 'Publish'}
                  </Button>
                </div>
              )}
            </div>
            <EntriesPanel
              weeklyTimetableId={fullTimetable.id}
              batchId={fullTimetable.batch}
              academicPeriodId={fullTimetable.academic_period}
              canEdit={canEdit}
              isDraft={fullTimetable.status === 'draft'}
            />
          </>
        ) : null}
      </div>
    
  )
}
