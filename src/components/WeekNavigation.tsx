import { Button } from '@/components/ui/button'
import { getUtcWeekDates, getUtcWeekStart, isSameUtcDay } from '@/lib/utils'

interface WeekNavigationProps {
  weekStart: Date
  onNavigate: (direction: 'prev' | 'next') => void
  onGoToToday: () => void
}

export function WeekNavigation({ weekStart, onNavigate, onGoToToday }: WeekNavigationProps) {
  const weekDates = getUtcWeekDates(weekStart)
  const isCurrentWeek = isSameUtcDay(weekStart, getUtcWeekStart(new Date()))

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Button
        onClick={() => onNavigate('prev')}
        variant="outline"
        className="rounded-full px-4 py-2.5 sm:py-2 border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-all-smooth hover:scale-110 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Previous week"
      >
        ←
      </Button>
      <div className="text-center min-w-[180px] sm:min-w-[200px] flex-1">
        <div className="text-lg sm:text-xl font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">
          {formatDisplayDate(weekDates[0])} - {formatDisplayDate(weekDates[6])}
        </div>
        {!isCurrentWeek && (
          <Button
            onClick={onGoToToday}
            variant="link"
            className="text-[#0071E3] dark:text-blue-400 text-sm mt-1 touch-manipulation min-h-[44px] transition-colors duration-200"
          >
            Go to Today
          </Button>
        )}
      </div>
      <Button
        onClick={() => onNavigate('next')}
        variant="outline"
        className="rounded-full px-4 py-2.5 sm:py-2 border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-all-smooth hover:scale-110 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px]"
        aria-label="Next week"
      >
        →
      </Button>
    </div>
  )
}
