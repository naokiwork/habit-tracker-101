import { useState, useRef, useCallback } from 'react'

interface SelectionState {
  startCell: { habitId: string; dateStr: string } | null
  endCell: { habitId: string; dateStr: string } | null
  selectedCells: Set<string>
  isSelecting: boolean
}

export function useDragSelection() {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    startCell: null,
    endCell: null,
    selectedCells: new Set(),
    isSelecting: false,
  })

  const handleMouseDown = useCallback((habitId: string, dateStr: string) => {
    setSelectionState({
      startCell: { habitId, dateStr },
      endCell: { habitId, dateStr },
      selectedCells: new Set([`${habitId}-${dateStr}`]),
      isSelecting: true,
    })
  }, [])

  const handleMouseEnter = useCallback((habitId: string, dateStr: string) => {
    setSelectionState((prev) => {
      if (!prev.isSelecting || !prev.startCell) return prev

      const cells = new Set<string>()
      const startHabitIndex = parseInt(prev.startCell.habitId) || 0
      const endHabitIndex = parseInt(habitId) || 0
      const startDateIndex = parseInt(prev.startCell.dateStr.split('-')[2]) || 0
      const endDateIndex = parseInt(dateStr.split('-')[2]) || 0

      const minHabit = Math.min(startHabitIndex, endHabitIndex)
      const maxHabit = Math.max(startHabitIndex, endHabitIndex)
      const minDate = Math.min(startDateIndex, endDateIndex)
      const maxDate = Math.max(startDateIndex, endDateIndex)

      // Simple rectangular selection
      for (let h = minHabit; h <= maxHabit; h++) {
        for (let d = minDate; d <= maxDate; d++) {
          cells.add(`${h}-${d}`)
        }
      }

      return {
        ...prev,
        endCell: { habitId, dateStr },
        selectedCells: cells,
      }
    })
  }, [])

  const handleMouseUp = useCallback(() => {
    setSelectionState((prev) => ({
      ...prev,
      isSelecting: false,
    }))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectionState({
      startCell: null,
      endCell: null,
      selectedCells: new Set(),
      isSelecting: false,
    })
  }, [])

  return {
    selectedCells: selectionState.selectedCells,
    isSelecting: selectionState.isSelecting,
    handleMouseDown,
    handleMouseEnter,
    handleMouseUp,
    clearSelection,
  }
}

