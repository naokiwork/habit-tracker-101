export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface Challenge {
  id: string
  name: string
  description?: string
  type: ChallengeType
  target: number // Number of completions needed
  startDate: string
  endDate?: string
  habitIds: string[] // Habits included in this challenge
  completed: number
  reward?: string
  createdAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserProgress {
  level: number
  experience: number
  points: number
  badges: Badge[]
  challenges: Challenge[]
}

