/**
 * Weekly Timetable Page
 * Displays timetable in table format with workflow: Create → Edit → Verify → Publish
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { startOfWeek } from 'date-fns'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'
import { weeklyTimetableService, timetableCellService, academicsService, batchesService } from '@/services'
import { WeeklyTimetable } from '@/types'
import { WeekSelector } from './WeekSelector'
import { TimetableTableView } from './TimetableTableView'
import { TimetableEditor } from './TimetableEditor'

type ViewMode = 'view' | 'edit' | 'create'

export function TimetablePage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isFaculty = user?.role === 'Faculty'
  const isStudent = user?.role === 'Student'
  const canEdit = isFaculty || user?.role === 'Admin' || user?.role === 'Coordinator'

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('view')
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [filterAcademicPeriod, setFilterAcademicPeriod] = useState<string>('')
  const [filterBatch, setFilterBatch] = useState<string>('')
  const [editingTimetable, setEditingTimetable] = useState<WeeklyTimetable | null>(null)
  const [pendingCells, setPendingCells] = useState<Map<string, { line1: string; line2: string; line3: string }>>(new Map())

  // Fetch dropdown data
  const { data: academicPeriods } = useQuery({
    queryKey: ['academicPeriods'],
    queryFn: () => academicsService.getAcademicPeriods(),
  })

  const { data: batchesData } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchesService.getAll(),
  })

  const batches = batchesData?.results || []

  // Build query params for fetching timetables
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      ordering: '-week_start_date',
    }
    if (filterAcademicPeriod) {
      params.academic_period = parseInt(filterAcademicPeriod, 10)
    }
    if (filterBatch) {
      params.batch = parseInt(filterBatch, 10)
    }
    if (isStudent) {
      params.status = 'published' // Students can only see published timetables
    }
    const weekStartStr = selectedWeek.toISOString().split('T')[0]
    params.week_start_date = weekStartStr
    return params
  }, [filterAcademicPeriod, filterBatch, selectedWeek, isStudent])

  // Fetch timetables for the selected week
  const { data: timetablesData, isLoading } = useQuery({
    queryKey: ['weekly-timetables', queryParams],
    queryFn: () => weeklyTimetableService.getAll(queryParams),
  })

  // Find timetable for selected batch and week
  const currentTimetable = useMemo(() => {
    if (!timetablesData?.results || !filterBatch) return null
    return timetablesData.results.find(
      t => t.batch === parseInt(filterBatch, 10) && 
           t.week_start_date === selectedWeek.toISOString().split('T')[0]
    ) || null
  }, [timetablesData, filterBatch, selectedWeek])

  // Determine which timetable ID to use for fetching full details
  const timetableIdForFetch = editingTimetable?.id || currentTimetable?.id

  // Fetch full timetable details with cells when viewing/editing
  const { data: fullTimetable, refetch: refetchTimetable } = useQuery({
    queryKey: ['weekly-timetable', timetableIdForFetch],
    queryFn: () => weeklyTimetableService.getById(timetableIdForFetch!),
    enabled: !!timetableIdForFetch && (viewMode === 'view' || viewMode === 'edit'),
  })

  // Create timetable mutation
  const createMutation = useMutation({
    mutationFn: (data: { academic_period: number; batch: number; week_start_date: string }) =>
      weeklyTimetableService.create(data),
    onSuccess: (newTimetable) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timetables'] })
      setEditingTimetable(newTimetable)
      setViewMode('edit')
      toast.success('Timetable created successfully')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.message || 'Failed to create timetable'
      toast.error(message)
    },
  })

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (id: number) => weeklyTimetableService.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-timetables'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-timetable'] })
      setViewMode('view')
      toast.success('Timetable published successfully')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.message || 'Failed to publish timetable'
      toast.error(message)
    },
  })

  // Save cells mutation (bulk update)
  const saveCellsMutation = useMutation({
    mutationFn: async (cells: Array<{ day_of_week: number; time_slot: string; line1: string; line2: string; line3: string }>) => {
      if (!editingTimetable) throw new Error('No timetable selected')
      return timetableCellService.bulkUpdate(editingTimetable.id, cells)
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

  // Handle "Add New" button click
  const handleAddNew = () => {
    if (!filterBatch || !filterAcademicPeriod) {
      toast.error('Please select Batch and Academic Period first')
      return
    }

    // Check if timetable already exists for this week and batch
    if (currentTimetable) {
      toast.error('A timetable already exists for this week and batch. Please edit it instead.')
      return
    }

    setViewMode('create')
    setEditingTimetable(null)
    setPendingCells(new Map())
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

  // Handle save (create timetable if new, or update cells)
  const handleSave = async () => {
    const timetableToSave = editingTimetable || displayTimetable

    if (viewMode === 'create' && !timetableToSave) {
      // First create the timetable
      if (!filterBatch || !filterAcademicPeriod) {
        toast.error('Please select Batch and Academic Period')
        return
      }

      const weekStartStr = selectedWeek.toISOString().split('T')[0]
      createMutation.mutate({
        academic_period: parseInt(filterAcademicPeriod, 10),
        batch: parseInt(filterBatch, 10),
        week_start_date: weekStartStr,
      })
      return // The create mutation will switch to edit mode
    }

    // Save cells for existing timetable
    if (!timetableToSave) {
      toast.error('No timetable to save')
      return
    }

    const DEFAULT_TIME_SLOTS = [
      '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
      '16:00-17:00', '17:00-18:00',
    ]

    const cells: Array<{ day_of_week: number; time_slot: string; line1: string; line2: string; line3: string }> = []
    
    // Get all existing cells from full timetable if available, otherwise from pending cells
    const existingCellsMap = new Map<string, { line1: string; line2: string; line3: string }>()
    if (fullTimetable?.cells) {
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
        // Refresh the timetable to get updated cells
        queryClient.invalidateQueries({ queryKey: ['weekly-timetable'] })
        queryClient.invalidateQueries({ queryKey: ['weekly-timetables'] })
        if (timetableToSave?.id) {
          refetchTimetable()
        }
        setPendingCells(new Map()) // Clear pending changes after save
      }
    })
  }

  // Handle publish
  const handlePublish = () => {
    if (!currentTimetable) {
      toast.error('No timetable to publish')
      return
    }

    if (window.confirm('Are you sure you want to publish this timetable? Once published, it cannot be edited.')) {
      publishMutation.mutate(currentTimetable.id)
    }
  }

  // Handle edit button
  const handleEdit = () => {
    if (!currentTimetable) return
    if (currentTimetable.status === 'published') {
      toast.error('Published timetables cannot be edited')
      return
    }
    setViewMode('edit')
    setEditingTimetable(currentTimetable)
    refetchTimetable()
  }

  // Handle cancel
  const handleCancel = () => {
    setViewMode('view')
    setEditingTimetable(null)
    setPendingCells(new Map())
  }

  // Update editing timetable when full timetable is fetched
  useEffect(() => {
    if (fullTimetable && viewMode === 'edit') {
      setEditingTimetable(fullTimetable)
    }
  }, [fullTimetable, viewMode])

  // Options for filters
  const academicPeriodOptions = [
    { value: '', label: 'Select Academic Period' },
    ...(academicPeriods || []).map((ap) => ({
      value: String(ap.id),
      label: ap.name,
    })),
  ]

  const batchOptions = [
    { value: '', label: 'Select Batch' },
    ...batches.map((b) => ({
      value: String(b.id),
      label: b.program_name ? `${b.name} (${b.program_name})` : b.name,
    })),
  ]

  // Determine display timetable
  const displayTimetable = viewMode === 'create' 
    ? editingTimetable 
    : (fullTimetable || currentTimetable)

  const isDraft = displayTimetable?.status === 'draft'
  const isPublished = displayTimetable?.status === 'published'

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Weekly Timetable</h1>
          {canEdit && viewMode === 'view' && (
            <Button onClick={handleAddNew}>Add New</Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              options={academicPeriodOptions}
              value={filterAcademicPeriod}
              onChange={setFilterAcademicPeriod}
              placeholder="Select academic period..."
              disabled={viewMode === 'edit' || viewMode === 'create'}
            />
            <Select
              options={batchOptions}
              value={filterBatch}
              onChange={setFilterBatch}
              placeholder="Select batch..."
              disabled={viewMode === 'edit' || viewMode === 'create'}
            />
            <WeekSelector
              selectedWeekStart={selectedWeek}
              onWeekChange={setSelectedWeek}
              className="flex-1"
            />
          </div>

          {/* Current timetable info */}
          {currentTimetable && (
            <div className="flex items-center gap-4">
              <Badge variant={isPublished ? 'success' : 'warning'}>
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
              {currentTimetable.batch_name && (
                <span className="text-sm text-gray-600">
                  Batch: {currentTimetable.batch_name}
                  {currentTimetable.batch_program_name && ` (${currentTimetable.batch_program_name})`}
                </span>
              )}
              {currentTimetable.created_by_name && (
                <span className="text-sm text-gray-600">
                  Created by: {currentTimetable.created_by_name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Timetable display/edit */}
        {!filterBatch || !filterAcademicPeriod ? (
          <div className="text-center py-12 text-gray-500">
            Please select Academic Period and Batch to view timetable
          </div>
        ) : currentTimetable || viewMode === 'create' || viewMode === 'edit' ? (
          <>
            {viewMode === 'view' && displayTimetable && (
              <>
                <TimetableTableView timetable={displayTimetable} />
                {canEdit && isDraft && (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={handleEdit}>Edit</Button>
                    <Button onClick={handlePublish} variant="primary">
                      Publish
                    </Button>
                  </div>
                )}
              </>
            )}

            {(viewMode === 'edit' || viewMode === 'create') && (
              <>
                {displayTimetable || viewMode === 'create' ? (
                  <>
                    <TimetableEditor
                      timetable={displayTimetable || {
                        week_start_date: selectedWeek.toISOString().split('T')[0],
                        id: undefined,
                        cells: [],
                      }}
                      onCellChange={handleCellChange}
                    />
                    <div className="mt-4 flex gap-2">
                      <Button onClick={handleSave} disabled={saveCellsMutation.isPending || createMutation.isPending}>
                        {saveCellsMutation.isPending || createMutation.isPending ? 'Saving...' : displayTimetable ? 'Save Changes' : 'Create & Save'}
                      </Button>
                      {viewMode === 'edit' && isDraft && displayTimetable && (
                        <Button onClick={handlePublish} variant="primary" disabled={publishMutation.isPending}>
                          {publishMutation.isPending ? 'Publishing...' : 'Publish'}
                        </Button>
                      )}
                      <Button onClick={handleCancel} variant="ghost">
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No timetable found for this week and batch.
            {canEdit && ' Click "Add New" to create one.'}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
