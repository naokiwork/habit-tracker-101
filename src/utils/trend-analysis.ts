import type { HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

export interface TrendData {
  date: string
  completionRate: number
  movingAverage7?: number
  movingAverage30?: number
}

export interface TrendAnalysis {
  habitId: string
  trend: 'improving' | 'declining' | 'stable'
  trendStrength: number // -1 to 1
  recentAverage: number
  previousAverage: number
  changePercentage: number
}

export function calculateMovingAverage(
  data: number[],
  window: number
): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1)
    const windowData = data.slice(start, i + 1)
    const average = windowData.reduce((sum, val) => sum + val, 0) / windowData.length
    result.push(average)
  }
  return result
}

export function analyzeTrend(
  habitId: string,
  entries: HabitEntry,
  days: number = 30
): TrendAnalysis {
  const today = new Date()
  const data: { date: Date; completed: boolean }[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = getUtcKeyForLocalDay(date)
    data.push({
      date,
      completed: entries[dateStr]?.[habitId] === 'done',
    })
  }

  data.reverse() // Oldest first

  const recentPeriod = Math.floor(days / 2)
  const recentData = data.slice(-recentPeriod)
  const previousData = data.slice(0, recentPeriod)

  const recentAverage = recentData.filter(d => d.completed).length / recentData.length
  const previousAverage = previousData.filter(d => d.completed).length / previousData.length

  const changePercentage = previousAverage > 0
    ? ((recentAverage - previousAverage) / previousAverage) * 100
    : recentAverage > 0 ? 100 : 0

  let trend: 'improving' | 'declining' | 'stable'
  let trendStrength: number

  if (Math.abs(changePercentage) < 5) {
    trend = 'stable'
    trendStrength = 0
  } else if (changePercentage > 0) {
    trend = 'improving'
    trendStrength = Math.min(changePercentage / 50, 1) // Normalize to 0-1
  } else {
    trend = 'declining'
    trendStrength = Math.max(changePercentage / 50, -1) // Normalize to -1-0
  }

  return {
    habitId,
    trend,
    trendStrength,
    recentAverage: recentAverage * 100,
    previousAverage: previousAverage * 100,
    changePercentage,
  }
}

export function getTrendData(
  habitId: string,
  entries: HabitEntry,
  days: number = 30
): TrendData[] {
  const today = new Date()
  const data: TrendData[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - i))
    const dateStr = getUtcKeyForLocalDay(date)
    const completed = entries[dateStr]?.[habitId] === 'done'
    data.push({
      date: dateStr,
      completionRate: completed ? 100 : 0,
    })
  }

  const completionRates = data.map(d => d.completionRate)
  const ma7 = calculateMovingAverage(completionRates, 7)
  const ma30 = calculateMovingAverage(completionRates, 30)

  return data.map((d, i) => ({
    ...d,
    movingAverage7: ma7[i],
    movingAverage30: ma30[i],
  }))
}
