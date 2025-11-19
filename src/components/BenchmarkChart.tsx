import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateBenchmark, findBestPeriod } from '@/utils/benchmark-analysis'
import type { Habit, HabitEntry } from '@/types/habit'

interface BenchmarkChartProps {
  habit: Habit
  entries: HabitEntry
  period?: 'week' | 'month'
}

export function BenchmarkChart({ habit, entries, period = 'week' }: BenchmarkChartProps) {
  const benchmark = useMemo(() => calculateBenchmark(habit.id, entries, period), [habit.id, entries, period])
  const bestPeriod = useMemo(() => findBestPeriod(habit.id, entries, period), [habit.id, entries, period])

  const chartData = [
    {
      name: 'Previous',
      value: benchmark.previous,
    },
    {
      name: 'Current',
      value: benchmark.current,
    },
    {
      name: 'Best',
      value: benchmark.best,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Benchmark Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-zinc-400">Previous {period}</div>
              <div className="text-2xl font-bold">{benchmark.previous}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-zinc-400">Current {period}</div>
              <div className="text-2xl font-bold text-[#0071E3]">{benchmark.current}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-zinc-400">Best {period}</div>
              <div className="text-2xl font-bold text-[#34C759]">{benchmark.best}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-zinc-400">Growth Rate</div>
            <div className={`text-2xl font-bold ${benchmark.growthRate >= 0 ? 'text-[#34C759]' : 'text-red-500'}`}>
              {benchmark.growthRate >= 0 ? '+' : ''}{benchmark.growthRate}%
            </div>
          </div>

          {bestPeriod && (
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-zinc-400">Best Period</div>
              <div className="font-semibold">{bestPeriod.period}</div>
              <div className="text-sm text-gray-500 dark:text-zinc-400">{bestPeriod.completionRate}% completion</div>
            </div>
          )}

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0071E3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

