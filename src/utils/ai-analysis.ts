import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

export interface Insight {
  type: 'pattern' | 'anomaly' | 'trend' | 'recommendation'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  habitId?: string
}

export interface Pattern {
  type: 'day-of-week' | 'time-of-day' | 'streak' | 'decline'
  description: string
  confidence: number
  habitId: string
}

export interface Recommendation {
  type: 'goal-adjustment' | 'habit-addition' | 'optimization' | 'break'
  title: string
  description: string
  action?: string
  habitId?: string
}

// Analyze habit patterns
export function detectPatterns(habits: Habit[], entries: HabitEntry): Pattern[] {
  const patterns: Pattern[] = []
  const today = new Date()
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    return { date, dateStr: getUtcKeyForLocalDay(date) }
  })

  habits.forEach((habit) => {
    // Day of week pattern
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
    last30Days.forEach(({ date, dateStr }) => {
      if (entries[dateStr]?.[habit.id] === 'done') {
        dayOfWeekCounts[date.getDay()]++
      }
    })

    const maxDay = Math.max(...dayOfWeekCounts)
    const minDay = Math.min(...dayOfWeekCounts)
    if (maxDay > minDay * 2 && maxDay >= 3) {
      const bestDay = dayOfWeekCounts.indexOf(maxDay)
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      patterns.push({
        type: 'day-of-week',
        description: `You're most consistent on ${dayNames[bestDay]}s`,
        confidence: Math.min(maxDay / 10, 1),
        habitId: habit.id,
      })
    }

    // Decline pattern
    const firstHalf = last30Days.slice(0, 15).filter(({ dateStr }) => 
      entries[dateStr]?.[habit.id] === 'done'
    ).length
    const secondHalf = last30Days.slice(15).filter(({ dateStr }) => 
      entries[dateStr]?.[habit.id] === 'done'
    ).length

    if (firstHalf > secondHalf * 1.5 && firstHalf >= 5) {
      patterns.push({
        type: 'decline',
        description: 'Completion rate has decreased recently',
        confidence: Math.min((firstHalf - secondHalf) / 10, 1),
        habitId: habit.id,
      })
    }
  })

  return patterns
}

// Detect anomalies
export function detectAnomalies(habits: Habit[], entries: HabitEntry): Insight[] {
  const insights: Insight[] = []
  const today = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    return { date, dateStr: getUtcKeyForLocalDay(date) }
  })

  habits.forEach((habit) => {
    const recentCompletions = last7Days.filter(({ dateStr }) => 
      entries[dateStr]?.[habit.id] === 'done'
    ).length

    // Check for sudden drop
    if (recentCompletions === 0) {
      insights.push({
        type: 'anomaly',
        title: 'No recent activity',
        description: `${habit.name} hasn't been completed in the last 7 days`,
        priority: 'high',
        habitId: habit.id,
      })
    }
  })

  return insights
}

// Generate recommendations
export function generateRecommendations(
  habits: Habit[],
  _entries: HabitEntry,
  streaks: Map<string, number>,
  completionRates: Map<string, number>
): Recommendation[] {
  const recommendations: Recommendation[] = []

  habits.forEach((habit) => {
    const streak = streaks.get(habit.id) || 0
    const completionRate = completionRates.get(habit.id) || 0
    const goalType = habit.goalType || 'daily'

    // Goal adjustment recommendations
    if (completionRate >= 90 && goalType === 'daily') {
      recommendations.push({
        type: 'goal-adjustment',
        title: 'Consider increasing goal',
        description: `${habit.name} is consistently completed. Consider adding more challenge.`,
        habitId: habit.id,
      })
    } else if (completionRate < 30 && goalType === 'daily') {
      recommendations.push({
        type: 'goal-adjustment',
        title: 'Consider adjusting goal',
        description: `${habit.name} has low completion rate. Consider making it more achievable.`,
        habitId: habit.id,
      })
    }

    // Break recommendation for long streaks
    if (streak >= 30) {
      recommendations.push({
        type: 'break',
        title: 'Great streak!',
        description: `You've maintained ${habit.name} for ${streak} days. Consider taking a planned break to avoid burnout.`,
        habitId: habit.id,
      })
    }
  })

  // Habit addition recommendations based on patterns
  if (habits.length < 5) {
    const commonHabits = [
      { name: 'Drink Water', emoji: '💧', description: 'Stay hydrated throughout the day' },
      { name: 'Exercise', emoji: '🏃', description: 'Get your body moving' },
      { name: 'Read', emoji: '📚', description: 'Expand your knowledge' },
      { name: 'Meditate', emoji: '🧘', description: 'Take time for mindfulness' },
    ]

    const existingNames = habits.map(h => h.name.toLowerCase())
    const suggestion = commonHabits.find(h => 
      !existingNames.some(name => name.includes(h.name.toLowerCase()) || h.name.toLowerCase().includes(name))
    )

    if (suggestion) {
      recommendations.push({
        type: 'habit-addition',
        title: 'Add a new habit',
        description: `Consider adding "${suggestion.name}" to your routine: ${suggestion.description}`,
      })
    }
  }

  return recommendations
}

// Analyze trends
export function analyzeTrends(habits: Habit[], entries: HabitEntry): Insight[] {
  const insights: Insight[] = []
  const today = new Date()
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    return { date, dateStr: getUtcKeyForLocalDay(date) }
  })
  const previous7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - 7 - i)
    return { date, dateStr: getUtcKeyForLocalDay(date) }
  })

  habits.forEach((habit) => {
    const recentCompletions = last7Days.filter(({ dateStr }) => 
      entries[dateStr]?.[habit.id] === 'done'
    ).length
    const previousCompletions = previous7Days.filter(({ dateStr }) => 
      entries[dateStr]?.[habit.id] === 'done'
    ).length

    if (recentCompletions > previousCompletions * 1.2) {
      insights.push({
        type: 'trend',
        title: 'Improving trend',
        description: `${habit.name} completion rate has improved compared to last week`,
        priority: 'medium',
        habitId: habit.id,
      })
    } else if (recentCompletions < previousCompletions * 0.8) {
      insights.push({
        type: 'trend',
        title: 'Declining trend',
        description: `${habit.name} completion rate has decreased compared to last week`,
        priority: 'high',
        habitId: habit.id,
      })
    }
  })

  return insights
}

// Get weekly insights summary
export function getWeeklyInsights(
  habits: Habit[],
  _entries: HabitEntry,
  streaks: Map<string, number>,
  completionRates: Map<string, number>
): Insight[] {
  const insights: Insight[] = []

  // Overall completion rate
  const totalCompletion = Array.from(completionRates.values()).reduce((a, b) => a + b, 0) / habits.length
  if (totalCompletion >= 80) {
    insights.push({
      type: 'trend',
      title: 'Excellent week!',
      description: `You've maintained a ${Math.round(totalCompletion)}% completion rate across all habits`,
      priority: 'low',
    })
  } else if (totalCompletion < 50) {
    insights.push({
      type: 'trend',
      title: 'Room for improvement',
      description: `Your overall completion rate is ${Math.round(totalCompletion)}%. Focus on consistency.`,
      priority: 'high',
    })
  }

  // Longest streak
  const maxStreak = Math.max(...Array.from(streaks.values()), 0)
  if (maxStreak >= 7) {
    const habitWithStreak = habits.find(h => (streaks.get(h.id) || 0) === maxStreak)
    if (habitWithStreak) {
      insights.push({
        type: 'pattern',
        title: 'Impressive streak!',
        description: `${habitWithStreak.name} has a ${maxStreak}-day streak. Keep it up!`,
        priority: 'medium',
        habitId: habitWithStreak.id,
      })
    }
  }

  return insights
}

