import { useState, useMemo } from 'react'
import { Download, Share2, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generateReport, exportReportAsText, exportReportAsJSON, type ReportData } from '@/utils/report-generator'
import { useToast } from '@/hooks/use-toast'
import type { Habit, HabitEntry } from '@/types/habit'

interface ReportViewProps {
  habits: Habit[]
  entries: HabitEntry
  streaks: Map<string, number>
  completionRates: Map<string, number>
}

export function ReportView({ habits, entries, streaks, completionRates }: ReportViewProps) {
  const { toast } = useToast()
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('week')
  const [customDays, setCustomDays] = useState(30)

  const report = useMemo(() => {
    const today = new Date()
    let startDate: Date
    let endDate = new Date(today)

    if (period === 'week') {
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 7)
    } else if (period === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    } else {
      startDate = new Date(today)
      startDate.setDate(today.getDate() - customDays)
    }

    return generateReport(habits, entries, startDate, endDate, streaks, completionRates)
  }, [habits, entries, streaks, completionRates, period, customDays])

  const handleExportText = () => {
    const text = exportReportAsText(report)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habitgrid-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Report exported',
      description: 'Report has been exported as text file.',
    })
  }

  const handleExportJSON = () => {
    const json = exportReportAsJSON(report)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habitgrid-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Report exported',
      description: 'Report has been exported as JSON file.',
    })
  }

  const handleShare = async () => {
    const json = exportReportAsJSON(report)
    const encoded = btoa(encodeURIComponent(json))
    const shareUrl = `${window.location.origin}?report=${encoded}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: 'Link copied!',
        description: 'Report link has been copied to your clipboard.',
      })
    } catch (error) {
      toast({
        title: 'Failed to copy link',
        description: 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>Create a detailed report of your habit progress</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportText} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Export Text
              </Button>
              <Button onClick={handleExportJSON} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Period</label>
              <Select value={period} onValueChange={(value) => setPeriod(value as 'week' | 'month' | 'custom')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {period === 'custom' && (
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
                  className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Overall Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-zinc-400">Total Habits</div>
                    <div className="text-2xl font-bold">{report.overallStats.totalHabits}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-zinc-400">Average Completion</div>
                    <div className="text-2xl font-bold">{report.overallStats.averageCompletionRate}%</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-zinc-400">Total Completed</div>
                    <div className="text-2xl font-bold">{report.overallStats.totalCompleted}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Habit Details</h3>
                <div className="space-y-2">
                  {report.habits.map(({ habit, streak, completionRate, completedDays, totalDays }) => (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{habit.emoji}</span>
                        <div>
                          <div className="font-medium">{habit.name}</div>
                          <div className="text-sm text-gray-500 dark:text-zinc-400">
                            {completedDays}/{totalDays} days
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{completionRate}%</div>
                        <div className="text-sm text-gray-500 dark:text-zinc-400">{streak} day streak</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

