import type { Habit } from '@/types/habit'
import type { HabitHistoryEntry, HabitHistory } from '@/types/habit-history'

const HISTORY_STORAGE_KEY = 'habitgrid_habit_history'
const MAX_HISTORY_PER_HABIT = 50

export class HabitHistoryManager {
  private static getHistory(): Map<string, HabitHistoryEntry[]> {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (!stored) return new Map()
      const data = JSON.parse(stored) as Record<string, HabitHistoryEntry[]>
      return new Map(Object.entries(data))
    } catch {
      return new Map()
    }
  }

  private static saveHistory(history: Map<string, HabitHistoryEntry[]>): void {
    try {
      const data = Object.fromEntries(history)
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save habit history:', error)
    }
  }

  static recordAction(
    habitId: string,
    action: HabitHistoryEntry['action'],
    oldHabit?: Habit,
    newHabit?: Habit
  ): void {
    const history = this.getHistory()
    const entries = history.get(habitId) || []

    const changes: HabitHistoryEntry['changes'] = []
    if (oldHabit && newHabit) {
      const fields: (keyof Habit)[] = ['name', 'emoji', 'color', 'goalType', 'goalValue', 'category', 'description']
      fields.forEach((field) => {
        if (oldHabit[field] !== newHabit[field]) {
          changes.push({
            field,
            oldValue: oldHabit[field],
            newValue: newHabit[field],
          })
        }
      })
    }

    const entry: HabitHistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      habitId,
      timestamp: Date.now(),
      action,
      changes: changes.length > 0 ? changes : undefined,
      snapshot: newHabit ? {
        name: newHabit.name,
        emoji: newHabit.emoji,
        color: newHabit.color,
        goalType: newHabit.goalType,
        goalValue: newHabit.goalValue,
        category: newHabit.category,
        description: newHabit.description,
      } : undefined,
    }

    entries.push(entry)
    // Keep only last MAX_HISTORY_PER_HABIT entries
    if (entries.length > MAX_HISTORY_PER_HABIT) {
      entries.shift()
    }
    history.set(habitId, entries)
    this.saveHistory(history)
  }

  static getHistoryForHabit(habitId: string): HabitHistoryEntry[] {
    const history = this.getHistory()
    return history.get(habitId) || []
  }

  static getAllHistory(): HabitHistory[] {
    const history = this.getHistory()
    const result: HabitHistory[] = []
    history.forEach((entries, habitId) => {
      result.push({
        habitId,
        entries: entries.sort((a, b) => b.timestamp - a.timestamp),
      })
    })
    return result
  }

  static clearHistoryForHabit(habitId: string): void {
    const history = this.getHistory()
    history.delete(habitId)
    this.saveHistory(history)
  }

  static clearAllHistory(): void {
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  }
}

