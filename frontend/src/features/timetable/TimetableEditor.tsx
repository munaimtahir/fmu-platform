/**
 * Timetable Editor Component
 * Editable table with 3-line text inputs per cell
 */
import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { WeeklyTimetable, TimetableCell } from '@/types'
import { Input } from '@/components/ui/Input'

interface TimetableEditorProps {
  timetable: WeeklyTimetable | { week_start_date: string; id?: number; cells?: TimetableCell[] }
  timeSlots?: string[]
  onCellChange: (day: number, timeSlot: string, line1: string, line2: string, line3: string) => void
}

const DEFAULT_TIME_SLOTS = [
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
]

const DAYS = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
]

interface CellData {
  line1: string
  line2: string
  line3: string
}

export function TimetableEditor({ timetable, timeSlots = DEFAULT_TIME_SLOTS, onCellChange }: TimetableEditorProps) {
  // Initialize cell data from timetable cells
  const [cellData, setCellData] = useState<Map<string, CellData>>(() => {
    const map = new Map<string, CellData>()
    if ('cells' in timetable && timetable.cells) {
      timetable.cells.forEach(cell => {
        const key = `${cell.day_of_week}-${cell.time_slot}`
        map.set(key, {
          line1: cell.line1 || '',
          line2: cell.line2 || '',
          line3: cell.line3 || '',
        })
      })
    }
    return map
  })

  // Get or create cell data
  const getCellData = useCallback((day: number, timeSlot: string): CellData => {
    const key = `${day}-${timeSlot}`
    return cellData.get(key) || { line1: '', line2: '', line3: '' }
  }, [cellData])

  // Handle input change
  const handleInputChange = useCallback((
    day: number,
    timeSlot: string,
    field: 'line1' | 'line2' | 'line3',
    value: string
  ) => {
    const key = `${day}-${timeSlot}`
    const current = getCellData(day, timeSlot)
    const updated = { ...current, [field]: value }
    
    setCellData(prev => {
      const next = new Map(prev)
      next.set(key, updated)
      return next
    })

    // Notify parent of change
    onCellChange(day, timeSlot, updated.line1, updated.line2, updated.line3)
  }, [getCellData, onCellChange])

  // Get week date for a specific day
  const getDayDate = (dayIndex: number): Date => {
    const weekStart = new Date(timetable.week_start_date)
    weekStart.setDate(weekStart.getDate() + dayIndex)
    return weekStart
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 bg-white">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
              Day / Time
            </th>
            {timeSlots.map((slot) => (
              <th
                key={slot}
                className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 min-w-[180px]"
              >
                {slot}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => {
            const dayDate = getDayDate(day.value)
            return (
              <tr key={day.value} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  <div>{day.label}</div>
                  <div className="text-xs text-gray-500">
                    {format(dayDate, 'MMM dd')}
                  </div>
                </td>
                {timeSlots.map((slot) => {
                  const cell = getCellData(day.value, slot)
                  
                  return (
                    <td
                      key={`${day.value}-${slot}`}
                      className="border border-gray-300 px-2 py-2 align-top"
                    >
                      <div className="space-y-1">
                        <Input
                          type="text"
                          value={cell.line1}
                          onChange={(e) => handleInputChange(day.value, slot, 'line1', e.target.value)}
                          placeholder="Line 1 (e.g., Course)"
                          className="text-sm py-1"
                          maxLength={200}
                        />
                        <Input
                          type="text"
                          value={cell.line2}
                          onChange={(e) => handleInputChange(day.value, slot, 'line2', e.target.value)}
                          placeholder="Line 2 (e.g., Room)"
                          className="text-sm py-1"
                          maxLength={200}
                        />
                        <Input
                          type="text"
                          value={cell.line3}
                          onChange={(e) => handleInputChange(day.value, slot, 'line3', e.target.value)}
                          placeholder="Line 3 (e.g., Faculty)"
                          className="text-sm py-1"
                          maxLength={200}
                        />
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
