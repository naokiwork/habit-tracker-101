import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

export interface BenchmarkData {
  current: number
  previous: number
  best: number
  growthRate: number
  period: 'week' | 'month' | 'year'
}

export interface BestPeriod {
  period: string
  completionRate: number
  date: Date
}

export function calculateBenchmark(
  habitId: string,
  entries: HabitEntry,
  period: 'week' | 'month' = 'week'
): BenchmarkData {
  const today = new Date()
  let currentStart: Date
  let previousStart: Date
  let bestPeriod: BestPeriod | null = null

  if (period === 'week') {
    currentStart = new Date(today)
    currentStart.setDate(today.getDate() - today.getDay())
    previousStart = new Date(currentStart)
    previousStart.setDate(previousStart.getDate() - 7)
  } else {
    currentStart = new Date(today.getFullYear(), today.getMonth(), 1)
    previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  }

  const getPeriodCompletion = (start: Date, days: number) => {
    let completed = 0
    for (let i = 0; i < days; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      const dateStr = getUtcKeyForLocalDay(date)
      if (entries[dateStr]?.[habitId] === 'done') {
        completed++
      }
    }
    return completed
  }

  const daysInPeriod = period === 'week' ? 7 : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const current = getPeriodCompletion(currentStart, daysInPeriod)
  const previous = getPeriodCompletion(previousStart, daysInPeriod)

  // Find best period (last 12 periods)
  for (let p = 0; p < 12; p++) {
    const periodStart = new Date(previousStart)
    if (period === 'week') {
      periodStart.setDate(previousStart.getDate() - (p * 7))
    } else {
      periodStart.setMonth(previousStart.getMonth() - p)
    }
    const completion = getPeriodCompletion(periodStart, daysInPeriod)
    if (!bestPeriod || completion > bestPeriod.completionRate) {
      bestPeriod = {
        period: periodStart.toLocaleDateString(),
        completionRate: completion,
        date: periodStart,
      }
    }
  }

  const growthRate = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0

  return {
    current,
    previous,
    best: bestPeriod?.completionRate || current,
    growthRate,
    period,
  }
}

export function findBestPeriod(
  habitId: string,
  entries: HabitEntry,
  period: 'week' | 'month' = 'week',
  lookback: number = 12
): BestPeriod | null {
  const today = new Date()
  let best: BestPeriod | null = null

  for (let i = 0; i < lookback; i++) {
    let periodStart: Date
    let daysInPeriod: number

    if (period === 'week') {
      periodStart = new Date(today)
      periodStart.setDate(today.getDate() - (i * 7) - today.getDay())
      daysInPeriod = 7
    } else {
      periodStart = new Date(today.getFullYear(), today.getMonth() - i, 1)
      daysInPeriod = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0).getDate()
    }

    let completed = 0
    for (let d = 0; d < daysInPeriod; d++) {
      const date = new Date(periodStart)
      date.setDate(periodStart.getDate() + d)
      const dateStr = getUtcKeyForLocalDay(date)
      if (entries[dateStr]?.[habitId] === 'done') {
        completed++
      }
    }

    const completionRate = Math.round((completed / daysInPeriod) * 100)
    if (!best || completionRate > best.completionRate) {
      best = {
        period: periodStart.toLocaleDateString(),
        completionRate,
        date: periodStart,
      }
    }
  }

  return best
}

