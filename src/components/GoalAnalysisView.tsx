import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { analyzeGoalProgress, type GoalAnalysis } from '@/utils/goal-analysis'
import type { Habit, HabitEntry } from '@/types/habit'

interface GoalAnalysisViewProps {
  habits: Habit[]
  entries: HabitEntry
}

export function GoalAnalysisView({ habits, entries }: GoalAnalysisViewProps) {
  const analyses = useMemo(() => {
    return habits
      .filter(h => h.goalType && h.goalValue)
      .map(habit => analyzeGoalProgress(habit, entries, 30))
  }, [habits, entries])

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">
            No habits with goals set. Set goals in habit settings to see analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => {
        const habit = habits.find(h => h.id === analysis.habitId)
        if (!habit) return null

        const TrendIcon = analysis.trend === 'improving' ? TrendingUp :
          analysis.trend === 'declining' ? TrendingDown : Minus

        return (
          <Card key={analysis.habitId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-xl">{habit.emoji}</span>
                  {habit.name}
                </CardTitle>
                <Badge variant={analysis.trend === 'improving' ? 'default' : 'outline'}>
                  <TrendIcon className="w-3 h-3 mr-1" />
                  {analysis.trend}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Goal Progress</span>
                    <span className="text-sm">{analysis.achievementRate}%</span>
                  </div>
                  <Progress value={analysis.achievementRate} className="h-2" />
                  <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    {analysis.currentProgress} / {analysis.goalType === 'daily' ? 30 : analysis.goalType === 'weekly' ? Math.ceil(30 / 7) : 1} {analysis.goalType} goal(s) achieved
                  </div>
                </div>

                {analysis.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Recommendations</div>
                    {analysis.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-zinc-400 flex items-start gap-2">
                        <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

