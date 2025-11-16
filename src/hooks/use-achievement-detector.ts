import { useMemo } from 'react'
import type { HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

export interface Achievement {
  type: 'streak-7' | 'streak-30' | 'streak-100' | 'streak-365' | 'perfect-week' | 'perfect-month'
  message: string
  emoji: string
}

export function useAchievementDetector(habitId: string, entries: HabitEntry) {
  const achievements = useMemo(() => {
    const detected: Achievement[] = []
    const today = new Date()

    // Calculate streak
    let streak = 0
    for (let i = 0; i < 730; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = getUtcKeyForLocalDay(date)
      if (entries[dateStr]?.[habitId] === 'done') {
        streak++
      } else {
        break
      }
    }

    // Check streak milestones
    if (streak === 7) {
      detected.push({
        type: 'streak-7',
        message: '7 Day Streak! 🔥',
        emoji: '🔥',
      })
    } else if (streak === 30) {
      detected.push({
        type: 'streak-30',
        message: '30 Day Streak! ⭐',
        emoji: '⭐',
      })
    } else if (streak === 100) {
      detected.push({
        type: 'streak-100',
        message: '100 Day Streak! 👑',
        emoji: '👑',
      })
    } else if (streak === 365) {
      detected.push({
        type: 'streak-365',
        message: '365 Day Streak! 🌟',
        emoji: '🌟',
      })
    }

    // Check perfect week
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      return getUtcKeyForLocalDay(date)
    })

    const weekCompleted = weekDates.every(dateStr => entries[dateStr]?.[habitId] === 'done')
    if (weekCompleted && weekDates.includes(getUtcKeyForLocalDay(today))) {
      detected.push({
        type: 'perfect-week',
        message: 'Perfect Week! 💯',
        emoji: '💯',
      })
    }

    return detected
  }, [habitId, entries])

  return achievements
}

