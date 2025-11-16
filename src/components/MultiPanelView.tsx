import { useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { X, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getLayouts, saveLayout, PRESET_LAYOUTS, type LayoutConfig } from '@/utils/layout-manager'
import type { Habit, HabitEntry } from '@/types/habit'

interface MultiPanelViewProps {
  habits: Habit[]
  entries: HabitEntry
  panels: Array<{
    id: string
    type: 'grid' | 'stats' | 'chart' | 'heatmap' | 'insights'
    content: React.ReactNode
  }>
  onClose?: () => void
}

export function MultiPanelView({ habits, entries, panels, onClose }: MultiPanelViewProps) {
  const [selectedLayout, setSelectedLayout] = useState<string>('default')
  const [layouts] = useState<LayoutConfig[]>(getLayouts())

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayout(layoutId)
    // Apply layout configuration
  }

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-2 right-2 z-10 flex gap-2 items-center">
        <Select value={selectedLayout} onValueChange={handleLayoutChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            {PRESET_LAYOUTS.map((layout, index) => (
              <SelectItem key={`preset-${index}`} value={`preset-${index}`}>
                {layout.name}
              </SelectItem>
            ))}
            {layouts.map((layout) => (
              <SelectItem key={layout.id} value={layout.id}>
                {layout.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {panels.length === 1 ? (
        <div className="h-full overflow-auto p-4 pt-12">
          {panels[0].content}
        </div>
      ) : panels.length === 2 ? (
        <PanelGroup direction="horizontal" className="h-full pt-12">
          <Panel defaultSize={50} minSize={20}>
            <div className="h-full overflow-auto p-4">
              {panels[0].content}
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors" />
          <Panel defaultSize={50} minSize={20}>
            <div className="h-full overflow-auto p-4">
              {panels[1].content}
            </div>
          </Panel>
        </PanelGroup>
      ) : (
        <div className="grid grid-cols-2 gap-4 h-full pt-12 p-4">
          {panels.map((panel) => (
            <div key={panel.id} className="overflow-auto">
              {panel.content}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

