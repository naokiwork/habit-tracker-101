import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

export interface DayOfWeekPattern {
  habitId: string
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
  completionRate: number
}

export interface WeeklyPattern {
  habitId: string
  weekNumber: number
  completionRate: number
}

export interface Pattern {
  type: 'day-of-week' | 'weekly' | 'monthly'
  habitId: string
  description: string
  confidence: number
}

export function detectDayOfWeekPattern(
  habitId: string,
  entries: HabitEntry,
  weeks: number = 8
): DayOfWeekPattern[] {
  const today = new Date()
  const patterns: Map<number, { completed: number; total: number }> = new Map()

  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - (w * 7) - today.getDay())

    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + d)
      const dayOfWeek = date.getDay()
      const dateStr = getUtcKeyForLocalDay(date)

      if (!patterns.has(dayOfWeek)) {
        patterns.set(dayOfWeek, { completed: 0, total: 0 })
      }

      const pattern = patterns.get(dayOfWeek)!
      pattern.total++
      if (entries[dateStr]?.[habitId] === 'done') {
        pattern.completed++
      }
    }
  }

  return Array.from(patterns.entries()).map(([dayOfWeek, { completed, total }]) => ({
    habitId,
    dayOfWeek,
    completionRate: Math.round((completed / total) * 100),
  }))
}

export function detectWeeklyPattern(
  habitId: string,
  entries: HabitEntry,
  weeks: number = 12
): WeeklyPattern[] {
  const today = new Date()
  const patterns: WeeklyPattern[] = []

  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - (w * 7) - today.getDay())

    let completed = 0
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + d)
      const dateStr = getUtcKeyForLocalDay(date)
      if (entries[dateStr]?.[habitId] === 'done') {
        completed++
      }
    }

    patterns.push({
      habitId,
      weekNumber: w,
      completionRate: Math.round((completed / 7) * 100),
    })
  }

  return patterns.reverse()
}

export function detectPatterns(
  habitId: string,
  entries: HabitEntry
): Pattern[] {
  const patterns: Pattern[] = []
  const dayPatterns = detectDayOfWeekPattern(habitId, entries, 8)

  // Find strongest day pattern
  const bestDay = dayPatterns.reduce((best, current) =>
    current.completionRate > best.completionRate ? current : best
  )

  if (bestDay.completionRate > 80) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    patterns.push({
      type: 'day-of-week',
      habitId,
      description: `Strongest on ${dayNames[bestDay.dayOfWeek]} (${bestDay.completionRate}% completion)`,
      confidence: bestDay.completionRate / 100,
    })
  }

  return patterns
}

