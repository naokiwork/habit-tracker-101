import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildCorrelationMatrix, calculateAllCorrelations, type Correlation } from '@/utils/correlation-analysis'
import type { Habit, HabitEntry } from '@/types/habit'

interface CorrelationMatrixProps {
  habits: Habit[]
  entries: HabitEntry
}

export function CorrelationMatrix({ habits, entries }: CorrelationMatrixProps) {
  const matrix = useMemo(() => buildCorrelationMatrix(habits, entries, 30), [habits, entries])
  const topCorrelations = useMemo(() => calculateAllCorrelations(habits, entries, 30).slice(0, 5), [habits, entries])

  const getColor = (value: number) => {
    const abs = Math.abs(value)
    if (abs < 0.3) return 'bg-gray-200 dark:bg-zinc-700'
    if (abs < 0.6) return value > 0 ? 'bg-blue-300 dark:bg-blue-700' : 'bg-red-300 dark:bg-red-700'
    return value > 0 ? 'bg-blue-500 dark:bg-blue-600' : 'bg-red-500 dark:bg-red-600'
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Correlation Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-2 text-left"></th>
                  {habits.map(habit => (
                    <th key={habit.id} className="p-2 text-center text-xs">
                      {habit.emoji}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit1, i) => (
                  <tr key={habit1.id}>
                    <td className="p-2 text-sm font-medium">{habit1.emoji} {habit1.name}</td>
                    {habits.map((habit2, j) => (
                      <td key={habit2.id} className="p-2">
                        <div
                          className={`w-8 h-8 rounded ${getColor(matrix[i][j])} flex items-center justify-center text-xs text-white`}
                          title={`Correlation: ${matrix[i][j].toFixed(2)}`}
                        >
                          {matrix[i][j].toFixed(1)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {topCorrelations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Correlations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topCorrelations.map((corr, index) => {
                const habit1 = habits.find(h => h.id === corr.habit1Id)
                const habit2 = habits.find(h => h.id === corr.habit2Id)
                if (!habit1 || !habit2) return null

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>{habit1.emoji}</span>
                      <span className="text-sm font-medium">{habit1.name}</span>
                      <span className="text-gray-400">↔</span>
                      <span>{habit2.emoji}</span>
                      <span className="text-sm font-medium">{habit2.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${
                        corr.correlation > 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        corr.strength === 'strong' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        corr.strength === 'moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {corr.strength}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

