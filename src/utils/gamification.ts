import type { Habit, HabitEntry } from '@/types/habit'
import type { Badge, Challenge, UserProgress } from '@/types/challenge'
import { getUtcKeyForLocalDay } from '@/lib/utils'

const STORAGE_KEY = 'habitgrid-gamification'

// Points calculation
export function calculatePoints(_habitId: string, _entries: HabitEntry, _date: string): number {
  // Base points for completion
  return 10
}

// Experience calculation
export function calculateExperience(_habitId: string, _entries: HabitEntry, _date: string): number {
  // Base experience for completion
  return 5
}

// Level calculation based on total experience
export function calculateLevel(totalExperience: number): number {
  // Level formula: level = floor(sqrt(experience / 100)) + 1
  return Math.floor(Math.sqrt(totalExperience / 100)) + 1
}

// Badge definitions
export const BADGE_DEFINITIONS: Omit<Badge, 'unlockedAt'>[] = [
  {
    id: 'first-habit',
    name: 'First Steps',
    description: 'Complete your first habit',
    icon: '🎯',
    rarity: 'common',
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    rarity: 'common',
  },
  {
    id: 'streak-30',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '⭐',
    rarity: 'rare',
  },
  {
    id: 'streak-100',
    name: 'Centurion',
    description: 'Maintain a 100-day streak',
    icon: '👑',
    rarity: 'epic',
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Complete all habits for a week',
    icon: '💯',
    rarity: 'rare',
  },
  {
    id: 'level-10',
    name: 'Level 10',
    description: 'Reach level 10',
    icon: '🎖️',
    rarity: 'rare',
  },
  {
    id: 'level-25',
    name: 'Level 25',
    description: 'Reach level 25',
    icon: '🏆',
    rarity: 'epic',
  },
  {
    id: 'level-50',
    name: 'Level 50',
    description: 'Reach level 50',
    icon: '🌟',
    rarity: 'legendary',
  },
]

// Check and unlock badges
export function checkBadges(
  habits: Habit[],
  entries: HabitEntry,
  progress: UserProgress
): Badge[] {
  const unlocked: Badge[] = []
  const existingBadgeIds = new Set(progress.badges.map(b => b.id))

  // First habit badge
  if (habits.length >= 1 && !existingBadgeIds.has('first-habit')) {
    unlocked.push({
      ...BADGE_DEFINITIONS.find(b => b.id === 'first-habit')!,
      unlockedAt: new Date().toISOString(),
    })
  }

  // Streak badges
  const today = new Date()
  habits.forEach(habit => {
    let streak = 0
    for (let i = 0; i < 730; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = getUtcKeyForLocalDay(date)
      if (entries[dateStr]?.[habit.id] === 'done') {
        streak++
      } else {
        break
      }
    }

    if (streak >= 7 && !existingBadgeIds.has('streak-7')) {
      unlocked.push({
        ...BADGE_DEFINITIONS.find(b => b.id === 'streak-7')!,
        unlockedAt: new Date().toISOString(),
      })
    }
    if (streak >= 30 && !existingBadgeIds.has('streak-30')) {
      unlocked.push({
        ...BADGE_DEFINITIONS.find(b => b.id === 'streak-30')!,
        unlockedAt: new Date().toISOString(),
      })
    }
    if (streak >= 100 && !existingBadgeIds.has('streak-100')) {
      unlocked.push({
        ...BADGE_DEFINITIONS.find(b => b.id === 'streak-100')!,
        unlockedAt: new Date().toISOString(),
      })
    }
  })

  // Level badges
  if (progress.level >= 10 && !existingBadgeIds.has('level-10')) {
    unlocked.push({
      ...BADGE_DEFINITIONS.find(b => b.id === 'level-10')!,
      unlockedAt: new Date().toISOString(),
    })
  }
  if (progress.level >= 25 && !existingBadgeIds.has('level-25')) {
    unlocked.push({
      ...BADGE_DEFINITIONS.find(b => b.id === 'level-25')!,
      unlockedAt: new Date().toISOString(),
    })
  }
  if (progress.level >= 50 && !existingBadgeIds.has('level-50')) {
    unlocked.push({
      ...BADGE_DEFINITIONS.find(b => b.id === 'level-50')!,
      unlockedAt: new Date().toISOString(),
    })
  }

  // Perfect week badge
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return getUtcKeyForLocalDay(date)
  })

  const allCompleted = habits.every(habit =>
    weekDates.every(dateStr => entries[dateStr]?.[habit.id] === 'done')
  )

  if (allCompleted && habits.length > 0 && !existingBadgeIds.has('perfect-week')) {
    unlocked.push({
      ...BADGE_DEFINITIONS.find(b => b.id === 'perfect-week')!,
      unlockedAt: new Date().toISOString(),
    })
  }

  return unlocked
}

// Get user progress
export function getUserProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {
      level: 1,
      experience: 0,
      points: 0,
      badges: [],
      challenges: [],
    }
  } catch (error) {
    console.error('Error reading user progress:', error)
    return {
      level: 1,
      experience: 0,
      points: 0,
      badges: [],
      challenges: [],
    }
  }
}

// Save user progress
export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (error) {
    console.error('Error saving user progress:', error)
  }
}

// Add experience and points
export function addProgress(
  habitId: string,
  entries: HabitEntry,
  date: string,
  habits: Habit[]
): { unlockedBadges: Badge[]; levelUp: boolean } {
  const progress = getUserProgress()
  const points = calculatePoints(habitId, entries, date)
  const experience = calculateExperience(habitId, entries, date)

  const oldLevel = progress.level
  progress.points += points
  progress.experience += experience
  progress.level = calculateLevel(progress.experience)

  const unlockedBadges = checkBadges(habits, entries, progress)
  progress.badges.push(...unlockedBadges)

  saveUserProgress(progress)

  return {
    unlockedBadges,
    levelUp: progress.level > oldLevel,
  }
}

// Create a challenge
export function createChallenge(challenge: Omit<Challenge, 'id' | 'createdAt' | 'completed'>): Challenge {
  const progress = getUserProgress()
  const newChallenge: Challenge = {
    ...challenge,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    completed: 0,
  }
  progress.challenges.push(newChallenge)
  saveUserProgress(progress)
  return newChallenge
}

// Update challenge progress
export function updateChallengeProgress(challengeId: string, completed: number): void {
  const progress = getUserProgress()
  const challenge = progress.challenges.find(c => c.id === challengeId)
  if (challenge) {
    challenge.completed = completed
    saveUserProgress(progress)
  }
}

