import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

export interface Achievement {
  type: 'streak' | 'goal' | 'milestone'
  habitId: string
  habitName: string
  value: number
  message: string
  timestamp: number
}

const MILESTONE_STREAKS = [7, 14, 30, 50, 100, 200, 365]

export class AchievementDetector {
  static detectAchievements(
    habit: Habit,
    _entries: HabitEntry,
    previousStreak: number,
    currentStreak: number,
    previousGoalProgress?: { completed: number; target: number; percentage: number },
    currentGoalProgress?: { completed: number; target: number; percentage: number }
  ): Achievement[] {
    const achievements: Achievement[] = []
    const now = Date.now()

    // Streak milestones
    if (currentStreak > previousStreak) {
      const newMilestone = MILESTONE_STREAKS.find(
        milestone => currentStreak >= milestone && previousStreak < milestone
      )
      if (newMilestone) {
        achievements.push({
          type: 'milestone',
          habitId: habit.id,
          habitName: habit.name,
          value: newMilestone,
          message: `🎉 ${newMilestone} day streak! Amazing work!`,
          timestamp: now,
        })
      }

      // General streak achievement
      if (currentStreak > previousStreak && currentStreak > 0) {
        achievements.push({
          type: 'streak',
          habitId: habit.id,
          habitName: habit.name,
          value: currentStreak,
          message: `🔥 ${currentStreak} day streak! Keep it up!`,
          timestamp: now,
        })
      }
    }

    // Goal achievements
    if (currentGoalProgress && previousGoalProgress) {
      const goalType = habit.goalType || 'daily'
      const goalValue = habit.goalValue || 1

      // Weekly goal achievement
      if (goalType === 'weekly' && currentGoalProgress.percentage >= 100 && previousGoalProgress.percentage < 100) {
        achievements.push({
          type: 'goal',
          habitId: habit.id,
          habitName: habit.name,
          value: currentGoalProgress.completed,
          message: `🎯 Weekly goal achieved! ${currentGoalProgress.completed}/${goalValue} times completed!`,
          timestamp: now,
        })
      }

      // Monthly goal achievement
      if (goalType === 'monthly' && currentGoalProgress.percentage >= 100 && previousGoalProgress.percentage < 100) {
        achievements.push({
          type: 'goal',
          habitId: habit.id,
          habitName: habit.name,
          value: currentGoalProgress.completed,
          message: `🎯 Monthly goal achieved! ${currentGoalProgress.completed}/${goalValue} times completed!`,
          timestamp: now,
        })
      }

      // Daily goal - perfect week
      if (goalType === 'daily' && currentGoalProgress.percentage === 100 && previousGoalProgress.percentage < 100) {
        achievements.push({
          type: 'goal',
          habitId: habit.id,
          habitName: habit.name,
          value: currentGoalProgress.completed,
          message: `⭐ Perfect week! All ${currentGoalProgress.completed} days completed!`,
          timestamp: now,
        })
      }
    }

    return achievements
  }

  static calculateStreak(habitId: string, entries: HabitEntry, upToDate?: Date): number {
    const checkDate = upToDate || new Date()
    let streak = 0

    for (let i = 0; i < 730; i++) {
      const date = new Date(checkDate)
      date.setDate(checkDate.getDate() - i)
      const dateStr = getUtcKeyForLocalDay(date)
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
}

