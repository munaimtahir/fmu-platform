/**
 * Week Selector Component
 * Allows selecting a week by choosing the Monday of that week
 */
import { useMemo } from 'react'
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'

interface WeekSelectorProps {
  selectedWeekStart: Date | null
  onWeekChange: (weekStart: Date) => void
  className?: string
}

export function WeekSelector({ selectedWeekStart, onWeekChange, className = '' }: WeekSelectorProps) {
  // Ensure selectedWeekStart is always a Monday
  const mondayDate = useMemo(() => {
    if (!selectedWeekStart) return null
    return startOfWeek(selectedWeekStart, { weekStartsOn: 1 }) // Monday = 1
  }, [selectedWeekStart])

  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Ensure it's a Monday
      const monday = startOfWeek(date, { weekStartsOn: 1 })
      onWeekChange(monday)
    }
  }

  const handlePreviousWeek = () => {
    if (mondayDate) {
      onWeekChange(subWeeks(mondayDate, 1))
    } else {
      const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
      onWeekChange(subWeeks(thisMonday, 1))
    }
  }

  const handleNextWeek = () => {
    if (mondayDate) {
      onWeekChange(addWeeks(mondayDate, 1))
    } else {
      const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
      onWeekChange(addWeeks(thisMonday, 1))
    }
  }

  const handleThisWeek = () => {
    const thisMonday = startOfWeek(new Date(), { weekStartsOn: 1 })
    onWeekChange(thisMonday)
  }

  const weekRange = useMemo(() => {
    if (!mondayDate) return ''
    const saturday = new Date(mondayDate)
    saturday.setDate(saturday.getDate() + 5) // Monday + 5 days = Saturday
    return `${format(mondayDate, 'MMM dd')} - ${format(saturday, 'MMM dd, yyyy')}`
  }, [mondayDate])

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handlePreviousWeek}
        aria-label="Previous week"
      >
        ←
      </Button>
      
      <div className="flex items-center gap-2">
        <DatePicker
          value={mondayDate}
          onChange={handleDateChange}
          placeholder="Select week (Monday)"
          className="w-48"
        />
        {weekRange && (
          <span className="text-sm text-gray-600 whitespace-nowrap">
            ({weekRange})
          </span>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleNextWeek}
        aria-label="Next week"
      >
        →
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleThisWeek}
        className="ml-2"
      >
        This Week
      </Button>
    </div>
  )
}
