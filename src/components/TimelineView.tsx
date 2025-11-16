import { useMemo } from 'react'
import { CheckCircle2, Minus, Circle } from 'lucide-react'
import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

interface TimelineViewProps {
  habits: Habit[]
  entries: HabitEntry
  days?: number
  onSetHabitStatus?: (habitId: string, date: Date, status: 'done' | 'skip' | null) => void
}

export function TimelineView({ habits, entries, days = 30, onSetHabitStatus }: TimelineViewProps) {
  const timelineData = useMemo(() => {
    const today = new Date()
    const data: Array<{
      date: Date
      dateStr: string
      habits: Array<{ habit: Habit; status: 'done' | 'skip' | null }>
    }> = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = getUtcKeyForLocalDay(date)

      const habitStatuses = habits.map((habit) => ({
        habit,
        status: entries[dateStr]?.[habit.id] as 'done' | 'skip' | null,
      }))

      data.push({ date, dateStr, habits: habitStatuses })
    }

    return data
  }, [habits, entries, days])

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
      <h3 className="text-xl font-semibold text-[#1D1D1F] dark:text-zinc-50 mb-6">
        Timeline View
      </h3>

      <div className="space-y-4">
        {timelineData.map(({ date, dateStr, habits: habitStatuses }) => {
          const isToday = date.toDateString() === new Date().toDateString()
          const completedCount = habitStatuses.filter(h => h.status === 'done').length

          return (
            <div
              key={dateStr}
              className={`
                flex items-center gap-4 p-4 rounded-lg border
                ${isToday ? 'border-[#0071E3] bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-zinc-800'}
              `}
            >
              <div className="w-24 text-sm font-medium text-gray-700 dark:text-zinc-300">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {isToday && <span className="ml-2 text-[#0071E3]">(Today)</span>}
              </div>

              <div className="flex-1 flex items-center gap-2 flex-wrap">
                {habitStatuses.map(({ habit, status }) => (
                  <button
                    key={habit.id}
                    onClick={() => {
                      if (onSetHabitStatus) {
                        if (status === 'done') {
                          onSetHabitStatus(habit.id, date, null)
                        } else if (status === 'skip') {
                          onSetHabitStatus(habit.id, date, 'done')
                        } else {
                          onSetHabitStatus(habit.id, date, 'done')
                        }
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      if (onSetHabitStatus) {
                        if (status === 'done') {
                          onSetHabitStatus(habit.id, date, 'skip')
                        } else if (status === 'skip') {
                          onSetHabitStatus(habit.id, date, null)
                        } else {
                          onSetHabitStatus(habit.id, date, 'skip')
                        }
                      }
                    }}
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded transition-all
                      ${status === 'done' ? 'bg-[#34C759] text-white' : ''}
                      ${status === 'skip' ? 'bg-gray-400 text-white' : ''}
                      ${!status ? 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400' : ''}
                      hover:scale-105 active:scale-95
                    `}
                    title={habit.name}
                  >
                    <span className="text-sm">{habit.emoji}</span>
                    {status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                    {status === 'skip' && <Minus className="w-3 h-3" />}
                    {!status && <Circle className="w-3 h-3" />}
                  </button>
                ))}
              </div>

              <div className="text-sm text-gray-600 dark:text-zinc-400">
                {completedCount} / {habitStatuses.length}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

