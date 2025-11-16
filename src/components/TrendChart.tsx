import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getTrendData, analyzeTrend, type TrendAnalysis } from '@/utils/trend-analysis'
import { predictFutureCompletion, predictDaysToGoal, type Prediction } from '@/utils/prediction'
import type { Habit, HabitEntry } from '@/types/habit'
import { formatDateUTC } from '@/lib/utils'

interface TrendChartProps {
  habits: Habit[]
  entries: HabitEntry
}

export function TrendChart({ habits, entries }: TrendChartProps) {
  const trendAnalyses = useMemo(() => {
    return habits.map(habit => analyzeTrend(habit.id, entries, 30))
  }, [habits, entries])

  const predictions = useMemo(() => {
    return habits.map(habit => {
      const prediction = predictFutureCompletion(habit.id, entries, 7)
      const daysToGoal = predictDaysToGoal(habit, entries)
      return { habit, prediction: { ...prediction, daysToGoal } }
    })
  }, [habits, entries])

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Habits</TabsTrigger>
          {habits.map(habit => (
            <TabsTrigger key={habit.id} value={habit.id}>
              {habit.emoji} {habit.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>30-Day Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  {habits.map((habit, index) => {
                    const trendData = getTrendData(habit.id, entries, 30)
                    return (
                      <Line
                        key={habit.id}
                        type="monotone"
                        dataKey="completionRate"
                        data={trendData}
                        stroke={habit.color}
                        name={`${habit.emoji} ${habit.name}`}
                        strokeWidth={2}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {habits.map(habit => {
          const trendData = getTrendData(habit.id, entries, 30)
          const trend = trendAnalyses.find(t => t.habitId === habit.id)
          const prediction = predictions.find(p => p.habit.id === habit.id)?.prediction

          return (
            <TabsContent key={habit.id} value={habit.id}>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Trend Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return `${date.getMonth() + 1}/${date.getDate()}`
                          }}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="completionRate"
                          stroke={habit.color}
                          name="Daily"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="movingAverage7"
                          stroke="#8884d8"
                          name="7-Day Average"
                          strokeDasharray="5 5"
                        />
                        <Line
                          type="monotone"
                          dataKey="movingAverage30"
                          stroke="#82ca9d"
                          name="30-Day Average"
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {trend && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Trend Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Trend Direction</span>
                          <div className="flex items-center gap-2">
                            {trend.trend === 'improving' && (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-green-600 dark:text-green-400">Improving</span>
                              </>
                            )}
                            {trend.trend === 'declining' && (
                              <>
                                <TrendingDown className="w-4 h-4 text-red-500" />
                                <span className="text-red-600 dark:text-red-400">Declining</span>
                              </>
                            )}
                            {trend.trend === 'stable' && (
                              <>
                                <Minus className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-400">Stable</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Recent Average</span>
                          <span className="text-lg font-semibold">{trend.recentAverage.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Previous Average</span>
                          <span className="text-lg font-semibold">{trend.previousAverage.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Change</span>
                          <span className={`text-lg font-semibold ${
                            trend.changePercentage > 0 ? 'text-green-600 dark:text-green-400' :
                            trend.changePercentage < 0 ? 'text-red-600 dark:text-red-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {prediction && (
                  <Card>
                    <CardHeader>
                      <CardTitle>7-Day Prediction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Predicted Completion Rate</span>
                          <span className="text-lg font-semibold">{prediction.predictedCompletionRate}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Confidence</span>
                          <span className="text-lg font-semibold">{Math.round(prediction.confidence * 100)}%</span>
                        </div>
                        {prediction.daysToGoal !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Days to Goal</span>
                            <span className="text-lg font-semibold">
                              {prediction.daysToGoal === 0 ? 'Achieved!' : `${prediction.daysToGoal} days`}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
