import { memo } from 'react'
import { MoreVertical, Pencil, Trash2, Share2 } from 'lucide-react'
import { ShareDialog } from './ShareDialog'
import { AnimatedCounter } from './AnimatedCounter'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import type { Habit } from '@/types/habit'

interface HabitCardProps {
  habit: Habit
  streak: number
  completionRate: number
  goalProgress?: { completed: number; target: number; percentage: number }
  onEditHabit?: (habit: Habit) => void
  onDeleteHabit?: (habitId: string) => void
}

function HabitCardComponent({ habit, streak, completionRate, goalProgress, onEditHabit, onDeleteHabit }: HabitCardProps) {
  const goalType = habit.goalType || 'daily'
  const goalValue = habit.goalValue || 1
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 hover-lift transition-all-smooth animate-fade-in transition-colors duration-200">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{habit.emoji}</span>
        <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50 flex-1 transition-colors duration-200">{habit.name}</h3>
        {(onEditHabit || onDeleteHabit) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
      {habit.description && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-zinc-300 transition-colors duration-200">{habit.description}</p>
        </div>
      )}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-200">Current Streak</span>
          <AnimatedCounter
            value={streak}
            className="text-2xl font-bold"
            style={{ color: habit.color }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-200">This Week</span>
          <span className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">{completionRate}%</span>
        </div>
        {goalProgress && goalType !== 'daily' && (
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-zinc-400">
                {goalType === 'weekly' && `Weekly Goal: ${goalProgress.completed}/${goalProgress.target}`}
                {goalType === 'monthly' && `Monthly Goal: ${goalProgress.completed}/${goalProgress.target}`}
                {goalType === 'custom' && `Custom Goal: ${goalProgress.completed}/${goalProgress.target}`}
              </span>
              <span className="text-gray-600 dark:text-zinc-400 font-medium">{goalProgress.percentage}%</span>
            </div>
            <Progress value={Math.min(goalProgress.percentage, 100)} className="h-2" />
          </div>
        )}
      </div>
    </div>
  )
}

export const HabitCard = memo(HabitCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.habit.id === nextProps.habit.id &&
    prevProps.habit.name === nextProps.habit.name &&
    prevProps.habit.emoji === nextProps.habit.emoji &&
    prevProps.habit.color === nextProps.habit.color &&
    prevProps.habit.goalType === nextProps.habit.goalType &&
    prevProps.habit.goalValue === nextProps.habit.goalValue &&
    prevProps.streak === nextProps.streak &&
    prevProps.completionRate === nextProps.completionRate &&
    prevProps.goalProgress?.completed === nextProps.goalProgress?.completed &&
    prevProps.goalProgress?.target === nextProps.goalProgress?.target &&
    prevProps.goalProgress?.percentage === nextProps.goalProgress?.percentage
  )
})

