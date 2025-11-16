import { useState } from 'react'
import { CheckCircle2, Minus, ArrowLeft, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay, getUtcWeekDates } from '@/lib/utils'

interface FocusModeProps {
  habit: Habit
  entries: HabitEntry
  weekStart: Date
  streak: number
  completionRate: number
  onSetHabitStatus: (habitId: string, date: Date, status: 'done' | 'skip' | null) => void
  onBack: () => void
}

export function FocusMode({ 
  habit, 
  entries, 
  weekStart, 
  streak, 
  completionRate,
  onSetHabitStatus,
  onBack 
}: FocusModeProps) {
  const weekDates = getUtcWeekDates(weekStart)
  const completedCount = weekDates.filter(date => {
    const dateStr = getUtcKeyForLocalDay(date)
    return entries[dateStr]?.[habit.id] === 'done'
  }).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{habit.emoji}</div>
            <h1 className="text-4xl font-bold text-[#1D1D1F] dark:text-zinc-50 mb-2">
              {habit.name}
            </h1>
            {habit.description && (
              <p className="text-gray-600 dark:text-zinc-400">{habit.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-zinc-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-[#0071E3] mb-1">{streak}</div>
              <div className="text-sm text-gray-600 dark:text-zinc-400">Day Streak</div>
            </div>
            <div className="bg-green-50 dark:bg-zinc-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-[#34C759] mb-1">{completionRate}%</div>
              <div className="text-sm text-gray-600 dark:text-zinc-400">This Week</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                Week Progress
              </span>
              <span className="text-sm text-gray-600 dark:text-zinc-400">
                {completedCount} / {weekDates.length}
              </span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50 mb-4">
              This Week
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date) => {
                const dateStr = getUtcKeyForLocalDay(date)
                const status = entries[dateStr]?.[habit.id]
                const isToday = date.toDateString() === new Date().toDateString()
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })

                return (
                  <div key={dateStr} className="text-center">
                    <div className="text-xs text-gray-500 dark:text-zinc-400 mb-1">
                      {dayName}
                    </div>
                    <button
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
                        w-full aspect-square rounded-xl border-2 transition-all
                        ${isToday ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-300 dark:border-zinc-600'}
                        ${status === 'done' ? 'bg-[#34C759] border-[#34C759]' : ''}
                        ${status === 'skip' ? 'bg-gray-400 dark:bg-zinc-600 border-gray-400 dark:border-zinc-600' : ''}
                        ${!status ? 'bg-white dark:bg-zinc-900' : ''}
                        hover:scale-105 active:scale-95
                      `}
                    >
                      {status === 'done' && <CheckCircle2 className="w-6 h-6 mx-auto text-white" />}
                      {status === 'skip' && <Minus className="w-6 h-6 mx-auto text-white" />}
                      {!status && isToday && (
                        <Target className="w-4 h-4 mx-auto text-[#0071E3]" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

