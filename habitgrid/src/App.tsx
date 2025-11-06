import { useState, useEffect } from 'react'
import { Plus, TrendingUp, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import './App.css'

interface Habit {
  id: string
  name: string
  emoji: string
  color: string
  createdAt: string
}

interface HabitEntry {
  [date: string]: {
    [habitId: string]: 'done' | 'skip'
  }
}

const COLORS = ['#0071E3', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FF2D55']
const EMOJIS = ['💪', '📚', '🏃', '🧘', '💧', '🎯', '✍️', '🎨', '🎵', '🌱']

function App() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<HabitEntry>({})
  const [newHabitName, setNewHabitName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0])
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()))
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const savedHabits = localStorage.getItem('habitgrid-habits')
    const savedEntries = localStorage.getItem('habitgrid-entries')
    if (savedHabits) setHabits(JSON.parse(savedHabits))
    if (savedEntries) setEntries(JSON.parse(savedEntries))
  }, [])

  useEffect(() => {
    localStorage.setItem('habitgrid-habits', JSON.stringify(habits))
  }, [habits])

  useEffect(() => {
    localStorage.setItem('habitgrid-entries', JSON.stringify(entries))
  }, [entries])

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  function getWeekDates(weekStart: Date): Date[] {
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  function addHabit() {
    if (!newHabitName.trim()) return
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
      createdAt: new Date().toISOString()
    }
    
    setHabits([...habits, newHabit])
    setNewHabitName('')
    setSelectedEmoji(EMOJIS[0])
    setSelectedColor(COLORS[0])
    setIsDialogOpen(false)
  }

  function toggleHabit(habitId: string, date: Date) {
    const dateStr = formatDate(date)
    const currentStatus = entries[dateStr]?.[habitId]
    
    const newEntries = { ...entries }
    if (!newEntries[dateStr]) newEntries[dateStr] = {}
    
    if (currentStatus === 'done') {
      delete newEntries[dateStr][habitId]
    } else {
      newEntries[dateStr][habitId] = 'done'
      triggerConfetti()
    }
    
    setEntries(newEntries)
  }

  function triggerConfetti() {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 1000)
  }

  function getStreak(habitId: string): number {
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = formatDate(date)
      
      if (entries[dateStr]?.[habitId] === 'done') {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  function getCompletionRate(habitId: string): number {
    const weekDates = getWeekDates(currentWeekStart)
    const completed = weekDates.filter(date => 
      entries[formatDate(date)]?.[habitId] === 'done'
    ).length
    return Math.round((completed / 7) * 100)
  }

  function getTotalCompletionRate(): number {
    if (habits.length === 0) return 0
    const weekDates = getWeekDates(currentWeekStart)
    const totalPossible = habits.length * 7
    let totalCompleted = 0
    
    weekDates.forEach(date => {
      const dateStr = formatDate(date)
      habits.forEach(habit => {
        if (entries[dateStr]?.[habit.id] === 'done') {
          totalCompleted++
        }
      })
    })
    
    return Math.round((totalCompleted / totalPossible) * 100)
  }

  function navigateWeek(direction: 'prev' | 'next') {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newStart)
  }

  function goToToday() {
    setCurrentWeekStart(getWeekStart(new Date()))
  }

  const weekDates = getWeekDates(currentWeekStart)
  const isCurrentWeek = formatDate(currentWeekStart) === formatDate(getWeekStart(new Date()))

  return (
    <div className="min-h-screen bg-white">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="confetti-animation text-6xl">🎉</div>
        </div>
      )}
      
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-semibold text-[#1D1D1F] tracking-tight">
                HabitGrid
              </h1>
              <p className="mt-2 text-lg sm:text-xl text-gray-600">
                Build momentum. One check at a time.
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 py-6 text-base font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                  aria-label="Add new habit"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Habit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold text-[#1D1D1F]">
                    Create New Habit
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="habit-name" className="text-base font-medium text-[#1D1D1F]">
                      Habit Name
                    </Label>
                    <Input
                      id="habit-name"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="e.g., Morning Run"
                      className="text-base py-6 rounded-xl border-gray-300"
                      onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-[#1D1D1F]">Choose Emoji</Label>
                    <div className="flex flex-wrap gap-2">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`text-3xl p-3 rounded-xl transition-all duration-200 hover:scale-110 ${
                            selectedEmoji === emoji ? 'bg-gray-100 ring-2 ring-[#0071E3]' : 'hover:bg-gray-50'
                          }`}
                          aria-label={`Select ${emoji} emoji`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-[#1D1D1F]">Choose Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-12 h-12 rounded-xl transition-all duration-200 hover:scale-110 ${
                            selectedColor === color ? 'ring-2 ring-offset-2 ring-[#1D1D1F]' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={addHabit}
                    className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl py-6 text-base font-medium transition-all duration-300"
                    disabled={!newHabitName.trim()}
                  >
                    Create Habit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {habits.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <Sparkles className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-3">
              Start Your Journey
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Create your first habit to begin tracking your progress and building momentum.
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-8 py-6 text-lg font-medium transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Habit
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigateWeek('prev')}
                  variant="outline"
                  className="rounded-full px-4 py-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  aria-label="Previous week"
                >
                  ←
                </Button>
                <div className="text-center min-w-[200px]">
                  <div className="text-xl font-semibold text-[#1D1D1F]">
                    {formatDisplayDate(weekDates[0])} - {formatDisplayDate(weekDates[6])}
                  </div>
                  {!isCurrentWeek && (
                    <Button
                      onClick={goToToday}
                      variant="link"
                      className="text-[#0071E3] text-sm mt-1"
                    >
                      Go to Today
                    </Button>
                  )}
                </div>
                <Button
                  onClick={() => navigateWeek('next')}
                  variant="outline"
                  className="rounded-full px-4 py-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  aria-label="Next week"
                >
                  →
                </Button>
              </div>
              
              <div className="flex items-center gap-6 bg-gray-50 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#34C759]" />
                  <span className="text-sm text-gray-600">Completion</span>
                  <span className="text-xl font-semibold text-[#1D1D1F]">
                    {getTotalCompletionRate()}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="sticky left-0 bg-gray-50 z-10 px-6 py-4 text-left">
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          Habit
                        </span>
                      </th>
                      {weekDates.map((date) => (
                        <th key={formatDate(date)} className="px-4 py-4 text-center min-w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              {getDayName(date)}
                            </span>
                            <span className="text-sm font-semibold text-[#1D1D1F]">
                              {date.getDate()}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          Stats
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map((habit) => {
                      const streak = getStreak(habit.id)
                      const completionRate = getCompletionRate(habit.id)
                      
                      return (
                        <tr key={habit.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                          <td className="sticky left-0 bg-white hover:bg-gray-50 z-10 px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{habit.emoji}</span>
                              <span className="text-base font-medium text-[#1D1D1F]">
                                {habit.name}
                              </span>
                            </div>
                          </td>
                          {weekDates.map((date) => {
                            const dateStr = formatDate(date)
                            const isDone = entries[dateStr]?.[habit.id] === 'done'
                            const isToday = formatDate(date) === formatDate(new Date())
                            
                            return (
                              <td key={dateStr} className="px-4 py-4">
                                <button
                                  onClick={() => toggleHabit(habit.id, date)}
                                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                                    isDone
                                      ? 'shadow-md'
                                      : isToday
                                      ? 'border-2 border-dashed border-gray-300 hover:border-gray-400'
                                      : 'border border-gray-200 hover:border-gray-300'
                                  }`}
                                  style={{
                                    backgroundColor: isDone ? habit.color : 'transparent'
                                  }}
                                  aria-label={`Toggle ${habit.name} on ${formatDisplayDate(date)}`}
                                  aria-pressed={isDone}
                                >
                                  {isDone && (
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                  )}
                                </button>
                              </td>
                            )
                          })}
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1 text-sm">
                                <span className="font-semibold text-[#1D1D1F]">{streak}</span>
                                <span className="text-gray-500">day streak</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {completionRate}% this week
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {habits.slice(0, 3).map((habit) => {
                const streak = getStreak(habit.id)
                const completionRate = getCompletionRate(habit.id)
                
                return (
                  <div
                    key={habit.id}
                    className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{habit.emoji}</span>
                      <h3 className="text-lg font-semibold text-[#1D1D1F]">
                        {habit.name}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Streak</span>
                        <span className="text-2xl font-bold" style={{ color: habit.color }}>
                          {streak}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">This Week</span>
                        <span className="text-lg font-semibold text-[#1D1D1F]">
                          {completionRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            HabitGrid v2.0 · Built with Apple UX principles
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
