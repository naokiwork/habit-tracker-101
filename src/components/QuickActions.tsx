import { useState } from 'react'
import { Plus, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Habit } from '@/types/habit'

interface QuickActionsProps {
  habits: Habit[]
  onMarkAllDone?: () => void
  onAddHabit?: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export function QuickActions({ 
  habits, 
  onMarkAllDone, 
  onAddHabit,
  position = 'bottom-right'
}: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex flex-col items-end gap-3`}>
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
          {onMarkAllDone && habits.length > 0 && (
            <Button
              onClick={() => {
                onMarkAllDone()
                setIsExpanded(false)
              }}
              className="rounded-full shadow-lg h-12 w-12 p-0"
              size="lg"
            >
              <CheckCircle2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      )}
      <Button
        onClick={() => {
          if (isExpanded && onAddHabit) {
            onAddHabit()
          }
          setIsExpanded(!isExpanded)
        }}
        className="rounded-full shadow-lg h-14 w-14 p-0 bg-[#0071E3] hover:bg-[#0077ED] transition-all"
        size="lg"
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </Button>
    </div>
  )
}

