import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HabitCard } from './HabitCard'
import { useHabitStats } from '@/hooks/use-habit-stats'
import type { Habit, HabitEntry } from '@/types/habit'
import { ArrowLeft } from 'lucide-react'

interface ArchiveViewProps {
  habits: Habit[]
  entries: HabitEntry
  streakMap: Map<string, number>
  completionMap: Map<string, number>
  onRestoreHabit: (habitId: string) => void
  onDeleteHabit: (habitId: string) => void
  onBack: () => void
}

export function ArchiveView({
  habits,
  entries,
  streakMap,
  completionMap,
  onRestoreHabit,
  onDeleteHabit,
  onBack,
}: ArchiveViewProps) {
  const { getGoalProgress } = useHabitStats(habits, entries, new Date())

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <Archive className="w-16 h-16 mx-auto text-gray-400 dark:text-zinc-600 mb-4" />
        <h2 className="text-2xl font-semibold text-[#1D1D1F] dark:text-zinc-50 mb-2">No archived habits</h2>
        <p className="text-gray-600 dark:text-zinc-400 mb-6">
          You don't have any archived habits yet.
        </p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Active Habits
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#1D1D1F] dark:text-zinc-50 mb-1">
            Archived Habits
          </h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            {habits.length} {habits.length === 1 ? 'habit' : 'habits'} archived
          </p>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Active Habits
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => {
          const streak = streakMap.get(habit.id) ?? 0
          const completionRate = completionMap.get(habit.id) ?? 0
          const goalProgress = getGoalProgress(habit)

          return (
            <div
              key={habit.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 hover-lift transition-all-smooth animate-fade-in transition-colors duration-200 relative"
            >
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onRestoreHabit(habit.id)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteHabit(habit.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Permanently
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <HabitCard
                habit={habit}
                streak={streak}
                completionRate={completionRate}
                goalProgress={goalProgress}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

