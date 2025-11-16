import { memo, useMemo, useState } from 'react'
import { CheckCircle2, MoreVertical, Pencil, Trash2, Minus, RotateCcw, Archive, GripVertical, Share2, Printer } from 'lucide-react'
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
import { ShareDialog } from './ShareDialog'
import { useRipple } from '@/hooks/use-ripple'
import type { Habit, HabitEntry } from '@/types/habit'
import { formatDateUTC, getUtcKeyForLocalDay, getUtcWeekDates } from '@/lib/utils'

interface HabitGridProps {
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
  onReorderHabits?: (habitId: string, newIndex: number) => void
}

interface HabitRowProps {
  habit: Habit
  weekDates: Date[]
  entries: HabitEntry
  streak: number
  completionRate: number
  onToggleHabit: (habitId: string, date: Date) => void
  onSetHabitStatus?: (habitId: string, date: Date, status: 'done' | 'skip' | null) => void
  onEditHabit?: (habit: Habit) => void
  onDeleteHabit?: (habitId: string) => void
  onArchiveHabit?: (habitId: string) => void
}

const HabitRow = memo(function HabitRow({
  habit,
  weekDates,
  entries,
  streak,
  completionRate,
  onToggleHabit,
  onSetHabitStatus,
  onEditHabit,
  onDeleteHabit,
  onArchiveHabit,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dragOver,
}: HabitRowProps & {
  onDragStart?: (e: React.DragEvent, habitId: string) => void
  onDragOver?: (e: React.DragEvent, habitId: string) => void
  onDrop?: (e: React.DragEvent, habitId: string) => void
  isDragging?: boolean
  dragOver?: boolean
}) {
  const createRipple = useRipple()

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <tr
      className={`border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors duration-150 ${isDragging ? 'opacity-50' : ''} ${dragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      role="row"
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart?.(e, habit.id)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver?.(e, habit.id)
      }}
      onDrop={(e) => onDrop?.(e, habit.id)}
    >
      <td className="sticky left-0 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 z-10 px-6 py-4 transition-colors duration-200" role="gridcell">
        <div className="flex items-center gap-3">
          {onDragStart && (
            <span
              className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </span>
          )}
          <span className="text-2xl" aria-hidden="true">{habit.emoji}</span>
          <span className="text-base font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">
            {habit.name}
          </span>
          {(onEditHabit || onDeleteHabit) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 ml-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEditHabit && (
                  <DropdownMenuItem onClick={() => onEditHabit(habit)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <ShareDialog habit={habit} trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                } />
                {onSetHabitStatus && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        const today = new Date()
                        onSetHabitStatus(habit.id, today, 'done')
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark Today as Done
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        const today = new Date()
                        onSetHabitStatus(habit.id, today, 'skip')
                      }}
                    >
                      <Minus className="mr-2 h-4 w-4" />
                      Skip Today
                    </DropdownMenuItem>
                  </>
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
      </td>
      {weekDates.map((date) => {
        const dateStr = getUtcKeyForLocalDay(date)
        const status = entries[dateStr]?.[habit.id]
        const isDone = status === 'done'
        const isSkipped = status === 'skip'
        const today = new Date()
        const isToday =
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate()

        const handleContextMenuAction = (action: 'done' | 'skip' | 'reset') => {
          if (!onSetHabitStatus) return
          if (action === 'reset') {
            onSetHabitStatus(habit.id, date, null)
          } else {
            onSetHabitStatus(habit.id, date, action)
          }
        }

        return (
          <td key={dateStr} className="px-4 py-4">
            <TooltipProvider>
              <Tooltip>
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          createRipple(e)
                          onToggleHabit(habit.id, date)
                        }}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all-smooth hover:scale-110 active:scale-95 ripple-effect relative overflow-hidden ${
                          isDone
                            ? 'shadow-md animate-scale-in'
                            : isSkipped
                            ? 'bg-gray-200 dark:bg-zinc-700 border-2 border-gray-300 dark:border-zinc-600'
                            : isToday
                            ? 'border-2 border-dashed border-gray-300 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                            : 'border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                        style={{
                          backgroundColor: isDone ? habit.color : isSkipped ? '#E5E7EB' : 'transparent',
                        }}
                        aria-label={`${isDone ? 'Mark as not completed' : isSkipped ? 'Mark as completed' : 'Mark as completed'} ${habit.name} on ${formatDisplayDate(date)}`}
                        aria-pressed={isDone}
                        aria-describedby={`tooltip-${habit.id}-${dateStr}`}
                      >
                        {isDone && (
                          <CheckCircle2 className="w-6 h-6 text-white animate-bounce" aria-hidden="true" />
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
                      onClick={() => handleContextMenuAction('done')}
                      className={isDone ? 'bg-gray-100' : ''}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark as Done
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => handleContextMenuAction('skip')}
                      className={isSkipped ? 'bg-gray-100' : ''}
                    >
                      <Minus className="mr-2 h-4 w-4" />
                      Mark as Skipped
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => handleContextMenuAction('reset')}
                      disabled={!isDone && !isSkipped}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                <TooltipContent id={`tooltip-${habit.id}-${dateStr}`}>
                  <p>
                    {formatDisplayDate(date)} -{' '}
                    {isDone ? 'Completed' : isSkipped ? 'Skipped' : 'Not completed'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </td>
        )
      })}
      <td className="px-6 py-4" role="gridcell">
        <div className="flex flex-col items-center gap-1" aria-label={`Statistics for ${habit.name}`}>
          <div className="flex items-center gap-1 text-sm">
            <AnimatedCounter
              value={streak}
              className="font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200"
              aria-label={`${streak} day streak`}
            />
            <span className="text-gray-500 dark:text-zinc-400 transition-colors duration-200">day streak</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-zinc-400 transition-colors duration-200" aria-label={`${completionRate}% completion rate this week`}>
            {completionRate}% this week
          </div>
        </div>
      </td>
    </tr>
  )
})

export function HabitGrid({
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
  onReorderHabits,
}: HabitGridProps) {
  const weekDates = useMemo(() => getUtcWeekDates(weekStart), [weekStart])
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null)
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null)

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const handleDragStart = (e: React.DragEvent, habitId: string) => {
    setDraggedHabitId(habitId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, habitId: string) => {
    e.preventDefault()
    if (draggedHabitId && draggedHabitId !== habitId) {
      setDragOverHabitId(habitId)
    }
  }

  const handleDrop = (e: React.DragEvent, habitId: string) => {
    e.preventDefault()
    if (draggedHabitId && draggedHabitId !== habitId && onReorderHabits) {
      const newIndex = habits.findIndex(h => h.id === habitId)
      onReorderHabits(draggedHabitId, newIndex)
    }
    setDraggedHabitId(null)
    setDragOverHabitId(null)
  }

  const handleDragEnd = () => {
    setDraggedHabitId(null)
    setDragOverHabitId(null)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden transition-colors duration-200">
      <div className="flex justify-end p-4 no-print">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label="Habit tracking grid">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800 transition-colors duration-200" role="row">
              <th className="sticky left-0 bg-gray-50 dark:bg-zinc-800 z-10 px-6 py-4 text-left transition-colors duration-200" scope="col">
                <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wide transition-colors duration-200">
                  Habit
                </span>
              </th>
              {weekDates.map((date) => (
                <th key={formatDateUTC(date)} className="px-4 py-4 text-center min-w-[100px]" scope="col" aria-label={`${getDayName(date)}, ${formatDisplayDate(date)}`}>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase transition-colors duration-200">
                      {getDayName(date)}
                    </span>
                    <span className="text-sm font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">
                      {date.getDate()}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-center" scope="col">
                <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wide transition-colors duration-200">
                  Stats
                </span>
              </th>
            </tr>
          </thead>
          <tbody onDragEnd={handleDragEnd}>
            {habits.map((habit) => {
              const streak = streakMap.get(habit.id) ?? 0
              const completionRate = completionMap.get(habit.id) ?? 0

              return (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  weekDates={weekDates}
                  entries={entries}
                  streak={streak}
                  completionRate={completionRate}
                  onToggleHabit={onToggleHabit}
                  onSetHabitStatus={onSetHabitStatus}
                  onEditHabit={onEditHabit}
                  onDeleteHabit={onDeleteHabit}
                  onArchiveHabit={onArchiveHabit}
                  onDragStart={onReorderHabits ? handleDragStart : undefined}
                  onDragOver={onReorderHabits ? handleDragOver : undefined}
                  onDrop={onReorderHabits ? handleDrop : undefined}
                  isDragging={draggedHabitId === habit.id}
                  dragOver={dragOverHabitId === habit.id}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

