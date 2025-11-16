import type { Habit } from './habit'

export interface HabitHistoryEntry {
  id: string
  habitId: string
  timestamp: number
  action: 'created' | 'updated' | 'deleted' | 'archived' | 'restored'
  changes?: {
    field: string
    oldValue: unknown
    newValue: unknown
  }[]
  snapshot?: Partial<Habit>
}

export interface HabitHistory {
  habitId: string
  entries: HabitHistoryEntry[]
}

