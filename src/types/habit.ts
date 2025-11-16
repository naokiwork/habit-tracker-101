export type GoalType = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface Habit {
  id: string
  name: string
  emoji: string
  color: string
  createdAt: string
  goalType?: GoalType // Default: 'daily'
  goalValue?: number // For weekly/monthly: number of times. Default: 1 for daily
  goalDays?: number[] // For custom: array of day indices (0=Sunday, 1=Monday, etc.)
  archived?: boolean // Default: false
  order?: number // For sorting. Default: createdAt timestamp
  reminders?: string[] // Array of reminder times in HH:mm format (e.g., ["09:00", "21:00"])
  reminderEnabled?: boolean // Default: false
  category?: string // Category for grouping habits
  tags?: string[] // Array of tags for filtering
  description?: string // Description or notes for the habit
  chainId?: string // ID of the chain this habit belongs to
  chainOrder?: number // Order within the chain (0-based)
}

export interface HabitEntry {
  [date: string]: {
    [habitId: string]: 'done' | 'skip'
  }
}

export type WeekDirection = 'prev' | 'next'

