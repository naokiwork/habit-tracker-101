import { useMemo, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { getUtcWeekDates, getUtcKeyForLocalDay } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Habit, HabitEntry } from '@/types/habit'

interface ComparisonChartProps {
  habits: Habit[]
  entries: HabitEntry
  weeks: number
}

export function ComparisonChart({ habits, entries, weeks }: ComparisonChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('line')
  const [selectedHabits, setSelectedHabits] = useState<string[]>(habits.map(h => h.id))

  const data = useMemo(() => {
    const result: Record<string, string | number>[] = []
    const today = new Date()
    
    for (let w = 0; w < weeks; w++) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - (w * 7))
      const weekDates = getUtcWeekDates(weekStart)
      
      const dataPoint: Record<string, string | number> = {
        date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
      
      habits.forEach(habit => {
        if (selectedHabits.includes(habit.id)) {
          const count = weekDates.filter(date => {
            const key = getUtcKeyForLocalDay(date)
            return entries[key]?.[habit.id] === 'done'
          }).length
          dataPoint[habit.name] = count
        }
      })
      
      result.push(dataPoint)
    }
    
    return result.reverse()
  }, [habits, entries, weeks, selectedHabits])

  const colors = ['#0071E3', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#FF2D55']

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 animate-fade-in transition-colors duration-200">
      <div className="mb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">
            Compare Habits
          </h3>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'bar' | 'line')} className="w-auto">
            <TabsList>
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="bar">Bar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {habits.map((habit, index) => (
            <label
              key={habit.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedHabits.includes(habit.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedHabits([...selectedHabits, habit.id])
                  } else {
                    setSelectedHabits(selectedHabits.filter(id => id !== habit.id))
                  }
                }}
                className="w-4 h-4 rounded border-gray-300"
                style={{ accentColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-[#1D1D1F] dark:text-zinc-50">{habit.emoji} {habit.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      {selectedHabits.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                domain={[0, 7]}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {habits
                .filter(h => selectedHabits.includes(h.id))
                .map((habit, index) => (
                  <Line
                    key={habit.id}
                    type="monotone"
                    dataKey={habit.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ fill: colors[index % colors.length], r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                domain={[0, 7]}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {habits
                .filter(h => selectedHabits.includes(h.id))
                .map((habit, index) => (
                  <Bar
                    key={habit.id}
                    dataKey={habit.name}
                    fill={colors[index % colors.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-zinc-400">
          Select at least one habit to compare
        </div>
      )}
    </div>
  )
}

