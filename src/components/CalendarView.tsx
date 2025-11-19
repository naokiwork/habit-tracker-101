import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

interface CalendarViewProps {
  habits: Habit[]
  entries: HabitEntry
  onSetHabitStatus: (habitId: string, date: Date, status: 'done' | 'skip' | null) => void
  onDateClick?: (date: Date) => void
}

export function CalendarView({ habits, entries, onDateClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    })
  }

  // Next month days
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getHabitStatusForDate = (habitId: string, date: Date) => {
    const dateStr = getUtcKeyForLocalDay(date)
    return entries[dateStr]?.[habitId]
  }

  const getDateCompletionCount = (date: Date) => {
    const dateStr = getUtcKeyForLocalDay(date)
    return habits.filter(h => entries[dateStr]?.[h.id] === 'done').length
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-zinc-50">
          {monthNames[month]} {year}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 dark:text-zinc-400 p-2"
          >
            {day}
          </div>
        ))}

        {days.map(({ date, isCurrentMonth }, index) => {
          const completionCount = getDateCompletionCount(date)
          const totalHabits = habits.length
          const completionRate = totalHabits > 0 ? (completionCount / totalHabits) * 100 : 0

          return (
            <button
              key={index}
              onClick={() => onDateClick?.(date)}
              className={`
                aspect-square rounded-lg border-2 p-1 transition-all
                ${isCurrentMonth ? 'border-gray-300 dark:border-zinc-600' : 'border-gray-200 dark:border-zinc-700 opacity-50'}
                ${isToday(date) ? 'ring-2 ring-[#0071E3] border-[#0071E3]' : ''}
                hover:scale-105 active:scale-95
              `}
              style={{
                backgroundColor: completionRate > 0
                  ? `rgba(52, 199, 89, ${completionRate / 100})`
                  : 'transparent',
              }}
            >
              <div className="text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                {date.getDate()}
              </div>
              <div className="flex gap-0.5 justify-center flex-wrap">
                {habits.slice(0, 4).map((habit) => {
                  const status = getHabitStatusForDate(habit.id, date)
                  return (
                    <div
                      key={habit.id}
                      className={`
                        w-2 h-2 rounded-full
                        ${status === 'done' ? 'bg-[#34C759]' : ''}
                        ${status === 'skip' ? 'bg-gray-400' : ''}
                        ${!status ? 'bg-gray-200 dark:bg-zinc-700' : ''}
                      `}
                      title={habit.name}
                    />
                  )
                })}
                {habits.length > 4 && (
                  <div className="text-[8px] text-gray-500">+{habits.length - 4}</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

