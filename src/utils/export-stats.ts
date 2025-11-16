import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

export interface StatsExportData {
  habits: Array<{
    id: string
    name: string
    emoji: string
    category?: string
    tags?: string[]
  }>
  stats: Array<{
    date: string
    habitId: string
    habitName: string
    status: 'done' | 'skip' | null
    streak: number
  }>
  summary: {
    totalHabits: number
    totalDays: number
    completionRate: number
    averageStreak: number
  }
  period: {
    startDate: string
    endDate: string
    days: number
  }
}

export function exportStatsToCSV(
  habits: Habit[],
  entries: HabitEntry,
  startDate: Date,
  endDate: Date
): string {
  const dates: string[] = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    dates.push(getUtcKeyForLocalDay(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const headers = ['Date', 'Habit', 'Status', 'Streak']
  const rows: string[][] = [headers]

  dates.forEach((dateStr) => {
    habits.forEach((habit) => {
      const status = entries[dateStr]?.[habit.id] || null
      const streak = calculateStreak(habit.id, entries, dateStr)
      rows.push([
        dateStr,
        habit.name,
        status || '',
        streak.toString(),
      ])
    })
  })

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
}

export function exportStatsToJSON(
  habits: Habit[],
  entries: HabitEntry,
  startDate: Date,
  endDate: Date
): StatsExportData {
  const dates: string[] = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    dates.push(getUtcKeyForLocalDay(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const stats: StatsExportData['stats'] = []
  const streaks: number[] = []

  dates.forEach((dateStr) => {
    habits.forEach((habit) => {
      const status = entries[dateStr]?.[habit.id] || null
      const streak = calculateStreak(habit.id, entries, dateStr)
      streaks.push(streak)
      stats.push({
        date: dateStr,
        habitId: habit.id,
        habitName: habit.name,
        status,
        streak,
      })
    })
  })

  const totalPossible = habits.length * dates.length
  const totalCompleted = stats.filter(s => s.status === 'done').length
  const completionRate = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0
  const averageStreak = streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0

  return {
    habits: habits.map(h => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      category: h.category,
      tags: h.tags,
    })),
    stats,
    summary: {
      totalHabits: habits.length,
      totalDays: dates.length,
      completionRate: Math.round(completionRate * 100) / 100,
      averageStreak: Math.round(averageStreak * 100) / 100,
    },
    period: {
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      days: dates.length,
    },
  }
}

function calculateStreak(habitId: string, entries: HabitEntry, upToDate: string): number {
  let streak = 0
  const date = new Date(upToDate + 'T00:00:00Z')
  
  for (let i = 0; i < 730; i++) {
    const checkDate = new Date(date)
    checkDate.setDate(date.getDate() - i)
    const dateStr = getUtcKeyForLocalDay(checkDate)
    const status = entries[dateStr]?.[habitId]
    
    if (status === 'done') {
      streak++
    } else if (status === 'skip') {
      continue
    } else {
      break
    }
  }
  
  return streak
}

export function downloadStatsAsCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadStatsAsJSON(jsonData: StatsExportData, filename: string): void {
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

