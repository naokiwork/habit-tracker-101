import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

export interface GoalAnalysis {
  habitId: string
  goalType: 'daily' | 'weekly' | 'monthly' | 'custom'
  goalValue: number
  currentProgress: number
  achievementRate: number
  trend: 'improving' | 'declining' | 'stable'
  missedDays: number[]
  recommendations: string[]
}

export function analyzeGoalProgress(
  habit: Habit,
  entries: HabitEntry,
  days: number = 30
): GoalAnalysis {
  const today = new Date()
  const dateRange: Date[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    dateRange.push(date)
  }

  const goalType = habit.goalType || 'daily'
  const goalValue = habit.goalValue || 1

  let currentProgress = 0
  const missedDays: number[] = []

  if (goalType === 'daily') {
    dateRange.forEach((date, index) => {
      const dateStr = getUtcKeyForLocalDay(date)
      if (entries[dateStr]?.[habit.id] === 'done') {
        currentProgress++
      } else {
        missedDays.push(index)
      }
    })
  } else if (goalType === 'weekly') {
    const weeks = Math.ceil(days / 7)
    let weeklyCompletions = 0
    for (let w = 0; w < weeks; w++) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - (w * 7))
      let weekCompleted = 0
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + d)
        const dateStr = getUtcKeyForLocalDay(date)
        if (entries[dateStr]?.[habit.id] === 'done') {
          weekCompleted++
        }
      }
      if (weekCompleted >= goalValue) {
        weeklyCompletions++
      } else {
        missedDays.push(w)
      }
    }
    currentProgress = weeklyCompletions
  } else if (goalType === 'monthly') {
    const months = Math.ceil(days / 30)
    let monthlyCompletions = 0
    for (let m = 0; m < months; m++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - m, 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - m + 1, 0)
      let monthCompleted = 0
      for (let d = 0; d <= monthEnd.getDate(); d++) {
        const date = new Date(monthStart)
        date.setDate(monthStart.getDate() + d)
        const dateStr = getUtcKeyForLocalDay(date)
        if (entries[dateStr]?.[habit.id] === 'done') {
          monthCompleted++
        }
      }
      if (monthCompleted >= goalValue) {
        monthlyCompletions++
      } else {
        missedDays.push(m)
      }
    }
    currentProgress = monthlyCompletions
  }

  const target = goalType === 'daily' ? days : goalType === 'weekly' ? Math.ceil(days / 7) : Math.ceil(days / 30)
  const achievementRate = target > 0 ? Math.round((currentProgress / target) * 100) : 0

  // Determine trend (simplified)
  const recentProgress = goalType === 'daily' 
    ? dateRange.slice(0, Math.floor(days / 2)).filter(d => entries[getUtcKeyForLocalDay(d)]?.[habit.id] === 'done').length
    : currentProgress / 2
  const olderProgress = currentProgress - recentProgress
  const trend: 'improving' | 'declining' | 'stable' = 
    recentProgress > olderProgress ? 'improving' :
    recentProgress < olderProgress ? 'declining' : 'stable'

  // Generate recommendations
  const recommendations: string[] = []
  if (achievementRate < 50) {
    recommendations.push('Consider reducing your goal to make it more achievable')
  }
  if (missedDays.length > days * 0.3) {
    recommendations.push('You\'re missing many days. Try setting reminders or adjusting your schedule')
  }
  if (trend === 'improving') {
    recommendations.push('Great progress! Keep up the momentum')
  } else if (trend === 'declining') {
    recommendations.push('Your progress is declining. Review what\'s working and adjust your approach')
  }

  return {
    habitId: habit.id,
    goalType,
    goalValue,
    currentProgress,
    achievementRate,
    trend,
    missedDays,
    recommendations,
  }
}

