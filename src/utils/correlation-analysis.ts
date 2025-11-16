import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

export interface Correlation {
  habit1Id: string
  habit2Id: string
  correlation: number // -1 to 1
  strength: 'weak' | 'moderate' | 'strong'
}

export function calculateCorrelation(
  habit1Id: string,
  habit2Id: string,
  entries: HabitEntry,
  days: number = 30
): number {
  const today = new Date()
  const dateRange: Array<{ date: Date; h1: boolean; h2: boolean }> = []

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = getUtcKeyForLocalDay(date)
    dateRange.push({
      date,
      h1: entries[dateStr]?.[habit1Id] === 'done',
      h2: entries[dateStr]?.[habit2Id] === 'done',
    })
  }

  const h1Mean = dateRange.filter(d => d.h1).length / dateRange.length
  const h2Mean = dateRange.filter(d => d.h2).length / dateRange.length

  let numerator = 0
  let h1Variance = 0
  let h2Variance = 0

  dateRange.forEach(({ h1, h2 }) => {
    const h1Diff = (h1 ? 1 : 0) - h1Mean
    const h2Diff = (h2 ? 1 : 0) - h2Mean
    numerator += h1Diff * h2Diff
    h1Variance += h1Diff * h1Diff
    h2Variance += h2Diff * h2Diff
  })

  const denominator = Math.sqrt(h1Variance * h2Variance)
  if (denominator === 0) return 0

  return numerator / denominator
}

export function calculateAllCorrelations(
  habits: Habit[],
  entries: HabitEntry,
  days: number = 30
): Correlation[] {
  const correlations: Correlation[] = []

  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const corr = calculateCorrelation(habits[i].id, habits[j].id, entries, days)
      const absCorr = Math.abs(corr)
      
      if (absCorr > 0.1) { // Only include meaningful correlations
        correlations.push({
          habit1Id: habits[i].id,
          habit2Id: habits[j].id,
          correlation: corr,
          strength: absCorr > 0.7 ? 'strong' : absCorr > 0.4 ? 'moderate' : 'weak',
        })
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
}

export function buildCorrelationMatrix(
  habits: Habit[],
  entries: HabitEntry,
  days: number = 30
): number[][] {
  const matrix: number[][] = []

  habits.forEach((habit1) => {
    const row: number[] = []
    habits.forEach((habit2) => {
      if (habit1.id === habit2.id) {
        row.push(1)
      } else {
        row.push(calculateCorrelation(habit1.id, habit2.id, entries, days))
      }
    })
    matrix.push(row)
  })

  return matrix
}

