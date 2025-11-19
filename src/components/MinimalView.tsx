import { CheckCircle2, Minus } from 'lucide-react'
import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay, getUtcWeekDates } from '@/lib/utils'

interface MinimalViewProps {
  habits: Habit[]
  entries: HabitEntry
  weekStart: Date
  onSetHabitStatus: (habitId: string, date: Date, status: 'done' | 'skip' | null) => void
}

export function MinimalView({ habits, entries, weekStart, onSetHabitStatus }: MinimalViewProps) {
  const weekDates = getUtcWeekDates(weekStart)

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{habit.emoji}</span>
              <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50 flex-1">
                {habit.name}
              </h3>
            </div>
            <div className="flex gap-2">
              {weekDates.map((date) => {
                const dateStr = getUtcKeyForLocalDay(date)
                const status = entries[dateStr]?.[habit.id]
                const isToday = date.toDateString() === new Date().toDateString()

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      if (status === 'done') {
                        onSetHabitStatus(habit.id, date, null)
                      } else if (status === 'skip') {
                        onSetHabitStatus(habit.id, date, 'done')
                      } else {
                        onSetHabitStatus(habit.id, date, 'done')
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      if (status === 'done') {
                        onSetHabitStatus(habit.id, date, 'skip')
                      } else if (status === 'skip') {
                        onSetHabitStatus(habit.id, date, null)
                      } else {
                        onSetHabitStatus(habit.id, date, 'skip')
                      }
                    }}
                    className={`
                      w-10 h-10 rounded-lg border-2 transition-all
                      ${isToday ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-300 dark:border-zinc-600'}
                      ${status === 'done' ? 'bg-[#34C759] border-[#34C759]' : ''}
                      ${status === 'skip' ? 'bg-gray-400 dark:bg-zinc-600 border-gray-400 dark:border-zinc-600' : ''}
                      ${!status ? 'bg-white dark:bg-zinc-900' : ''}
                      hover:scale-105 active:scale-95
                    `}
                    title={date.toLocaleDateString()}
                  >
                    {status === 'done' && <CheckCircle2 className="w-5 h-5 mx-auto text-white" />}
                    {status === 'skip' && <Minus className="w-5 h-5 mx-auto text-white" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

