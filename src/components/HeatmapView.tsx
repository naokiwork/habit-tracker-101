// GitHub-style heatmap
import { useMemo } from 'react'
import { getUtcKeyForLocalDay } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Habit, HabitEntry } from '@/types/habit'

interface Props {
  habit: Habit
  entries: HabitEntry
  days: number
}

export function HeatmapView({ habit, entries, days }: Props) {
  const data = useMemo(() => {
    const result: { date: Date, count: number }[] = []
    const today = new Date()
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - (days - 1 - i))
      const key = getUtcKeyForLocalDay(date)
      const count = entries[key]?.[habit.id] === 'done' ? 1 : 0
      result.push({ date, count })
    }
    
    return result
  }, [habit, entries, days])

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100'
    return ''
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">{habit.emoji} {habit.name}</h3>
      <TooltipProvider>
        <div className="grid grid-cols-7 gap-1">
          {data.map((d, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div
                  className={`aspect-square rounded transition-all-smooth hover:scale-110 hover:ring-2 hover:ring-offset-1 ${getIntensity(d.count)}`}
                  style={d.count > 0 ? { backgroundColor: habit.color } : {}}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{d.date.toLocaleDateString('en-US')}: {d.count > 0 ? 'Completed' : 'Not completed'}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  )
}

