import { useState, useMemo } from 'react'
import { Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatsWidget } from './StatsWidget'
import { getDashboardLayout, saveDashboardLayout, PRESET_LAYOUTS, type WidgetConfig } from '@/utils/dashboard-layout'
import type { Habit, HabitEntry } from '@/types/habit'
import { StatsChart } from './StatsChart'
import { HeatmapView } from './HeatmapView'

interface StatsDashboardProps {
  habits: Habit[]
  entries: HabitEntry
  streaks: Map<string, number>
  completionRates: Map<string, number>
}

export function StatsDashboard({ habits, entries, streaks, completionRates }: StatsDashboardProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(getDashboardLayout())
  const [isEditing, setIsEditing] = useState(false)

  const overallCompletionRate = useMemo(() => {
    if (habits.length === 0) return 0
    const total = Array.from(completionRates.values()).reduce((sum, rate) => sum + rate, 0)
    return Math.round(total / habits.length)
  }, [habits, completionRates])

  const averageStreak = useMemo(() => {
    if (habits.length === 0) return 0
    const total = Array.from(streaks.values()).reduce((sum, streak) => sum + streak, 0)
    return Math.round(total / habits.length)
  }, [habits, streaks])

  const handleAddWidget = (type: WidgetConfig['type']) => {
    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      size: 'medium',
      position: widgets.length,
    }
    const updated = [...widgets, newWidget]
    setWidgets(updated)
    saveDashboardLayout(updated)
  }

  const handleRemoveWidget = (id: string) => {
    const updated = widgets.filter(w => w.id !== id)
    setWidgets(updated)
    saveDashboardLayout(updated)
  }

  const handleApplyPreset = (preset: WidgetConfig[]) => {
    setWidgets(preset)
    saveDashboardLayout(preset)
  }

  const renderWidgetContent = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'completion-rate':
        return (
          <div className="text-center">
            <div className="text-4xl font-bold text-[#34C759] mb-2">{overallCompletionRate}%</div>
            <div className="text-sm text-gray-600 dark:text-zinc-400">Overall Completion</div>
          </div>
        )
      case 'streak':
        return (
          <div className="text-center">
            <div className="text-4xl font-bold text-[#0071E3] mb-2">{averageStreak}</div>
            <div className="text-sm text-gray-600 dark:text-zinc-400">Average Streak</div>
          </div>
        )
      case 'chart':
        return habits.length > 0 ? (
          <StatsChart habit={habits[0]} entries={entries} weeks={8} />
        ) : (
          <div className="text-sm text-gray-500">No habits to display</div>
        )
      case 'heatmap':
        return habits.length > 0 ? (
          <HeatmapView habit={habits[0]} entries={entries} days={84} />
        ) : (
          <div className="text-sm text-gray-500">No habits to display</div>
        )
      default:
        return <div className="text-sm text-gray-500">Widget content</div>
    }
  }

  const sortedWidgets = [...widgets].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50">Dashboard</h3>
        <div className="flex gap-2">
          <Select
            value=""
            onValueChange={(value) => {
              if (value === 'default') {
                handleApplyPreset(getDashboardLayout())
              } else {
                const presetIndex = parseInt(value)
                if (presetIndex >= 0 && presetIndex < PRESET_LAYOUTS.length) {
                  handleApplyPreset(PRESET_LAYOUTS[presetIndex])
                }
              }
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Preset Layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              {PRESET_LAYOUTS.map((_preset, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Preset {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className="flex gap-2 flex-wrap p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget('completion-rate')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Completion Rate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget('streak')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Streak
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget('chart')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Chart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget('heatmap')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Heatmap
          </Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {sortedWidgets.map((widget) => (
          <StatsWidget
            key={widget.id}
            id={widget.id}
            title={
              widget.type === 'completion-rate' ? 'Completion Rate' :
              widget.type === 'streak' ? 'Average Streak' :
              widget.type === 'chart' ? 'Progress Chart' :
              widget.type === 'heatmap' ? 'Heatmap' :
              'Widget'
            }
            content={renderWidgetContent(widget)}
            size={widget.size}
            onRemove={isEditing ? handleRemoveWidget : undefined}
            draggable={isEditing}
          />
        ))}
      </div>

      {sortedWidgets.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-zinc-400">
          No widgets added. Click "Edit" to add widgets.
        </div>
      )}
    </div>
  )
}

