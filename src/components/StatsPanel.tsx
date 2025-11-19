import { useMemo, useState } from 'react'
import { TrendingUp, Target, Download, Printer } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { exportStatsToCSV, exportStatsToJSON, downloadStatsAsCSV, downloadStatsAsJSON } from '@/utils/export-stats'
import { StatsView } from './StatsView'
import { StatsChart } from './StatsChart'
import { ComparisonChart } from './ComparisonChart'
import { TrendChart as TrendChartNew } from './TrendChart'
import { HeatmapView } from './HeatmapView'
import { InsightsPanel } from './InsightsPanel'
import { StatsDashboard } from './StatsDashboard'
import { BenchmarkChart } from './BenchmarkChart'
import { GoalAnalysisView } from './GoalAnalysisView'
import { CorrelationMatrix } from './CorrelationMatrix'
import { PatternChart } from './PatternChart'
import { GamificationPanel } from './GamificationPanel'
import { HabitChainView } from './HabitChainView'
import { InteractiveChart } from './InteractiveChart'
import { ReportView } from './ReportView'
import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay } from '@/lib/utils'
import { useHabitStats } from '@/hooks/use-habit-stats'
import { getUtcWeekStart } from '@/lib/utils'

interface StatsPanelProps {
  habits: Habit[]
  entries: HabitEntry
  onUpdateHabits?: (updater: (habits: Habit[]) => Habit[]) => void
}

type PeriodPreset = '7' | '30' | '90' | '365' | 'custom'

export function StatsPanel({ habits, entries, onUpdateHabits }: StatsPanelProps) {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30')
  const [customDays, setCustomDays] = useState<number>(30)
  const weekStart = getUtcWeekStart(new Date())
  const { streakMap, completionMap } = useHabitStats(habits, entries, weekStart)
  
  const selectedPeriod = periodPreset === 'custom' ? customDays : parseInt(periodPreset)
  
  const stats = useMemo(() => {
    const today = new Date()
    const periodDays = Array.from({ length: selectedPeriod }, (_, i) => {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      return getUtcKeyForLocalDay(date)
    })

    let totalCompleted = 0
    let totalPossible = habits.length * selectedPeriod

    periodDays.forEach((dateStr) => {
      habits.forEach((habit) => {
        if (entries[dateStr]?.[habit.id] === 'done') {
          totalCompleted++
        }
      })
    })

    const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0

    const habitStats = habits.map((habit) => {
      let streak = 0
      for (let i = 0; i < 730; i++) {
        const localDate = new Date(today)
        localDate.setDate(today.getDate() - i)
        const dateStr = getUtcKeyForLocalDay(localDate)
        if (entries[dateStr]?.[habit.id] === 'done') {
          streak++
        } else {
          break
        }
      }

      let completed = 0
      periodDays.forEach((dateStr) => {
        if (entries[dateStr]?.[habit.id] === 'done') {
          completed++
        }
      })

      return {
        habit,
        streak,
        completed,
        rate: Math.round((completed / selectedPeriod) * 100),
      }
    })

    return {
      completionRate,
      habitStats,
      periodDays: selectedPeriod,
    }
  }, [habits, entries, selectedPeriod])

  const handleExportCSV = () => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - selectedPeriod)
    const csvContent = exportStatsToCSV(habits, entries, startDate, today)
    const filename = `habitgrid-stats-${new Date().toISOString().split('T')[0]}.csv`
    downloadStatsAsCSV(csvContent, filename)
  }

  const handleExportJSON = () => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - selectedPeriod)
    const jsonData = exportStatsToJSON(habits, entries, startDate, today)
    const filename = `habitgrid-stats-${new Date().toISOString().split('T')[0]}.json`
    downloadStatsAsJSON(jsonData, filename)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 animate-fade-in transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">Statistics</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2 no-print"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Select value={periodPreset} onValueChange={(value) => setPeriodPreset(value as PeriodPreset)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {periodPreset === 'custom' && (
            <input
              type="number"
              min="1"
              max="365"
              value={customDays}
              onChange={(e) => setCustomDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-[#1D1D1F] dark:text-zinc-50"
            />
          )}
        </div>
      </div>
      
      <Tabs defaultValue="summary" className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="gamification">Gamification</TabsTrigger>
          <TabsTrigger value="chains">Chains</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="interactive">Interactive</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">

      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 transition-colors duration-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[#34C759]" />
            <span className="text-sm font-medium text-gray-600 dark:text-zinc-400 transition-colors duration-200">
              Last {stats.periodDays} {stats.periodDays === 1 ? 'Day' : 'Days'}
            </span>
          </div>
          <div className="text-3xl font-bold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">{stats.completionRate}%</div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wide mb-3 transition-colors duration-200">
          Habit Statistics
        </h4>
        {stats.habitStats.map(({ habit, streak, completed, rate }) => (
          <div
            key={habit.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{habit.emoji}</span>
              <div>
                <div className="font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">{habit.name}</div>
                <div className="text-xs text-gray-500 dark:text-zinc-400 transition-colors duration-200">
                  {completed}/{stats.periodDays} days completed ({rate}%)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-zinc-400 transition-colors duration-200">Current Streak</div>
                <div className="text-lg font-bold" style={{ color: habit.color }}>
                  {streak} days
                </div>
              </div>
              <Target className="w-5 h-5 text-gray-400 dark:text-zinc-500 transition-colors duration-200" />
            </div>
          </div>
        ))}
      </div>
        </TabsContent>
        
        <TabsContent value="trend">
          <TrendChartNew habits={habits} entries={entries} />
        </TabsContent>
        
        <TabsContent value="dashboard">
          <StatsDashboard
            habits={habits}
            entries={entries}
            streaks={streakMap}
            completionRates={completionMap}
          />
        </TabsContent>
        
        <TabsContent value="benchmark">
          <div className="space-y-4">
            {habits.map(habit => (
              <BenchmarkChart key={habit.id} habit={habit} entries={entries} period="week" />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="goals">
          <GoalAnalysisView habits={habits} entries={entries} />
        </TabsContent>
        
        <TabsContent value="correlation">
          <CorrelationMatrix habits={habits} entries={entries} />
        </TabsContent>
        
        <TabsContent value="patterns">
          <PatternChart habits={habits} entries={entries} />
        </TabsContent>
        
        <TabsContent value="comparison">
          <ComparisonChart habits={habits} entries={entries} weeks={8} />
        </TabsContent>
        
        <TabsContent value="insights">
          <InsightsPanel
            habits={habits}
            entries={entries}
            streaks={streakMap}
            completionRates={completionMap}
          />
        </TabsContent>
        
        <TabsContent value="gamification">
          <GamificationPanel habits={habits} />
        </TabsContent>
        
        <TabsContent value="chains">
          {onUpdateHabits ? (
            <HabitChainView habits={habits} entries={entries} onUpdateHabits={onUpdateHabits} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-zinc-400">Chain view requires habit update function</p>
          )}
        </TabsContent>
        
        <TabsContent value="table">
          <StatsView habits={habits} entries={entries} />
        </TabsContent>
        
        <TabsContent value="chart">
          <div className="space-y-4">
            {habits.map(habit => (
              <StatsChart key={habit.id} habit={habit} entries={entries} weeks={8} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="interactive">
          <div className="space-y-4">
            <InteractiveChart 
              habits={habits} 
              entries={entries} 
              weeks={8}
              chartType="line"
            />
            <InteractiveChart 
              habits={habits} 
              entries={entries} 
              weeks={8}
              chartType="bar"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="report">
          <ReportView
            habits={habits}
            entries={entries}
            streaks={streakMap}
            completionRates={completionMap}
          />
        </TabsContent>
        
        <TabsContent value="heatmap">
          <div className="space-y-4">
            {habits.map(habit => (
              <HeatmapView key={habit.id} habit={habit} entries={entries} days={84} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
