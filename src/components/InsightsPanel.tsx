import { useMemo } from 'react'
import { Lightbulb, TrendingUp, AlertTriangle, Target, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  detectPatterns,
  detectAnomalies,
  generateRecommendations,
  analyzeTrends,
  getWeeklyInsights,
  type Insight,
} from '@/utils/ai-analysis'
import type { Habit, HabitEntry } from '@/types/habit'

interface InsightsPanelProps {
  habits: Habit[]
  entries: HabitEntry
  streaks: Map<string, number>
  completionRates: Map<string, number>
}

export function InsightsPanel({ habits, entries, streaks, completionRates }: InsightsPanelProps) {
  const insights = useMemo(() => {
    const patterns = detectPatterns(habits, entries)
    const anomalies = detectAnomalies(habits, entries)
    const trends = analyzeTrends(habits, entries)
    const weekly = getWeeklyInsights(habits, entries, streaks, completionRates)
    const recommendations = generateRecommendations(habits, entries, streaks, completionRates)

    return {
      patterns,
      anomalies,
      trends,
      weekly,
      recommendations,
    }
  }, [habits, entries, streaks, completionRates])

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'pattern':
        return <TrendingUp className="w-4 h-4" />
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4" />
      case 'trend':
        return <Sparkles className="w-4 h-4" />
      case 'recommendation':
        return <Lightbulb className="w-4 h-4" />
      default:
        return <Target className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: Insight['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>Start tracking habits to see insights</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="trends">Trends</TabsTrigger>
        <TabsTrigger value="patterns">Patterns</TabsTrigger>
        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
      </TabsList>

      <TabsContent value="weekly" className="space-y-4">
        {insights.weekly.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 dark:text-zinc-400">No weekly insights yet</p>
            </CardContent>
          </Card>
        ) : (
          insights.weekly.map((insight, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </div>
                  <Badge className={getPriorityColor(insight.priority)}>
                    {insight.priority}
                  </Badge>
                </div>
                <CardDescription>{insight.description}</CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="trends" className="space-y-4">
        {insights.trends.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 dark:text-zinc-400">No trend insights yet</p>
            </CardContent>
          </Card>
        ) : (
          insights.trends.map((insight, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                  </div>
                  <Badge className={getPriorityColor(insight.priority)}>
                    {insight.priority}
                  </Badge>
                </div>
                <CardDescription>{insight.description}</CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="patterns" className="space-y-4">
        {insights.patterns.length === 0 && insights.anomalies.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 dark:text-zinc-400">No patterns detected yet</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {insights.patterns.map((pattern, index) => {
              const habit = habits.find(h => h.id === pattern.habitId)
              return (
                <Card key={`pattern-${index}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <CardTitle className="text-base">Pattern Detected</CardTitle>
                    </div>
                    <CardDescription>
                      {habit && `${habit.emoji} ${habit.name}: `}
                      {pattern.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
            {insights.anomalies.map((anomaly, index) => (
              <Card key={`anomaly-${index}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <CardTitle className="text-base">{anomaly.title}</CardTitle>
                    </div>
                    <Badge className={getPriorityColor(anomaly.priority)}>
                      {anomaly.priority}
                    </Badge>
                  </div>
                  <CardDescription>{anomaly.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </>
        )}
      </TabsContent>

      <TabsContent value="recommendations" className="space-y-4">
        {insights.recommendations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 dark:text-zinc-400">No recommendations at this time</p>
            </CardContent>
          </Card>
        ) : (
          insights.recommendations.map((rec, index) => {
            const habit = rec.habitId ? habits.find(h => h.id === rec.habitId) : null
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <CardTitle className="text-base">{rec.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {habit && `${habit.emoji} ${habit.name}: `}
                    {rec.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })
        )}
      </TabsContent>
    </Tabs>
  )
}

