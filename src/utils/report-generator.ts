import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'

export interface ReportData {
  period: { start: Date; end: Date }
  habits: Array<{
    habit: Habit
    streak: number
    completionRate: number
    completedDays: number
    totalDays: number
  }>
  overallStats: {
    totalHabits: number
    totalCompleted: number
    averageCompletionRate: number
  }
  generatedAt: string
}

export function generateReport(
  habits: Habit[],
  entries: HabitEntry,
  startDate: Date,
  endDate: Date,
  streaks: Map<string, number>,
  completionRates: Map<string, number>
): ReportData {
  const dateRange: Date[] = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateRange.push(new Date(d))
  }

  const habitStats = habits.map((habit) => {
    const completedDays = dateRange.filter((date) => {
      const dateStr = getUtcKeyForLocalDay(date)
      return entries[dateStr]?.[habit.id] === 'done'
    }).length

    return {
      habit,
      streak: streaks.get(habit.id) || 0,
      completionRate: completionRates.get(habit.id) || 0,
      completedDays,
      totalDays: dateRange.length,
    }
  })

  const totalCompleted = habitStats.reduce((sum, h) => sum + h.completedDays, 0)
  const totalPossible = habitStats.length * dateRange.length
  const averageCompletionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0

  return {
    period: { start: startDate, end: endDate },
    habits: habitStats,
    overallStats: {
      totalHabits: habits.length,
      totalCompleted,
      averageCompletionRate,
    },
    generatedAt: new Date().toISOString(),
  }
}

export function exportReportAsText(report: ReportData): string {
  let text = `HabitGrid Report\n`
  text += `Generated: ${new Date(report.generatedAt).toLocaleDateString()}\n`
  text += `Period: ${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}\n\n`
  text += `Overall Statistics:\n`
  text += `- Total Habits: ${report.overallStats.totalHabits}\n`
  text += `- Average Completion Rate: ${report.overallStats.averageCompletionRate}%\n`
  text += `- Total Completed: ${report.overallStats.totalCompleted}\n\n`
  text += `Habit Details:\n`
  report.habits.forEach(({ habit, streak, completionRate, completedDays, totalDays }) => {
    text += `\n${habit.emoji} ${habit.name}\n`
    text += `  - Streak: ${streak} days\n`
    text += `  - Completion Rate: ${completionRate}%\n`
    text += `  - Completed: ${completedDays}/${totalDays} days\n`
  })
  return text
}

export function exportReportAsJSON(report: ReportData): string {
  return JSON.stringify(report, null, 2)
}

