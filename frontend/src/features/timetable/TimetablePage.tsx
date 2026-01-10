/**
 * Weekly Timetable Page
 * Workflow: Select Batch → Select Academic Period → Auto-generate weekly templates → Edit → Publish
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'
import { weeklyTimetableService, timetableCellService, academicsService, batchesService } from '@/services'
import { TimetableTableView } from './TimetableTableView'
import { TimetableEditor } from './TimetableEditor'

type ViewMode = 'list' | 'view' | 'edit'

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
  const [pendingCells, setPendingCells] = useState<Map<string, { line1: string; line2: string; line3: string }>>(new Map())

  // Fetch dropdown data
  const { data: batchesData } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchesService.getAll({ is_active: true }),
  })

  const { data: academicPeriods } = useQuery({
    queryKey: ['academicPeriods'],
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

  // Fetch full timetable details when viewing/editing
  const { data: fullTimetable, refetch: refetchTimetable } = useQuery({
    queryKey: ['weekly-timetable', selectedTimetableId],
    queryFn: () => weeklyTimetableService.getById(selectedTimetableId!),
    enabled: !!selectedTimetableId && (viewMode === 'view' || viewMode === 'edit'),
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
      if (error?.response?.data?.empty_cells) {
        const emptyCount = error.response.data.total_empty || 0
        toast.error(`Cannot publish: ${emptyCount} cell(s) are not fully filled. Please fill all 3 lines in every cell.`)
      } else {
        const message = error?.response?.data?.detail || error?.message || 'Failed to publish timetable'
        toast.error(message)
      }
    },
  })

  // Save cells mutation
  const saveCellsMutation = useMutation({
    mutationFn: async (cells: Array<{ day_of_week: number; time_slot: string; line1: string; line2: string; line3: string }>) => {
      if (!selectedTimetableId) throw new Error('No timetable selected')
      return timetableCellService.bulkUpdate(selectedTimetableId, cells)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timetable'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-timetables'] })
      toast.success('Timetable saved successfully')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.message || 'Failed to save timetable'
      toast.error(message)
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

  // Handle edit
  const handleEdit = (timetableId: number) => {
    const timetable = allWeeks.find(t => t.id === timetableId)
    if (!timetable) return
    
    if (timetable.status === 'published') {
      toast.error('Published timetables cannot be edited')
      return
    }
    
    setSelectedTimetableId(timetableId)
    setViewMode('edit')
  }

  // Handle cell changes in editor
  const handleCellChange = useCallback((
    day: number,
    timeSlot: string,
    line1: string,
    line2: string,
    line3: string
  ) => {
    const key = `${day}-${timeSlot}`
    setPendingCells(prev => {
      const next = new Map(prev)
      next.set(key, { line1, line2, line3 })
      return next
    })
  }, [])

  // Handle save
  const handleSave = async () => {
    if (!fullTimetable) {
      toast.error('No timetable to save')
      return
    }

    const DEFAULT_TIME_SLOTS = [
      '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
      '16:00-17:00', '17:00-18:00',
    ]

    const cells: Array<{ day_of_week: number; time_slot: string; line1: string; line2: string; line3: string }> = []
    
    // Get all existing cells from full timetable
    const existingCellsMap = new Map<string, { line1: string; line2: string; line3: string }>()
    if (fullTimetable.cells) {
      fullTimetable.cells.forEach(cell => {
        const key = `${cell.day_of_week}-${cell.time_slot}`
        existingCellsMap.set(key, {
          line1: cell.line1 || '',
          line2: cell.line2 || '',
          line3: cell.line3 || '',
        })
      })
    }

    for (let day = 0; day <= 5; day++) {
      for (const slot of DEFAULT_TIME_SLOTS) {
        const key = `${day}-${slot}`
        const pendingData = pendingCells.get(key)
        const existingData = existingCellsMap.get(key) || { line1: '', line2: '', line3: '' }
        const cellData = pendingData || existingData
        
        // Always include cell (even if empty, to allow clearing)
        cells.push({
          day_of_week: day,
          time_slot: slot,
          ...cellData,
        })
      }
    }

    saveCellsMutation.mutate(cells, {
      onSuccess: () => {
        refetchTimetable()
        setPendingCells(new Map())
      }
    })
  }

  // Handle publish with validation
  const handlePublish = () => {
    if (!fullTimetable) {
      toast.error('No timetable to publish')
      return
    }

    // Client-side validation: Check if all 60 cells (6 days × 10 slots) are filled
    const DEFAULT_TIME_SLOTS = [
      '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
      '16:00-17:00', '17:00-18:00',
    ]

    const emptyCells: string[] = []
    const cells = fullTimetable.cells || []
    
    // Create a map for quick lookup
    const cellMap = new Map<string, typeof cells[0]>()
    cells.forEach(cell => {
      const key = `${cell.day_of_week}-${cell.time_slot}`
      cellMap.set(key, cell)
    })
    
    for (let day = 0; day <= 5; day++) {
      for (const slot of DEFAULT_TIME_SLOTS) {
        const key = `${day}-${slot}`
        const cell = cellMap.get(key)
        // Check if cell exists and all 3 lines are filled
        if (!cell || !cell.line1?.trim() || !cell.line2?.trim() || !cell.line3?.trim()) {
          const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
          emptyCells.push(`${dayName} ${slot}`)
        }
      }
    }

    if (emptyCells.length > 0) {
      toast.error(`Please fill all 3 lines in every cell. ${emptyCells.length} cell(s) are incomplete.`, {
        duration: 5000,
      })
      return
    }

    if (window.confirm('Are you sure you want to publish this timetable? Once published, it cannot be edited.')) {
      publishMutation.mutate(fullTimetable.id)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setViewMode('list')
    setSelectedTimetableId(null)
    setPendingCells(new Map())
  }

  // Update editing timetable when full timetable is fetched
  useEffect(() => {
    if (fullTimetable && viewMode === 'edit') {
      setPendingCells(new Map()) // Reset pending cells when entering edit mode
    }
  }, [fullTimetable, viewMode])

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

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Weekly Timetable</h1>
        </div>

        {/* Selection: Batch → Academic Period */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              options={batchOptions}
              value={filterBatch}
              onChange={handleBatchChange}
              placeholder="1. Select Batch..."
              disabled={viewMode === 'edit'}
            />
            <Select
              options={academicPeriodOptions}
              value={filterAcademicPeriod}
              onChange={handleAcademicPeriodChange}
              placeholder="2. Select Academic Period..."
              disabled={!filterBatch || viewMode === 'edit' || generateTemplatesMutation.isPending}
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
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(week.id)
                                }}
                              >
                                Edit
                              </Button>
                              <Button
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
                <Badge variant={fullTimetable.status === 'published' ? 'success' : 'warning'}>
                  {fullTimetable.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
                <span className="text-sm text-gray-600">
                  Week of {format(parseISO(fullTimetable.week_start_date), 'MMM dd')} - {format(parseISO(fullTimetable.week_end_date || fullTimetable.week_start_date), 'MMM dd, yyyy')}
                </span>
              </div>
              {canEdit && fullTimetable.status === 'draft' && (
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(fullTimetable.id)}>Edit</Button>
                  <Button onClick={handlePublish} variant="primary" disabled={publishMutation.isPending}>
                    {publishMutation.isPending ? 'Publishing...' : 'Publish'}
                  </Button>
                </div>
              )}
            </div>
            <TimetableTableView timetable={fullTimetable} />
          </>
        ) : viewMode === 'edit' && fullTimetable ? (
          <>
            {/* Edit Mode */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={handleCancel}>
                  ← Back to List
                </Button>
                <Badge variant="warning">Draft - Editing</Badge>
                <span className="text-sm text-gray-600">
                  Week of {format(parseISO(fullTimetable.week_start_date), 'MMM dd')} - {format(parseISO(fullTimetable.week_end_date || fullTimetable.week_start_date), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <TimetableEditor
              timetable={fullTimetable}
              onCellChange={handleCellChange}
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSave} disabled={saveCellsMutation.isPending}>
                {saveCellsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={handlePublish} variant="primary" disabled={publishMutation.isPending || saveCellsMutation.isPending}>
                {publishMutation.isPending ? 'Publishing...' : 'Publish'}
              </Button>
              <Button onClick={handleCancel} variant="ghost">
                Cancel
              </Button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <strong>Note:</strong> All 3 lines in every cell must be filled before publishing.
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
