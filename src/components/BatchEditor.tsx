import { CheckCircle2, Minus, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Habit } from '@/types/habit'

interface BatchEditorProps {
  selectedCount: number
  onMarkAllDone: () => void
  onMarkAllSkip: () => void
  onResetAll: () => void
  onClearSelection: () => void
  habits: Habit[]
  selectedHabitIds: string[]
}

export function BatchEditor({
  selectedCount,
  onMarkAllDone,
  onMarkAllSkip,
  onResetAll,
  onClearSelection,
  habits,
  selectedHabitIds,
}: BatchEditorProps) {
  if (selectedCount === 0) return null

  const selectedHabits = habits.filter(h => selectedHabitIds.includes(h.id))

  return (
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-lg animate-in slide-in-from-bottom-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {selectedCount} cell(s) selected
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {selectedHabits.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            {selectedHabits.map(h => h.emoji).join(' ')} {selectedHabits.map(h => h.name).join(', ')}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            onClick={onMarkAllDone}
            size="sm"
            className="flex-1"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark Done
          </Button>
          <Button
            onClick={onMarkAllSkip}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Minus className="w-4 h-4 mr-2" />
            Mark Skip
          </Button>
          <Button
            onClick={onResetAll}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

