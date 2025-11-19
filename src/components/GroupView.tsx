import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'
import { HabitCard } from './HabitCard'
import type { Habit, HabitEntry } from '@/types/habit'

interface GroupViewProps {
  habits: Habit[]
  entries: HabitEntry
  streakMap: Map<string, number>
  completionMap: Map<string, number>
  goalProgressMap: Map<string, { completed: number; target: number; percentage: number }>
  onEditHabit?: (habit: Habit) => void
  onDeleteHabit?: (habitId: string) => void
  onFocusHabit?: (habitId: string) => void
  groupBy?: 'category' | 'tag' | 'none'
}

export function GroupView({
  habits,
  streakMap,
  completionMap,
  goalProgressMap,
  onEditHabit,
  onDeleteHabit,
  onFocusHabit,
  groupBy = 'category',
}: GroupViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']))

  const groupedHabits = useMemo(() => {
    if (groupBy === 'none') {
      return { 'all': habits }
    }

    const groups: Record<string, Habit[]> = {}
    
    habits.forEach((habit) => {
      if (groupBy === 'category') {
        const key = habit.category || 'Uncategorized'
        if (!groups[key]) groups[key] = []
        groups[key].push(habit)
      } else if (groupBy === 'tag') {
        if (habit.tags && habit.tags.length > 0) {
          habit.tags.forEach((tag) => {
            if (!groups[tag]) groups[tag] = []
            groups[tag].push(habit)
          })
        } else {
          if (!groups['No Tags']) groups['No Tags'] = []
          groups['No Tags'].push(habit)
        }
      }
    })

    return groups
  }, [habits, groupBy])

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }

  const getGroupStats = (groupHabits: Habit[]) => {
    const totalStreak = groupHabits.reduce((sum, h) => sum + (streakMap.get(h.id) || 0), 0)
    const avgCompletion = groupHabits.reduce((sum, h) => sum + (completionMap.get(h.id) || 0), 0) / groupHabits.length
    return { totalStreak, avgCompletion: Math.round(avgCompletion) }
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedHabits).map(([groupKey, groupHabits]) => {
        const isExpanded = expandedGroups.has(groupKey)
        const stats = getGroupStats(groupHabits)

        return (
          <div key={groupKey} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <button
              onClick={() => toggleGroup(groupKey)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <Folder className="w-5 h-5 text-[#0071E3]" />
                <div className="text-left">
                  <div className="font-semibold text-[#1D1D1F] dark:text-zinc-50">
                    {groupKey}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-zinc-400">
                    {groupHabits.length} habit(s) · Avg {stats.avgCompletion}% · {stats.totalStreak} total streak
                  </div>
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className={onFocusHabit ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
                    onClick={() => onFocusHabit?.(habit.id)}
                  >
                    <HabitCard
                      habit={habit}
                      streak={streakMap.get(habit.id) || 0}
                      completionRate={completionMap.get(habit.id) || 0}
                      goalProgress={goalProgressMap.get(habit.id)}
                      onEditHabit={onEditHabit}
                      onDeleteHabit={onDeleteHabit}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

