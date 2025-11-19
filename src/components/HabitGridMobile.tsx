import { CheckCircle2, Minus, MoreVertical, Pencil, Trash2, RotateCcw, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AnimatedCounter } from './AnimatedCounter'
import { useRipple } from '@/hooks/use-ripple'
import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay, getUtcWeekDates } from '@/lib/utils'

interface HabitGridMobileProps {
  habits: Habit[]
  entries: HabitEntry
  weekStart: Date
  streakMap: Map<string, number>
  completionMap: Map<string, number>
  onToggleHabit: (habitId: string, date: Date) => void
  onSetHabitStatus?: (habitId: string, date: Date, status: 'done' | 'skip' | null) => void
  onEditHabit?: (habit: Habit) => void
  onDeleteHabit?: (habitId: string) => void
  onArchiveHabit?: (habitId: string) => void
}

export function HabitGridMobile({
  habits,
  entries,
  weekStart,
  streakMap,
  completionMap,
  onToggleHabit,
  onSetHabitStatus,
  onEditHabit,
  onDeleteHabit,
  onArchiveHabit,
}: HabitGridMobileProps) {
  const weekDates = getUtcWeekDates(weekStart)
  const createRipple = useRipple()

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const handleContextMenuAction = (habitId: string, date: Date, action: 'done' | 'skip' | 'reset') => {
    if (!onSetHabitStatus) return
    if (action === 'reset') {
      onSetHabitStatus(habitId, date, null)
    } else {
      onSetHabitStatus(habitId, date, action)
    }
  }

  return (
    <div className="space-y-4">
      {habits.map((habit) => {
        const streak = streakMap.get(habit.id) ?? 0
        const completionRate = completionMap.get(habit.id) ?? 0
        const today = new Date()

        return (
          <div
            key={habit.id}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 shadow-sm transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{habit.emoji}</span>
                <span className="text-base font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">{habit.name}</span>
              </div>
              {(onEditHabit || onDeleteHabit || onArchiveHabit) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEditHabit && (
                      <DropdownMenuItem onClick={() => onEditHabit(habit)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                      {onArchiveHabit && (
                        <DropdownMenuItem
                          onClick={() => onArchiveHabit(habit.id)}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      {onDeleteHabit && (
                        <DropdownMenuItem
                          onClick={() => onDeleteHabit(habit.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-3 min-w-max pb-2">
                {weekDates.map((date) => {
                  const dateStr = getUtcKeyForLocalDay(date)
                  const status = entries[dateStr]?.[habit.id]
                  const isDone = status === 'done'
                  const isSkipped = status === 'skip'
                  const isToday =
                    date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate()

                  return (
                    <div key={dateStr} className="flex flex-col items-center gap-2 min-w-[60px]">
                      <div className="text-xs text-gray-500 dark:text-zinc-500 font-medium transition-colors duration-200">
                        {getDayName(date).slice(0, 3)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-zinc-400 transition-colors duration-200">
                        {date.getDate()}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <TooltipTrigger asChild>
                                <button
                                  data-habit-id={habit.id}
                                  data-date={dateStr}
                                  onClick={(e) => {
                                    createRipple(e)
                                    onToggleHabit(habit.id, date)
                                  }}
                                  className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center transition-all-smooth active:scale-95 ripple-effect relative overflow-hidden touch-manipulation ${
                                      isDone
                                        ? 'shadow-md animate-scale-in'
                                        : isSkipped
                                        ? 'bg-gray-200 dark:bg-zinc-700 border-2 border-gray-300 dark:border-zinc-600'
                                        : isToday
                                        ? 'border-2 border-dashed border-gray-300 dark:border-zinc-600 active:border-gray-400 dark:active:border-zinc-500 active:bg-gray-50 dark:active:bg-zinc-800'
                                        : 'border border-gray-200 dark:border-zinc-700 active:border-gray-300 dark:active:border-zinc-600 active:bg-gray-50 dark:active:bg-zinc-800'
                                    }`}
                                    style={{
                                      backgroundColor: isDone ? habit.color : isSkipped ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? '#3F3F46' : '#E5E7EB') : 'transparent',
                                    }}
                                  aria-label={`Toggle ${habit.name} on ${formatDisplayDate(date)}`}
                                  aria-pressed={isDone}
                                >
                                  {isDone && (
                                    <CheckCircle2 className="w-6 h-6 text-white" aria-hidden="true" />
                                  )}
                                  {isSkipped && (
                                    <Minus className="w-6 h-6 text-gray-500" aria-hidden="true" />
                                  )}
                                  <span className="sr-only">
                                    {isDone ? 'Completed' : isSkipped ? 'Skipped' : 'Not completed'}
                                  </span>
                                </button>
                              </TooltipTrigger>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                onClick={() => handleContextMenuAction(habit.id, date, 'done')}
                                className={isDone ? 'bg-gray-100' : ''}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as Done
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() => handleContextMenuAction(habit.id, date, 'skip')}
                                className={isSkipped ? 'bg-gray-100' : ''}
                              >
                                <Minus className="mr-2 h-4 w-4" />
                                Mark as Skipped
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem
                                onClick={() => handleContextMenuAction(habit.id, date, 'reset')}
                                disabled={!isDone && !isSkipped}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                          <TooltipContent>
                            <p>
                              {formatDisplayDate(date)} -{' '}
                              {isDone ? 'Completed' : isSkipped ? 'Skipped' : 'Not completed'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between transition-colors duration-200">
              <div className="flex items-center gap-2">
                <AnimatedCounter
                  value={streak}
                  className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200"
                />
                <span className="text-sm text-gray-500 dark:text-zinc-400 transition-colors duration-200">day streak</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-zinc-400 transition-colors duration-200">
                {completionRate}% this week
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

