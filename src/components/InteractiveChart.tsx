import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

interface InteractiveChartProps {
  habits: Habit[]
  entries: HabitEntry
  weeks?: number
  chartType?: 'line' | 'bar'
  onDateClick?: (date: string) => void
}

export function InteractiveChart({ 
  habits, 
  entries, 
  weeks = 8, 
  chartType = 'line',
  onDateClick 
}: InteractiveChartProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<{ start: number; end: number } | null>(null)

  const data = useMemo(() => {
    const today = new Date()
    const dataPoints: Array<{
      date: string
      [key: string]: string | number
    }> = []

    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = getUtcKeyForLocalDay(date)
      const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const dataPoint: { date: string; [key: string]: string | number } = {
        date: displayDate,
        dateStr,
      }

      habits.forEach((habit) => {
        const status = entries[dateStr]?.[habit.id]
        dataPoint[habit.name] = status === 'done' ? 1 : status === 'skip' ? 0.5 : 0
      })

      dataPoints.push(dataPoint)
    }

    return dataPoints
  }, [habits, entries, weeks])

  const handleClick = (data: any) => {
    if (onDateClick && data?.activePayload?.[0]?.payload?.dateStr) {
      onDateClick(data.activePayload[0].payload.dateStr)
    }
  }

  const ChartComponent = chartType === 'line' ? LineChart : BarChart

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50">
          Interactive {chartType === 'line' ? 'Line' : 'Bar'} Chart
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod(null)}
            className="px-3 py-1 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Reset
          </button>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' ? (
          <LineChart data={data} onClick={handleClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#6b7280"
              domain={[0, 1]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#1D1D1F' }}
            />
            <Legend />
            {habits.map((habit, index) => (
              <Line
                key={habit.id}
                type="monotone"
                dataKey={habit.name}
                stroke={habit.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart data={data} onClick={handleClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#6b7280"
              domain={[0, 1]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#1D1D1F' }}
            />
            <Legend />
            {habits.map((habit) => (
              <Bar
                key={habit.id}
                dataKey={habit.name}
                fill={habit.color}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>

      {hoveredDate && (
        <div className="text-sm text-gray-600 dark:text-zinc-400">
          Hovered: {hoveredDate}
        </div>
      )}
    </div>
  )
}

