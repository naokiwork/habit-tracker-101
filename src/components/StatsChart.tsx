import { useMemo, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { getUtcWeekDates, getUtcKeyForLocalDay } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Habit, HabitEntry } from '@/types/habit'

interface Props {
  habit: Habit
  entries: HabitEntry
  weeks: number
}

export function StatsChart({ habit, entries, weeks }: Props) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('line')
  
  const data = useMemo(() => {
    const result: { date: string, count: number, percentage: number }[] = []
    const today = new Date()
    
    for (let w = 0; w < weeks; w++) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - (w * 7))
      const weekDates = getUtcWeekDates(weekStart)
      
      const count = weekDates.filter(date => {
        const key = getUtcKeyForLocalDay(date)
        return entries[key]?.[habit.id] === 'done'
      }).length
      
      result.push({
        date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
        percentage: Math.round((count / 7) * 100)
      })
    }
    
    return result.reverse()
  }, [habit, entries, weeks])

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 animate-fade-in transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">
          {habit.emoji} {habit.name}
        </h3>
        <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'bar' | 'line')} className="w-auto">
          <TabsList>
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="bar">Bar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
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
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke={habit.color}
              strokeWidth={2}
              name="Days Completed"
              dot={{ fill: habit.color, r: 4 }}
              activeDot={{ r: 6 }}
            />
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
            <Bar 
              dataKey="count" 
              fill={habit.color}
              name="Days Completed"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

