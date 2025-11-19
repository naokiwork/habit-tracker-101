import { useMemo } from 'react'
import type { Habit, HabitEntry } from '@/types/habit'
import { analyzeTrend, getTrendData, type TrendAnalysis, type TrendData } from '@/utils/trend-analysis'
import { predictFutureCompletion, type Prediction } from '@/utils/prediction'

export function useTrendAnalysis(
  habits: Habit[],
  entries: HabitEntry,
  days: number = 30
) {
  const trendData = useMemo(() => {
    const data: Map<string, TrendData[]> = new Map()
    habits.forEach(habit => {
      data.set(habit.id, getTrendData(habit.id, entries, days))
    })
    return data
  }, [habits, entries, days])

  const trendAnalysis = useMemo(() => {
    const analysis: Map<string, TrendAnalysis> = new Map()
    habits.forEach(habit => {
      analysis.set(habit.id, analyzeTrend(habit.id, entries, days))
    })
    return analysis
  }, [habits, entries, days])

  const predictions = useMemo(() => {
    const preds: Map<string, Prediction> = new Map()
    habits.forEach(habit => {
      preds.set(habit.id, predictFutureCompletion(habit.id, entries, 7, days))
    })
    return preds
  }, [habits, entries, days])

  return {
    trendData,
    trendAnalysis,
    predictions,
  }
}

