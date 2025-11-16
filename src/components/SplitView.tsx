import { useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Habit, HabitEntry } from '@/types/habit'

interface SplitViewProps {
  habits: Habit[]
  entries: HabitEntry
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  onClose?: () => void
}

export function SplitView({ habits, entries, leftPanel, rightPanel, onClose }: SplitViewProps) {
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(!isMinimized)}
          className="h-8 w-8 p-0"
        >
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {!isMinimized && (
        <PanelGroup direction="horizontal" className="h-full">
          <Panel defaultSize={50} minSize={20}>
            <div className="h-full overflow-auto p-4">
              {leftPanel}
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors" />
          <Panel defaultSize={50} minSize={20}>
            <div className="h-full overflow-auto p-4">
              {rightPanel}
            </div>
          </Panel>
        </PanelGroup>
      )}
    </div>
  )
}

