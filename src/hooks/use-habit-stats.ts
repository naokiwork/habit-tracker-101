import { useMemo, useCallback } from 'react'
import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay, getUtcWeekDates } from '@/lib/utils'

export function useHabitStats(
  habits: Habit[],
  entries: HabitEntry,
  weekStart: Date
) {
  const getStreak = useCallback(
    (habitId: string): number => {
      let streak = 0
      const today = new Date()
      for (let i = 0; i < 730; i++) {
        const localDate = new Date(today)
        localDate.setDate(today.getDate() - i)
        const dateStr = getUtcKeyForLocalDay(localDate)
        const status = entries[dateStr]?.[habitId]
        if (status === 'done') {
          streak++
        } else if (status === 'skip') {
          // Skip doesn't break the streak, but doesn't count either
          continue
        } else {
          break
        }
      }
      return streak
    },
    [entries]
  )

  const getCompletionRate = useCallback(
    (habitId: string): number => {
      const habit = habits.find((h) => h.id === habitId)
      if (!habit) return 0

      const goalType = habit.goalType || 'daily'
      const goalValue = habit.goalValue || 1
      const weekDates = getUtcWeekDates(weekStart)

      if (goalType === 'daily') {
        const completed = weekDates.filter((date) => {
          const dateStr = getUtcKeyForLocalDay(date)
          return entries[dateStr]?.[habitId] === 'done'
        }).length
        const totalDays = weekDates.filter((date) => {
          const dateStr = getUtcKeyForLocalDay(date)
          const status = entries[dateStr]?.[habitId]
          return status !== 'skip'
        }).length
        return totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0
      } else if (goalType === 'weekly') {
        const completed = weekDates.filter((date) => {
          const dateStr = getUtcKeyForLocalDay(date)
          return entries[dateStr]?.[habitId] === 'done'
        }).length
        return Math.round((completed / goalValue) * 100)
      } else if (goalType === 'monthly') {
        // Calculate for current month
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        const monthDates: Date[] = []
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
          monthDates.push(new Date(d))
        }
        const completed = monthDates.filter((date) => {
          const dateStr = getUtcKeyForLocalDay(date)
          return entries[dateStr]?.[habitId] === 'done'
        }).length
        return Math.round((completed / goalValue) * 100)
      } else if (goalType === 'custom' && habit.goalDays) {
        const completed = weekDates.filter((date) => {
          const dayOfWeek = date.getDay()
          if (!habit.goalDays?.includes(dayOfWeek)) return false
          const dateStr = getUtcKeyForLocalDay(date)
          return entries[dateStr]?.[habitId] === 'done'
        }).length
        const targetDays = weekDates.filter((date) => {
          const dayOfWeek = date.getDay()
          return habit.goalDays?.includes(dayOfWeek)
        }).length
        return targetDays > 0 ? Math.round((completed / targetDays) * 100) : 0
      }

      return 0
    },
    [entries, weekStart, habits]
  )

  const getTotalCompletionRate = useCallback((): number => {
    if (habits.length === 0) return 0
    const weekDates = getUtcWeekDates(weekStart)
    let totalCompleted = 0
    let totalPossible = 0

    weekDates.forEach((date) => {
      const dateStr = getUtcKeyForLocalDay(date)
      habits.forEach((habit) => {
        const status = entries[dateStr]?.[habit.id]
        if (status === 'done') {
          totalCompleted++
        }
        // Count only non-skipped days in denominator
        if (status !== 'skip') {
          totalPossible++
        }
      })
    })

    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
  }, [habits, entries, weekStart])

  const streakMap = useMemo(() => {
    const map = new Map<string, number>()
    habits.forEach((habit) => {
      map.set(habit.id, getStreak(habit.id))
    })
    return map
  }, [habits, getStreak])

  const completionMap = useMemo(() => {
    const map = new Map<string, number>()
    habits.forEach((habit) => {
      map.set(habit.id, getCompletionRate(habit.id))
    })
    return map
  }, [habits, getCompletionRate])

  const getGoalProgress = useCallback(
    (habitId: string): { completed: number; target: number; percentage: number } => {
      const habit = habits.find((h) => h.id === habitId)
      if (!habit) return { completed: 0, target: 0, percentage: 0 }

      const goalType = habit.goalType || 'daily'
      const goalValue = habit.goalValue || 1
      const weekDates = getUtcWeekDates(weekStart)

      if (goalType === 'daily') {
        const completed = weekDates.filter((date) => {
          const dateStr = getUtcKeyForLocalDay(date)
          return entries[dateStr]?.[habitId] === 'done'
        }).length
        const target = weekDates.length
        return { completed, target, percentage: target > 0 ? Math.round((completed / target) * 100) : 0 }
      } else if (goalType === 'weekly') {
        const completed = weekDates.filter((date) => {
          const dateStr = getUtcKeyForLocalDay(date)
          return entries[dateStr]?.[habitId] === 'done'
        }).length
        return { completed, target: goalValue, percentage: Math.round((completed / goalValue) * 100) }
      } else if (goalType === 'monthly') {
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        const monthDates: Date[] = []
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
          monthDates.push(new Date(d))
        }
        const completed = monthDates.filter((date) => {
          const dateStr = getUtcKeyForLocalDay(date)
          return entries[dateStr]?.[habitId] === 'done'
        }).length
        return { completed, target: goalValue, percentage: Math.round((completed / goalValue) * 100) }
      } else if (goalType === 'custom' && habit.goalDays) {
        const completed = weekDates.filter((date) => {
          const dayOfWeek = date.getDay()
          if (!habit.goalDays?.includes(dayOfWeek)) return false
          const dateStr = getUtcKeyForLocalDay(date)
          return entries[dateStr]?.[habitId] === 'done'
        }).length
        const target = weekDates.filter((date) => {
          const dayOfWeek = date.getDay()
          return habit.goalDays?.includes(dayOfWeek)
        }).length
        return { completed, target, percentage: target > 0 ? Math.round((completed / target) * 100) : 0 }
      }

      return { completed: 0, target: 0, percentage: 0 }
    },
    [entries, weekStart, habits]
  )

  return {
    getStreak,
    getCompletionRate,
    getTotalCompletionRate,
    getGoalProgress,
    streakMap,
    completionMap,
  }
}

