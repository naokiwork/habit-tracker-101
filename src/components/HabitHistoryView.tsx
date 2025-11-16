import { useState } from 'react'
import { Clock, RotateCcw, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HabitHistoryManager } from '@/utils/habit-history-manager'
import type { HabitHistoryEntry } from '@/types/habit-history'
import type { Habit } from '@/types/habit'
import { useToast } from '@/hooks/use-toast'

interface HabitHistoryViewProps {
  habit: Habit
  onRestore?: (snapshot: Partial<Habit>) => void
}

export function HabitHistoryView({ habit, onRestore }: HabitHistoryViewProps) {
  const { toast } = useToast()
  const [history, setHistory] = useState<HabitHistoryEntry[]>(
    HabitHistoryManager.getHistoryForHabit(habit.id)
  )

  const handleRestore = (entry: HabitHistoryEntry) => {
    if (entry.snapshot && onRestore) {
      onRestore(entry.snapshot)
      toast({
        title: 'Habit restored',
        description: 'Habit has been restored from history.',
      })
    }
  }

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history for this habit?')) {
      HabitHistoryManager.clearHistoryForHabit(habit.id)
      setHistory([])
      toast({
        title: 'History cleared',
        description: 'All history entries have been deleted.',
      })
    }
  }

  const getActionBadge = (action: HabitHistoryEntry['action']) => {
    const variants: Record<HabitHistoryEntry['action'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      created: { label: 'Created', variant: 'default' },
      updated: { label: 'Updated', variant: 'secondary' },
      deleted: { label: 'Deleted', variant: 'outline' },
      archived: { label: 'Archived', variant: 'outline' },
      restored: { label: 'Restored', variant: 'default' },
    }
    const config = variants[action]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg">
        <FileText className="w-12 h-12 mx-auto text-gray-400 dark:text-zinc-600 mb-4" />
        <p className="text-gray-500 dark:text-zinc-400">No history available</p>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">
          History will be recorded when you make changes to this habit
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50">
          Change History
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearHistory}
          className="gap-2 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </Button>
      </div>

      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <span className="text-sm text-gray-600 dark:text-zinc-400">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                {getActionBadge(entry.action)}
              </div>
              {entry.snapshot && onRestore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(entry)}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </Button>
              )}
            </div>

            {entry.changes && entry.changes.length > 0 && (
              <div className="mt-3 space-y-2">
                {entry.changes.map((change, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-zinc-300">
                      {change.field}:
                    </span>{' '}
                    <span className="text-gray-500 dark:text-zinc-400 line-through">
                      {String(change.oldValue || 'N/A')}
                    </span>{' '}
                    →{' '}
                    <span className="text-gray-700 dark:text-zinc-300 font-medium">
                      {String(change.newValue || 'N/A')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

