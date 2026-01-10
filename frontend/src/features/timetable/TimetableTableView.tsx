/**
 * Timetable Table View Component
 * Displays timetable in table format: rows = days, columns = time slots
 */
import { useMemo } from 'react'
import { format } from 'date-fns'
import { WeeklyTimetable, TimetableCell } from '@/types'

interface TimetableTableViewProps {
  timetable: WeeklyTimetable
  timeSlots?: string[] // Default time slots if not provided
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

export function TimetableTableView({ timetable, timeSlots = DEFAULT_TIME_SLOTS }: TimetableTableViewProps) {
  // Create a map of cells by day and time slot for easy lookup
  const cellMap = useMemo(() => {
    const map = new Map<string, TimetableCell>()
    if (timetable.cells) {
      timetable.cells.forEach(cell => {
        const key = `${cell.day_of_week}-${cell.time_slot}`
        map.set(key, cell)
      })
    }
    return map
  }, [timetable.cells])

  // Get cell for a specific day and time slot
  const getCell = (day: number, timeSlot: string): TimetableCell | undefined => {
    const key = `${day}-${timeSlot}`
    return cellMap.get(key)
  }

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
                className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 min-w-[120px]"
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
                  const cell = getCell(day.value, slot)
                  const isEmpty = !cell || (!cell.line1 && !cell.line2 && !cell.line3)
                  
                  return (
                    <td
                      key={`${day.value}-${slot}`}
                      className="border border-gray-300 px-3 py-2 align-top min-h-[100px]"
                    >
                      {isEmpty ? (
                        <div className="text-gray-400 text-xs text-center py-4">-</div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          {cell.line1 && (
                            <div className="font-medium text-gray-900">{cell.line1}</div>
                          )}
                          {cell.line2 && (
                            <div className="text-gray-600">{cell.line2}</div>
                          )}
                          {cell.line3 && (
                            <div className="text-gray-500 text-xs">{cell.line3}</div>
                          )}
                        </div>
                      )}
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
