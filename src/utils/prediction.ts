import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'
import { analyzeTrend, getTrendData } from './trend-analysis'

export interface Prediction {
  habitId: string
  predictedCompletionRate: number // 0-100
  daysToGoal?: number // Estimated days to reach goal
  confidence: number // 0-1
}

export function predictFutureCompletion(
  habitId: string,
  entries: HabitEntry,
  daysAhead: number = 7,
  lookbackDays: number = 30
): Prediction {
  const trend = analyzeTrend(habitId, entries, lookbackDays)
  const trendData = getTrendData(habitId, entries, lookbackDays)

  // Use recent average and trend to predict
  const recentAverage = trend.recentAverage / 100
  const trendFactor = trend.trendStrength * 0.1 // Small adjustment based on trend

  // Simple linear prediction: current rate + trend adjustment
  const predictedRate = Math.max(0, Math.min(100, (recentAverage + trendFactor) * 100))

  // Confidence based on data consistency
  const recentRates = trendData.slice(-7).map(d => d.completionRate)
  const variance = recentRates.reduce((sum, rate) => {
    const diff = rate - recentRates.reduce((a, b) => a + b, 0) / recentRates.length
    return sum + diff * diff
  }, 0) / recentRates.length
  const confidence = Math.max(0.3, Math.min(1, 1 - variance / 10000))

  return {
    habitId,
    predictedCompletionRate: Math.round(predictedRate),
    confidence: Math.round(confidence * 100) / 100,
  }
}

export function predictDaysToGoal(
  habit: Habit,
  entries: HabitEntry,
  lookbackDays: number = 30
): number | undefined {
  if (!habit.goalType || !habit.goalValue) return undefined

  const trend = analyzeTrend(habit.id, entries, lookbackDays)
  const currentRate = trend.recentAverage / 100

  if (habit.goalType === 'daily') {
    // For daily goals, if current rate is 100%, already achieved
    return currentRate >= 1 ? 0 : undefined
  }

  // For weekly/monthly goals, estimate based on current completion rate
  const trendData = getTrendData(habit.id, entries, lookbackDays)
  const recentCompletions = trendData.slice(-7).filter(d => d.completionRate === 100).length
  const weeklyRate = recentCompletions / 7

  if (habit.goalType === 'weekly') {
    const neededCompletions = habit.goalValue - recentCompletions
    if (neededCompletions <= 0) return 0
    if (weeklyRate === 0) return undefined // Can't predict if no recent activity
    return Math.ceil(neededCompletions / weeklyRate)
  }

  if (habit.goalType === 'monthly') {
    const monthlyCompletions = trendData.filter(d => d.completionRate === 100).length
    const neededCompletions = habit.goalValue - monthlyCompletions
    if (neededCompletions <= 0) return 0
    if (weeklyRate === 0) return undefined
    return Math.ceil(neededCompletions / weeklyRate)
  }

  return undefined
}

export function predictAllHabits(
  habits: Habit[],
  entries: HabitEntry,
  daysAhead: number = 7
): Prediction[] {
  return habits.map(habit => {
    const prediction = predictFutureCompletion(habit.id, entries, daysAhead)
    const daysToGoal = predictDaysToGoal(habit, entries)
    return {
      ...prediction,
      daysToGoal,
    }
  })
}
