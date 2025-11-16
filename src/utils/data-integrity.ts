import type { Habit, HabitEntry } from '@/types/habit'
import { habitSchema, habitEntrySchema } from '@/types/habit-validation'

export interface DataIntegrityResult {
  isValid: boolean
  errors: string[]
  fixedHabits: Habit[]
  fixedEntries: HabitEntry
}

/**
 * Validates and fixes data integrity issues
 */
export function validateAndFixData(
  habits: unknown,
  entries: unknown
): DataIntegrityResult {
  const errors: string[] = []
  const fixedHabits: Habit[] = []
  const fixedEntries: HabitEntry = {}

  // Validate habits
  if (!Array.isArray(habits)) {
    errors.push('Habits must be an array')
    return { isValid: false, errors, fixedHabits, fixedEntries }
  }

  // Validate and fix each habit
  habits.forEach((habit, index) => {
    const result = habitSchema.safeParse(habit)
    if (result.success) {
      // Ensure backward compatibility: add default values if missing
      const createdAt = new Date(result.data.createdAt).getTime()
      const fixedHabit = {
        ...result.data,
        goalType: result.data.goalType || 'daily',
        goalValue: result.data.goalValue || 1,
        archived: result.data.archived ?? false,
        order: result.data.order ?? createdAt, // Use createdAt timestamp as default order
        reminderEnabled: result.data.reminderEnabled ?? false,
        reminders: result.data.reminders ?? [],
      }
      fixedHabits.push(fixedHabit)
    } else {
      errors.push(`Habit at index ${index} is invalid: ${result.error.errors.map(e => e.message).join(', ')}`)
    }
  })

  // Validate entries
  if (typeof entries !== 'object' || entries === null) {
    errors.push('Entries must be an object')
    return { isValid: false, errors, fixedHabits, fixedEntries }
  }

  // Validate and fix entries
  const entriesObj = entries as Record<string, unknown>
  Object.keys(entriesObj).forEach((dateKey) => {
    const dateEntries = entriesObj[dateKey]
    if (typeof dateEntries !== 'object' || dateEntries === null) {
      errors.push(`Entries for date ${dateKey} must be an object`)
      return
    }

    const dateEntriesObj = dateEntries as Record<string, unknown>
    fixedEntries[dateKey] = {}

    Object.keys(dateEntriesObj).forEach((habitId) => {
      const status = dateEntriesObj[habitId]
      if (status === 'done' || status === 'skip') {
        // Only include entries for habits that exist
        if (fixedHabits.some(h => h.id === habitId)) {
          fixedEntries[dateKey][habitId] = status
        } else {
          errors.push(`Entry for habit ${habitId} on ${dateKey} references non-existent habit`)
        }
      } else {
        errors.push(`Invalid status "${status}" for habit ${habitId} on ${dateKey}`)
      }
    })
  })

  // Remove entries for dates that have no valid entries
  Object.keys(fixedEntries).forEach((dateKey) => {
    if (Object.keys(fixedEntries[dateKey]).length === 0) {
      delete fixedEntries[dateKey]
    }
  })

  const isValid = errors.length === 0
  return { isValid, errors, fixedHabits, fixedEntries }
}

/**
 * Validates data on startup
 */
export function validateStartupData(
  habits: unknown,
  entries: unknown
): { isValid: boolean; fixedHabits: Habit[]; fixedEntries: HabitEntry } {
  const result = validateAndFixData(habits, entries)
  
  if (!result.isValid && result.errors.length > 0) {
    console.warn('Data integrity issues found:', result.errors)
  }

  return {
    isValid: result.isValid,
    fixedHabits: result.fixedHabits,
    fixedEntries: result.fixedEntries,
  }
}

