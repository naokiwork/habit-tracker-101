import { useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { detectDayOfWeekPattern, detectWeeklyPattern, detectPatterns } from '@/utils/pattern-detection'
import type { Habit, HabitEntry } from '@/types/habit'

interface PatternChartProps {
  habits: Habit[]
  entries: HabitEntry
}

export function PatternChart({ habits, entries }: PatternChartProps) {
  const dayPatterns = useMemo(() => {
    return habits.map(habit => ({
      habit,
      patterns: detectDayOfWeekPattern(habit.id, entries, 8),
    }))
  }, [habits, entries])

  const weeklyPatterns = useMemo(() => {
    return habits.map(habit => ({
      habit,
      patterns: detectWeeklyPattern(habit.id, entries, 12),
    }))
  }, [habits, entries])

  const detectedPatterns = useMemo(() => {
    return habits.flatMap(habit => detectPatterns(habit.id, entries))
  }, [habits, entries])

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Day of Week Patterns</CardTitle>
        </CardHeader>
        <CardContent>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayPatterns.flatMap(({ patterns }) => patterns)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayOfWeek" tickFormatter={(value) => dayNames[value]} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  {habits.map((habit) => (
                    <Bar
                      key={habit.id}
                      dataKey="completionRate"
                      fill={habit.color}
                      name={`${habit.emoji} ${habit.name}`}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            {habits.map(habit => {
              const pattern = dayPatterns.find(p => p.habit.id === habit.id)
              if (!pattern) return null

              const chartData = pattern.patterns.map(p => ({
                day: dayNames[p.dayOfWeek],
                rate: p.completionRate,
              }))

              return (
                <TabsContent key={habit.id} value={habit.id}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="rate" fill={habit.color} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="weekNumber" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {weeklyPatterns.map(({ habit, patterns }) => (
                <Line
                  key={habit.id}
                  type="monotone"
                  dataKey="completionRate"
                  data={patterns}
                  stroke={habit.color}
                  name={`${habit.emoji} ${habit.name}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {detectedPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detectedPatterns.map((pattern, index) => {
                const habit = habits.find(h => h.id === pattern.habitId)
                if (!habit) return null

                return (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{habit.emoji}</span>
                      <span className="font-medium">{habit.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-zinc-400">
                      {pattern.description}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                      Confidence: {Math.round(pattern.confidence * 100)}%
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

