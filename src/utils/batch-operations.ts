import type { Habit, HabitEntry } from '@/types/habit'

export interface BatchOperation {
  type: 'mark-done' | 'mark-skip' | 'reset'
  habitIds: string[]
  dateStrs: string[]
}

export function applyBatchOperation(
  entries: HabitEntry,
  operation: BatchOperation
): HabitEntry {
  const newEntries = { ...entries }

  operation.dateStrs.forEach((dateStr) => {
    if (!newEntries[dateStr]) {
      newEntries[dateStr] = {}
    }

    operation.habitIds.forEach((habitId) => {
      if (operation.type === 'mark-done') {
        newEntries[dateStr][habitId] = 'done'
      } else if (operation.type === 'mark-skip') {
        newEntries[dateStr][habitId] = 'skip'
      } else if (operation.type === 'reset') {
        delete newEntries[dateStr][habitId]
      }
    })
  })

  return newEntries
}

export function getSelectedCells(
  selectedCells: Set<string>,
  _habits: Habit[],
  _weekDates: Date[]
): { habitIds: string[]; dateStrs: string[] } {
  const habitIds = new Set<string>()
  const dateStrs = new Set<string>()

  selectedCells.forEach((cellKey) => {
    const [habitId, dateStr] = cellKey.split('-')
    if (habitId && dateStr) {
      habitIds.add(habitId)
      dateStrs.add(dateStr)
    }
  })

  return {
    habitIds: Array.from(habitIds),
    dateStrs: Array.from(dateStrs),
  }
}

