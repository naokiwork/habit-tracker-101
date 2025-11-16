import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, TrendingUp, CheckCircle2, Sparkles, Trash2, Edit2, MoreVertical, Download, Upload, Minus, ArrowUp, ArrowDown, Grid3x3, List, Calendar, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import './App.css'

interface HabitPlan {
  time?: string // HH:mm format
  daysOfWeek?: number[] // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  duration?: number // minutes
  description?: string // what to do
}

interface Habit {
  id: string
  name: string
  emoji: string
  color: string
  createdAt: string
  order?: number
  plan?: HabitPlan
}

interface HabitEntry {
  [date: string]: {
    [habitId: string]: 'done' | 'skip'
  }
}

// Constants
const COLORS = ['#0071E3', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#FF2D55']
const EMOJIS = ['💪', '📚', '🏃', '🧘', '💧', '🎯', '✍️', '🎨', '🎵', '🌱']
const MAX_STREAK_DAYS = 365 // Maximum days to check for streak
const DAYS_IN_WEEK = 7
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000
const CLOCK_UPDATE_INTERVAL = 10 // Update clock every 10ms instead of 1ms for better performance
const DATA_VERSION = '1.0.0' // Data schema version
const LOCAL_STORAGE_QUOTA_WARNING = 5 * 1024 * 1024 // 5MB warning threshold

// Helper functions (defined before App component)
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day
  const weekStart = new Date(d)
  weekStart.setDate(diff)
  return weekStart
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper functions for Monthly and Yearly views
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getMonthDates(year: number, month: number): Date[] {
  const daysInMonth = getDaysInMonth(year, month)
  const dates: Date[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month, day))
  }
  return dates
}

function getMonthsInYear(year: number): Date[] {
  const months: Date[] = []
  for (let month = 0; month < 12; month++) {
    months.push(new Date(year, month, 1))
  }
  return months
}


/**
 * Compute strike count based on plan and checks
 * 
 * @param plan - Set of scheduled weekdays (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param checks - Set of checked dates in 'YYYY-MM-DD' format
 * @param today - Today's date (upper limit for calculation)
 * @returns Strike count (number of checked days since last missed plan day)
 * 
 * Logic:
 * 1. Traverse backward from today until finding a plan day that was NOT checked
 * 2. That day marks the "boundary"
 * 3. Count all checked days (plan or non-plan) after that boundary day, up to today
 * 
 * Rules:
 * - Missing a non-plan day does NOT reset the strike
 * - Missing a plan day DOES reset the strike
 * - Checked non-plan days DO count toward the strike
 */
function computeStrike(
  plan: Set<number>,
  checks: Set<string>,
  today: Date
): number {
  // Normalize today to start of day in local timezone
  const todayNormalized = new Date(today)
  todayNormalized.setHours(0, 0, 0, 0)
  
  // Debug logging
  const debugMode = false // Set to true to enable debug logs
  if (debugMode) {
    console.log('=== computeStrike Debug ===')
    console.log('Plan:', Array.from(plan))
    console.log('Checks:', Array.from(checks).sort())
    console.log('Today:', formatDate(todayNormalized))
  }
  
  // If no plan, count all checked days from today backwards
  if (plan.size === 0) {
    let count = 0
    for (let i = 0; i < MAX_STREAK_DAYS; i++) {
      const dateToCheck = new Date(todayNormalized)
      dateToCheck.setDate(todayNormalized.getDate() - i)
      const dateStr = formatDate(dateToCheck)
      if (debugMode && i < 10) {
        console.log(`  Day ${i}: ${dateStr}, checked: ${checks.has(dateStr)}`)
      }
      if (checks.has(dateStr)) {
        count++
      } else {
        break
      }
    }
    if (debugMode) {
      console.log('No plan - Strike count:', count)
    }
    return count
  }
  
  // Find the boundary: the last missed plan day (going backwards from today)
  // "Last missed" means the most recent (closest to today) plan day that was NOT checked
  let boundaryDate: Date | null = null
  
  for (let i = 0; i < MAX_STREAK_DAYS; i++) {
    const dateToCheck = new Date(todayNormalized)
    dateToCheck.setDate(todayNormalized.getDate() - i)
    dateToCheck.setHours(0, 0, 0, 0)
    
    const dayOfWeek = dateToCheck.getDay()
    const dateStr = formatDate(dateToCheck)
    const isPlanned = plan.has(dayOfWeek)
    const isChecked = checks.has(dateStr)
    
    if (debugMode && i < 10) {
      console.log(`  Day ${i}: ${dateStr} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}), planned: ${isPlanned}, checked: ${isChecked}`)
    }
    
    // If this is a plan day that was NOT checked, this is our boundary
    if (isPlanned && !isChecked) {
      boundaryDate = dateToCheck
      if (debugMode) {
        console.log('Boundary found:', formatDate(boundaryDate))
      }
      break
    }
  }
  
  // Determine the start date for counting
  let startDate: Date
  
  if (boundaryDate) {
    // Count from the day after the boundary
    startDate = new Date(boundaryDate.getTime() + 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)
    if (debugMode) {
      console.log('Using boundary - Start date:', formatDate(startDate))
    }
  } else {
    // No boundary found - all plan days in the checked range were checked
    // Find the first checked day going backwards from today
    // This will be the start of our streak
    let firstCheckedDate: Date | null = null
    
    for (let i = 0; i < MAX_STREAK_DAYS; i++) {
      const dateToCheck = new Date(todayNormalized)
      dateToCheck.setDate(todayNormalized.getDate() - i)
      dateToCheck.setHours(0, 0, 0, 0)
      const dateStr = formatDate(dateToCheck)
      
      if (checks.has(dateStr)) {
        firstCheckedDate = dateToCheck
      } else {
        // Found an unchecked day - if we already found a checked day, use it
        if (firstCheckedDate) {
          break
        }
      }
    }
    
    if (firstCheckedDate) {
      startDate = firstCheckedDate
      if (debugMode) {
        console.log('No boundary - First checked date:', formatDate(startDate))
      }
    } else {
      // No checked days found in the range - return 0
      if (debugMode) {
        console.log('No checked days found - returning 0')
      }
      return 0
    }
  }
  
  // Count all checked days from startDate to today (inclusive)
  // This includes both planned and non-planned days
  let strike = 0
  const endDate = new Date(todayNormalized)
  
  if (debugMode) {
    console.log('Counting from', formatDate(startDate), 'to', formatDate(endDate))
  }
  
  // Iterate from startDate to endDate (inclusive)
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate)
    if (checks.has(dateStr)) {
      strike++
      if (debugMode) {
        console.log(`  ✓ ${dateStr} (strike: ${strike})`)
      }
    } else if (debugMode) {
      console.log(`  ✗ ${dateStr}`)
    }
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  if (debugMode) {
    console.log('Final strike count:', strike)
    console.log('=== End computeStrike Debug ===')
  }
  
  return strike
}

function App() {
  const { toast } = useToast()
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<HabitEntry>({})
  const [newHabitName, setNewHabitName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0])
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [planTime, setPlanTime] = useState('')
  const [planDays, setPlanDays] = useState<number[]>([])
  const [planDuration, setPlanDuration] = useState<number | ''>('')
  const [planDescription, setPlanDescription] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [deleteHabitId, setDeleteHabitId] = useState<string | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()))
  const [showConfetti, setShowConfetti] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState<'ivory' | 'gray'>('ivory')
  const [activeTab, setActiveTab] = useState<'grid' | 'list' | 'monthly' | 'yearly'>('grid')
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  // Check localStorage quota
  const checkStorageQuota = () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then((estimate) => {
          if (estimate.usage && estimate.quota) {
            const usageMB = estimate.usage / (1024 * 1024)
            const quotaMB = estimate.quota / (1024 * 1024)
            if (estimate.usage > LOCAL_STORAGE_QUOTA_WARNING) {
              toast({
                title: 'Storage Warning',
                description: `You're using ${usageMB.toFixed(2)}MB of ${quotaMB.toFixed(2)}MB. Consider exporting old data.`,
                variant: 'default',
              })
            }
          }
        })
      }
    } catch (error) {
      console.error('Error checking storage quota:', error)
    }
  }

  // Safe localStorage operations with error handling and version check
  useEffect(() => {
    setIsLoading(true)
    try {
    const savedHabits = localStorage.getItem('habitgrid-habits')
    const savedEntries = localStorage.getItem('habitgrid-entries')
      const savedVersion = localStorage.getItem('habitgrid-version')
      
      // Check data version compatibility
      if (savedVersion && savedVersion !== DATA_VERSION) {
        toast({
          title: 'Data Version Mismatch',
          description: 'Your data format may need migration. Please backup your data.',
          variant: 'default',
        })
      }
      
      if (savedHabits) {
        const parsed = JSON.parse(savedHabits)
        if (Array.isArray(parsed)) {
          setHabits(parsed)
        }
      }
      if (savedEntries) {
        const parsed = JSON.parse(savedEntries)
        if (typeof parsed === 'object' && parsed !== null) {
          setEntries(parsed)
        }
      }
      
      // Set version if not exists
      if (!savedVersion) {
        localStorage.setItem('habitgrid-version', DATA_VERSION)
      }
      
      checkStorageQuota()
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load saved data. Corrupted data has been cleared.',
        variant: 'destructive',
      })
      // Clear corrupted data
      localStorage.removeItem('habitgrid-habits')
      localStorage.removeItem('habitgrid-entries')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isLoading) return // Don't save during initial load
    try {
    localStorage.setItem('habitgrid-habits', JSON.stringify(habits))
      localStorage.setItem('habitgrid-version', DATA_VERSION)
    } catch (error) {
      console.error('Error saving habits to localStorage:', error)
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast({
          title: 'Storage Full',
          description: 'Cannot save data. Please free up space or export old data.',
          variant: 'destructive',
        })
      }
    }
  }, [habits, isLoading, toast])

  useEffect(() => {
    if (isLoading) return // Don't save during initial load
    try {
    localStorage.setItem('habitgrid-entries', JSON.stringify(entries))
    } catch (error) {
      console.error('Error saving entries to localStorage:', error)
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast({
          title: 'Storage Full',
          description: 'Cannot save data. Please free up space or export old data.',
          variant: 'destructive',
        })
      }
    }
  }, [entries, isLoading, toast])

  // Update digital clock at optimized interval
  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date())
    }
    
    // Update immediately
    updateClock()
    
    // Update at optimized interval (10ms for smooth millisecond display)
    const interval = setInterval(updateClock, CLOCK_UPDATE_INTERVAL)
    
    return () => clearInterval(interval)
  }, [])

  // Update background color based on time of day (optimized: check every hour)
  useEffect(() => {
    const updateBackgroundColor = () => {
      const now = new Date()
      const hour = now.getHours()
      // 3:00 AM (3) to 3:00 PM (15) = ivory, otherwise gray
      if (hour >= 3 && hour < 15) {
        setBackgroundColor('ivory')
      } else {
        setBackgroundColor('gray')
      }
    }

    // Update immediately
    updateBackgroundColor()

    // Calculate milliseconds until next hour
    const now = new Date()
    const msUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000
    
    // Update at the start of next hour, then every hour
    const timeout = setTimeout(() => {
      updateBackgroundColor()
      const interval = setInterval(updateBackgroundColor, MILLISECONDS_PER_HOUR)
      return () => clearInterval(interval)
    }, msUntilNextHour)

    return () => clearTimeout(timeout)
  }, [])

  function getWeekDates(weekStart: Date): Date[] {
    const dates: Date[] = []
    for (let i = 0; i < DAYS_IN_WEEK; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  // Sort habits by order, then by creation date
  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      const orderA = a.order ?? habits.indexOf(a)
      const orderB = b.order ?? habits.indexOf(b)
      return orderA - orderB
    })
  }, [habits])

  function addHabit() {
    const trimmedName = newHabitName.trim()
    if (!trimmedName) return
    
    // Check for duplicate names
    if (habits.some(h => h.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({
        title: 'Duplicate Habit',
        description: 'A habit with this name already exists!',
        variant: 'destructive',
      })
      return
    }
    
    const plan: HabitPlan | undefined = (planTime || planDays.length > 0 || planDuration || planDescription.trim()) ? {
      time: planTime || undefined,
      daysOfWeek: planDays.length > 0 ? planDays : undefined,
      duration: typeof planDuration === 'number' ? planDuration : undefined,
      description: planDescription.trim() || undefined
    } : undefined
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: trimmedName,
      emoji: selectedEmoji,
      color: selectedColor,
      createdAt: new Date().toISOString(),
      order: habits.length,
      plan
    }
    
    setHabits([...habits, newHabit])
    setNewHabitName('')
    setSelectedEmoji(EMOJIS[0])
    setSelectedColor(COLORS[0])
    setPlanTime('')
    setPlanDays([])
    setPlanDuration('')
    setPlanDescription('')
    setIsDialogOpen(false)
  }

  function moveHabit(habitId: string, direction: 'up' | 'down') {
    const currentIndex = sortedHabits.findIndex(h => h.id === habitId)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sortedHabits.length) return
    
    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        return { ...h, order: newIndex }
      }
      if (h.id === sortedHabits[newIndex].id) {
        return { ...h, order: currentIndex }
      }
      return h
    })
    
    setHabits(updatedHabits)
  }

  function updateHabit(habitId: string, updates: Partial<Habit>) {
    setHabits(habits.map(h => h.id === habitId ? { ...h, ...updates } : h))
  }

  function deleteHabit(habitId: string) {
    setHabits(habits.filter(h => h.id !== habitId))
    // Also remove all entries for this habit
    const newEntries = { ...entries }
    Object.keys(newEntries).forEach(date => {
      if (newEntries[date][habitId]) {
        delete newEntries[date][habitId]
        if (Object.keys(newEntries[date]).length === 0) {
          delete newEntries[date]
        }
      }
    })
    setEntries(newEntries)
    setDeleteHabitId(null)
  }

  function exportData() {
    const data = {
      version: DATA_VERSION,
      exportDate: new Date().toISOString(),
      habits,
      entries
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habitgrid-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.habits && Array.isArray(data.habits)) {
          // Use toast for confirmation instead of confirm dialog
          const shouldImport = window.confirm('This will replace all your current data. Continue?')
          if (shouldImport) {
            setHabits(data.habits)
            if (data.entries && typeof data.entries === 'object') {
              setEntries(data.entries)
            }
            toast({
              title: 'Data Imported',
              description: 'Your data has been successfully imported.',
              variant: 'default',
            })
          }
        } else {
          toast({
            title: 'Invalid File',
            description: 'The file format is invalid. Please check the file.',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Import Error',
          description: 'Error importing data. Please check the file format.',
          variant: 'destructive',
        })
        console.error(error)
      }
    }
    reader.readAsText(file)
    // Reset input
    event.target.value = ''
  }

  function toggleHabit(habitId: string, date: Date, rightClick = false) {
    const dateStr = formatDate(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateToCheck = new Date(date)
    dateToCheck.setHours(0, 0, 0, 0)
    const isPastDate = dateToCheck < today
    
    const currentStatus = entries[dateStr]?.[habitId]
    const newEntries = { ...entries }
    if (!newEntries[dateStr]) newEntries[dateStr] = {}
    
    if (rightClick) {
      // Right click: cycle through none -> skip -> done
    if (currentStatus === 'done') {
        newEntries[dateStr][habitId] = 'skip'
      } else if (currentStatus === 'skip') {
      delete newEntries[dateStr][habitId]
    } else {
      newEntries[dateStr][habitId] = 'done'
      triggerConfetti()
      }
    } else {
      // Left click: toggle done
      if (currentStatus === 'done') {
        delete newEntries[dateStr][habitId]
      } else {
        newEntries[dateStr][habitId] = 'done'
        if (!isPastDate) {
          triggerConfetti()
        }
      }
    }
    
    setEntries(newEntries)
  }

  function triggerConfetti() {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 1000)
  }

  // Memoized streak calculation using computeStrike function
  // Uses the new specification: count all checked days since last missed plan day
  const getStreak = useCallback((habitId: string): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get habit to check if it has a plan
    const habit = habits.find(h => h.id === habitId)
    const plannedDays = habit?.plan?.daysOfWeek || [] // Array of day numbers (0=Sunday, 6=Saturday)
    
    // Convert plan array to Set
    const planSet = new Set(plannedDays)
    
    // Collect all checked dates for this habit
    const checksSet = new Set<string>()
    for (const [dateStr, dayEntries] of Object.entries(entries)) {
      if (dayEntries[habitId] === 'done') {
        checksSet.add(dateStr)
      }
    }
    
    // Debug logging for specific habit (enable by setting habit name)
    const debugHabitName = '' // Set to habit name to enable debug (e.g., 'study')
    if (debugHabitName && habit?.name === debugHabitName) {
      console.log(`\n[getStreak Debug for "${debugHabitName}"]`)
      console.log('Habit ID:', habitId)
      console.log('Planned days:', plannedDays)
      console.log('Plan set:', Array.from(planSet))
      console.log('Checked dates:', Array.from(checksSet).sort())
      console.log('Today:', formatDate(today))
    }
    
    // Use computeStrike function
    const strike = computeStrike(planSet, checksSet, today)
    
    if (debugHabitName && habit?.name === debugHabitName) {
      console.log('Computed strike:', strike)
      console.log('[End getStreak Debug]\n')
    }
    
    return strike
  }, [entries, habits])

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart])
  const isCurrentWeek = useMemo(() => formatDate(currentWeekStart) === formatDate(getWeekStart(new Date())), [currentWeekStart])

  // Memoized completion rate calculations
  const completionRates = useMemo(() => {
    const rates: Record<string, number> = {}
    habits.forEach(habit => {
    const completed = weekDates.filter(date => 
        entries[formatDate(date)]?.[habit.id] === 'done'
    ).length
      rates[habit.id] = Math.round((completed / DAYS_IN_WEEK) * 100)
    })
    return rates
  }, [habits, weekDates, entries])

  const totalCompletionRate = useMemo(() => {
    if (habits.length === 0) return 0
    const totalPossible = habits.length * DAYS_IN_WEEK
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
  }, [habits, weekDates, entries])

  function getCompletionRate(habitId: string): number {
    return completionRates[habitId] || 0
  }

  function getTotalCompletionRate(): number {
    return totalCompletionRate
  }

  function navigateWeek(direction: 'prev' | 'next') {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? DAYS_IN_WEEK : -DAYS_IN_WEEK))
    setCurrentWeekStart(newStart)
  }

  function goToToday() {
    setCurrentWeekStart(getWeekStart(new Date()))
  }

  // Memoized streaks for all habits (must be before early return)
  const streaks = useMemo(() => {
    const streakMap: Record<string, number> = {}
    habits.forEach(habit => {
      streakMap[habit.id] = getStreak(habit.id)
    })
    return streakMap
  }, [habits, entries, getStreak])

  // Monthly view data aggregation
  const monthlyData = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const monthDates = getMonthDates(year, month)
    const data: Record<string, { completed: number; total: number; rate: number }> = {}
    
    habits.forEach(habit => {
      const completed = monthDates.filter(date => 
        entries[formatDate(date)]?.[habit.id] === 'done'
      ).length
      data[habit.id] = {
        completed,
        total: monthDates.length,
        rate: monthDates.length > 0 ? Math.round((completed / monthDates.length) * 100) : 0
      }
    })
    return data
  }, [habits, entries, currentMonth])

  // Yearly view data aggregation
  const yearlyData = useMemo(() => {
    const yearMonths = getMonthsInYear(currentYear)
    const data: Record<string, { completed: number; total: number; rate: number; monthlyBreakdown: Record<number, number> }> = {}
    
    habits.forEach(habit => {
      const monthlyBreakdown: Record<number, number> = {}
      let totalCompleted = 0
      let totalDays = 0
      
      yearMonths.forEach((monthDate, monthIndex) => {
        const monthDates = getMonthDates(monthDate.getFullYear(), monthDate.getMonth())
        const completed = monthDates.filter(date => 
          entries[formatDate(date)]?.[habit.id] === 'done'
        ).length
        monthlyBreakdown[monthIndex] = completed
        totalCompleted += completed
        totalDays += monthDates.length
      })
      
      data[habit.id] = {
        completed: totalCompleted,
        total: totalDays,
        rate: totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0,
        monthlyBreakdown
      }
    })
    return data
  }, [habits, entries, currentYear])

  // Navigation functions for monthly and yearly views
  function navigateMonth(direction: 'prev' | 'next') {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentMonth(newMonth)
  }

  function navigateYear(direction: 'prev' | 'next') {
    setCurrentYear(currentYear + (direction === 'next' ? 1 : -1))
  }

  function goToCurrentMonth() {
    setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  }

  function goToCurrentYear() {
    setCurrentYear(new Date().getFullYear())
  }

  // Show loading state (after all hooks)
  if (isLoading) {
  return (
      <div className={`min-h-screen ${backgroundColor === 'ivory' ? 'bg-ivory' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0071E3] mb-4"></div>
          <p className="text-gray-600">Loading your habits...</p>
        </div>
      </div>
    )
  }

  // Format time for digital clock with fixed-width characters
  const formatDigitalClock = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
    return { hours, minutes, seconds, milliseconds }
  }

  return (
    <div className={`min-h-screen ${backgroundColor === 'ivory' ? 'bg-ivory' : 'bg-gray-100'}`}>
      <Toaster />
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="confetti-animation text-6xl">🎉</div>
        </div>
      )}
      
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-semibold text-[#1D1D1F] tracking-tight">
                HabitGrid
              </h1>
              <p className="mt-2 text-lg sm:text-xl text-gray-600">
                Build momentum. One check at a time.
              </p>
            </div>
            
            {/* Digital Clock - Center (Fixed Position) */}
            {(() => {
              const time = formatDigitalClock(currentTime)
              return (
                <>
                  <div className="hidden sm:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
                    <div 
                      className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1D1D1F] tracking-wider whitespace-nowrap"
                      style={{ 
                        fontFamily: "'DSEG7', 'Orbitron', monospace",
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '0.1em',
                        minWidth: '240px',
                        textAlign: 'center'
                      }}
                    >
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.hours[0]}</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.hours[1]}</span>
                      <span style={{ display: 'inline-block', width: '0.3em', textAlign: 'center' }}>:</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.minutes[0]}</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.minutes[1]}</span>
                      <span style={{ display: 'inline-block', width: '0.3em', textAlign: 'center' }}>:</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.seconds[0]}</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.seconds[1]}</span>
                      <span style={{ display: 'inline-block', width: '0.2em', textAlign: 'center' }}>.</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.milliseconds[0]}</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.milliseconds[1]}</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.milliseconds[2]}</span>
                    </div>
                  </div>
                  
                  {/* Mobile Clock - Center */}
                  <div className="flex justify-center sm:hidden">
                    <div 
                      className="text-xl font-bold text-[#1D1D1F] tracking-wider"
                      style={{ 
                        fontFamily: "'DSEG7', 'Orbitron', monospace",
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '0.1em',
                        minWidth: '200px',
                        textAlign: 'center'
                      }}
                    >
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.hours[0]}</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.hours[1]}</span>
                      <span style={{ display: 'inline-block', width: '0.3em', textAlign: 'center' }}>:</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.minutes[0]}</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.minutes[1]}</span>
                      <span style={{ display: 'inline-block', width: '0.3em', textAlign: 'center' }}>:</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.seconds[0]}</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.seconds[1]}</span>
                      <span style={{ display: 'inline-block', width: '0.2em', textAlign: 'center' }}>.</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.milliseconds[0]}</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.milliseconds[1]}</span>
                      <span style={{ display: 'inline-block', width: '1.2em', textAlign: 'center' }}>{time.milliseconds[2]}</span>
                    </div>
                  </div>
                </>
              )
            })()}
            
            <div className="flex items-center gap-3">
              <Button
                onClick={exportData}
                variant="outline"
                className="rounded-full px-4 py-2 border-gray-300 hover:bg-gray-50"
                aria-label="Export data"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <label>
                <Button
                  variant="outline"
                  className="rounded-full px-4 py-2 border-gray-300 hover:bg-gray-50 cursor-pointer"
                  aria-label="Import data"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) {
                  setEditingHabit(null)
                  setNewHabitName('')
                  setSelectedEmoji(EMOJIS[0])
                  setSelectedColor(COLORS[0])
                  setPlanTime('')
                  setPlanDays([])
                  setPlanDuration('')
                  setPlanDescription('')
                } else if (editingHabit) {
                  // Load plan data when editing
                  setPlanTime(editingHabit.plan?.time || '')
                  setPlanDays(editingHabit.plan?.daysOfWeek || [])
                  setPlanDuration(editingHabit.plan?.duration || '')
                  setPlanDescription(editingHabit.plan?.description || '')
                }
              }}>
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
                      {editingHabit ? 'Edit Habit' : 'Create New Habit'}
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingHabit) {
                              updateHabit(editingHabit.id, { name: newHabitName.trim() })
                              setIsDialogOpen(false)
                            } else {
                              addHabit()
                            }
                          }
                        }}
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

                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <Label className="text-base font-medium text-[#1D1D1F]">Plan (Optional)</Label>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="plan-time" className="text-sm font-medium text-gray-700">
                              Time
                            </Label>
                            <Input
                              id="plan-time"
                              type="time"
                              value={planTime}
                              onChange={(e) => setPlanTime(e.target.value)}
                              className="py-3 rounded-xl border-gray-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="plan-duration" className="text-sm font-medium text-gray-700">
                              Duration (minutes)
                            </Label>
                            <Input
                              id="plan-duration"
                              type="number"
                              min="1"
                              value={planDuration}
                              onChange={(e) => setPlanDuration(e.target.value ? parseInt(e.target.value) : '')}
                              placeholder="e.g., 30"
                              className="py-3 rounded-xl border-gray-300"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Days of Week</Label>
                          <div className="flex flex-wrap gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`day-${index}`}
                                  checked={planDays.includes(index)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setPlanDays([...planDays, index])
                                    } else {
                                      setPlanDays(planDays.filter(d => d !== index))
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`day-${index}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {day}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="plan-description" className="text-sm font-medium text-gray-700">
                            What to do
                          </Label>
                          <Textarea
                            id="plan-description"
                            value={planDescription}
                            onChange={(e) => setPlanDescription(e.target.value)}
                            placeholder="e.g., Run 5km in the park"
                            className="min-h-[80px] rounded-xl border-gray-300"
                          />
                        </div>
                    </div>
                  </div>
                  
                  <Button
                      onClick={() => {
                        if (editingHabit) {
                          const plan: HabitPlan | undefined = (planTime || planDays.length > 0 || planDuration || planDescription.trim()) ? {
                            time: planTime || undefined,
                            daysOfWeek: planDays.length > 0 ? planDays : undefined,
                            duration: typeof planDuration === 'number' ? planDuration : undefined,
                            description: planDescription.trim() || undefined
                          } : undefined
                          
                          updateHabit(editingHabit.id, { 
                            name: newHabitName.trim(),
                            emoji: selectedEmoji,
                            color: selectedColor,
                            plan
                          })
                          setIsDialogOpen(false)
                          setEditingHabit(null)
                        } else {
                          addHabit()
                        }
                      }}
                    className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl py-6 text-base font-medium transition-all duration-300"
                    disabled={!newHabitName.trim()}
                  >
                      {editingHabit ? 'Update Habit' : 'Create Habit'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'grid' | 'list' | 'monthly' | 'yearly')} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-white border border-gray-200 rounded-full p-1 flex-wrap">
              <TabsTrigger value="grid" className="rounded-full px-4 sm:px-6 py-2 data-[state=active]:bg-[#0071E3] data-[state=active]:text-white">
                <Grid3x3 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Grid View</span>
                <span className="sm:hidden">Grid</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-full px-4 sm:px-6 py-2 data-[state=active]:bg-[#0071E3] data-[state=active]:text-white">
                <List className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Habits List</span>
                <span className="sm:hidden">List</span>
              </TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-full px-4 sm:px-6 py-2 data-[state=active]:bg-[#0071E3] data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Monthly View</span>
                <span className="sm:hidden">Month</span>
              </TabsTrigger>
              <TabsTrigger value="yearly" className="rounded-full px-4 sm:px-6 py-2 data-[state=active]:bg-[#0071E3] data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Yearly View</span>
                <span className="sm:hidden">Year</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid" className="mt-0">
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
                    {sortedHabits.map((habit) => {
                      const completionRate = getCompletionRate(habit.id)
                      
                      return (
                        <tr key={habit.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                          <td className="sticky left-0 bg-white hover:bg-gray-50 z-10 px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{habit.emoji}</span>
                              <span className="text-base font-medium text-[#1D1D1F]">
                                {habit.name}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingHabit(habit)
                                      setNewHabitName(habit.name)
                                      setSelectedEmoji(habit.emoji)
                                      setSelectedColor(habit.color)
                                      setPlanTime(habit.plan?.time || '')
                                      setPlanDays(habit.plan?.daysOfWeek || [])
                                      setPlanDuration(habit.plan?.duration || '')
                                      setPlanDescription(habit.plan?.description || '')
                                      setIsDialogOpen(true)
                                    }}
                                  >
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {sortedHabits.findIndex(h => h.id === habit.id) > 0 && (
                                    <DropdownMenuItem
                                      onClick={() => moveHabit(habit.id, 'up')}
                                    >
                                      <ArrowUp className="mr-2 h-4 w-4" />
                                      Move Up
                                    </DropdownMenuItem>
                                  )}
                                  {sortedHabits.findIndex(h => h.id === habit.id) < sortedHabits.length - 1 && (
                                    <DropdownMenuItem
                                      onClick={() => moveHabit(habit.id, 'down')}
                                    >
                                      <ArrowDown className="mr-2 h-4 w-4" />
                                      Move Down
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => setDeleteHabitId(habit.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                          {weekDates.map((date) => {
                            const dateStr = formatDate(date)
                            const status = entries[dateStr]?.[habit.id]
                            const isDone = status === 'done'
                            const isSkipped = status === 'skip'
                            const isToday = formatDate(date) === formatDate(new Date())
                            
                            return (
                              <td key={dateStr} className="px-4 py-4">
                                <button
                                  onClick={(e) => toggleHabit(habit.id, date, e.button === 2)}
                                  onContextMenu={(e) => {
                                    e.preventDefault()
                                    toggleHabit(habit.id, date, true)
                                  }}
                                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                                    isDone
                                      ? 'shadow-md'
                                      : isSkipped
                                      ? 'border-2 border-orange-300 bg-orange-50'
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
                                  {isSkipped && (
                                    <Minus className="w-6 h-6 text-orange-600" />
                                  )}
                                </button>
                              </td>
                            )
                          })}
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1 text-sm">
                                <span className="font-semibold text-[#1D1D1F]">{streaks[habit.id] || 0}</span>
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

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedHabits.map((habit) => {
                const streak = streaks[habit.id] || 0
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
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            {habits.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                  <Sparkles className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-3">
                  No Habits Yet
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                  Create your first habit to see it listed here.
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
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-[#1D1D1F]">
                    All Habits ({sortedHabits.length})
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedHabits.map((habit) => {
                    const streak = streaks[habit.id] || 0
                    const completionRate = getCompletionRate(habit.id)
                    const createdAt = new Date(habit.createdAt)
                    const daysSinceCreation = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
                    
                    // Calculate total completion count
                    const totalCompleted = Object.values(entries).reduce((count, dayEntries) => {
                      return count + (dayEntries[habit.id] === 'done' ? 1 : 0)
                    }, 0)
                    
                    return (
                      <div
                        key={habit.id}
                        className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{habit.emoji}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                                {habit.name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Created {daysSinceCreation === 0 ? 'today' : `${daysSinceCreation} day${daysSinceCreation > 1 ? 's' : ''} ago`}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingHabit(habit)
                                  setNewHabitName(habit.name)
                                  setSelectedEmoji(habit.emoji)
                                  setSelectedColor(habit.color)
                                  setPlanTime(habit.plan?.time || '')
                                  setPlanDays(habit.plan?.daysOfWeek || [])
                                  setPlanDuration(habit.plan?.duration || '')
                                  setPlanDescription(habit.plan?.description || '')
                                  setIsDialogOpen(true)
                                }}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {sortedHabits.findIndex(h => h.id === habit.id) > 0 && (
                                <DropdownMenuItem
                                  onClick={() => moveHabit(habit.id, 'up')}
                                >
                                  <ArrowUp className="mr-2 h-4 w-4" />
                                  Move Up
                                </DropdownMenuItem>
                              )}
                              {sortedHabits.findIndex(h => h.id === habit.id) < sortedHabits.length - 1 && (
                                <DropdownMenuItem
                                  onClick={() => moveHabit(habit.id, 'down')}
                                >
                                  <ArrowDown className="mr-2 h-4 w-4" />
                                  Move Down
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setDeleteHabitId(habit.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-600">Current Streak</span>
                            <span className="text-2xl font-bold" style={{ color: habit.color }}>
                              {streak}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <div className="text-xs text-gray-500 mb-1">This Week</div>
                              <div className="text-lg font-semibold text-[#1D1D1F]">
                                {completionRate}%
                              </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <div className="text-xs text-gray-500 mb-1">Total Done</div>
                              <div className="text-lg font-semibold text-[#1D1D1F]">
                                {totalCompleted}
                              </div>
                            </div>
                          </div>
                          
                          {habit.plan && (
                            <div className="pt-3 border-t border-gray-200 space-y-2">
                              <div className="text-xs font-semibold text-gray-700 mb-2">Plan</div>
                              {habit.plan.time && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="font-medium">Time:</span>
                                  <span>{habit.plan.time}</span>
                                </div>
                              )}
                              {habit.plan.daysOfWeek && habit.plan.daysOfWeek.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="font-medium">Days:</span>
                                  <span>{habit.plan.daysOfWeek.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}</span>
                                </div>
                              )}
                              {habit.plan.duration && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="font-medium">Duration:</span>
                                  <span>{habit.plan.duration} minutes</span>
                                </div>
                              )}
                              {habit.plan.description && (
                                <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                                  {habit.plan.description}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: habit.color }}
                              />
                              <span className="text-xs text-gray-500">Color: {habit.color}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="mt-0">
            {habits.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                  <Sparkles className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-3">
                  No Habits Yet
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                  Create your first habit to see it in the monthly view.
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
              <div className="space-y-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    onClick={() => navigateMonth('prev')}
                    variant="outline"
                    className="rounded-full px-4 py-2 border-gray-300 hover:bg-gray-50"
                    aria-label="Previous month"
                  >
                    ←
                  </Button>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[#1D1D1F]">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    {formatDate(currentMonth) !== formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)) && (
                      <Button
                        onClick={goToCurrentMonth}
                        variant="ghost"
                        className="text-sm text-gray-500 hover:text-gray-700 mt-1"
                      >
                        Go to current month
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => navigateMonth('next')}
                    variant="outline"
                    className="rounded-full px-4 py-2 border-gray-300 hover:bg-gray-50"
                    aria-label="Next month"
                  >
                    →
                  </Button>
                </div>

                {/* Monthly Calendar Grid */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {(() => {
                      const year = currentMonth.getFullYear()
                      const month = currentMonth.getMonth()
                      const firstDay = new Date(year, month, 1)
                      const startDate = new Date(firstDay)
                      startDate.setDate(startDate.getDate() - firstDay.getDay())
                      const days: Date[] = []
                      for (let i = 0; i < 42; i++) {
                        const date = new Date(startDate)
                        date.setDate(startDate.getDate() + i)
                        days.push(date)
                      }
                      return days.map((date, idx) => {
                        const isCurrentMonth = date.getMonth() === month
                        const isToday = formatDate(date) === formatDate(new Date())
                        const dateStr = formatDate(date)
                        const dayEntries = entries[dateStr] || {}
                        const completedHabits = habits.filter(h => dayEntries[h.id] === 'done').length
                        const totalHabits = habits.length
                        const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0
                        
                        return (
                          <div
                            key={idx}
                            className={`
                              aspect-square rounded-lg border-2 p-1 transition-all
                              ${isCurrentMonth ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}
                              ${isToday ? 'ring-2 ring-[#0071E3] ring-offset-1' : ''}
                              ${completionRate === 100 ? 'bg-green-50 border-green-300' : completionRate > 0 ? 'bg-yellow-50 border-yellow-300' : ''}
                            `}
                          >
                            <div className="text-xs font-medium mb-1 text-gray-600">
                              {date.getDate()}
                            </div>
                            {totalHabits > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#0071E3] transition-all"
                                    style={{ width: `${completionRate}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-gray-500">{completedHabits}/{totalHabits}</span>
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Habits Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {habits.map(habit => {
                    const data = monthlyData[habit.id]
                    return (
                      <div key={habit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{habit.emoji}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#1D1D1F]">{habit.name}</h3>
                            <div className="text-sm text-gray-500">
                              {data.completed} / {data.total} days
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Completion Rate</span>
                            <span className="font-semibold" style={{ color: habit.color }}>
                              {data.rate}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all"
                              style={{ width: `${data.rate}%`, backgroundColor: habit.color }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="yearly" className="mt-0">
            {habits.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                  <Sparkles className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-3">
                  No Habits Yet
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                  Create your first habit to see it in the yearly view.
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
              <div className="space-y-6">
                {/* Year Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    onClick={() => navigateYear('prev')}
                    variant="outline"
                    className="rounded-full px-4 py-2 border-gray-300 hover:bg-gray-50"
                    aria-label="Previous year"
                  >
                    ←
                  </Button>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[#1D1D1F]">
                      {currentYear}
                    </div>
                    {currentYear !== new Date().getFullYear() && (
                      <Button
                        onClick={goToCurrentYear}
                        variant="ghost"
                        className="text-sm text-gray-500 hover:text-gray-700 mt-1"
                      >
                        Go to current year
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => navigateYear('next')}
                    variant="outline"
                    className="rounded-full px-4 py-2 border-gray-300 hover:bg-gray-50"
                    aria-label="Next year"
                  >
                    →
                  </Button>
                </div>

                {/* Yearly Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">Year Overview</h3>
                  <div className="grid grid-cols-12 gap-2 mb-4">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                      <div key={idx} className="text-center text-xs font-medium text-gray-600 py-1">
                        {month}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    {(() => {
                      const yearMonths = getMonthsInYear(currentYear)
                      return yearMonths.map((monthDate, monthIdx) => {
                        const monthDates = getMonthDates(monthDate.getFullYear(), monthDate.getMonth())
                        const dayEntries = monthDates.reduce((acc, date) => {
                          const dateStr = formatDate(date)
                          const entriesForDate = entries[dateStr] || {}
                          habits.forEach(habit => {
                            if (entriesForDate[habit.id] === 'done') {
                              acc[habit.id] = (acc[habit.id] || 0) + 1
                            }
                          })
                          return acc
                        }, {} as Record<string, number>)
                        
                        const totalCompleted = Object.values(dayEntries).reduce((sum, count) => sum + count, 0)
                        const totalPossible = habits.length * monthDates.length
                        const completionRate = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0
                        
                        return (
                          <div
                            key={monthIdx}
                            className={`
                              aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center
                              ${completionRate === 100 ? 'bg-green-50 border-green-300' : completionRate >= 75 ? 'bg-green-100 border-green-400' : completionRate >= 50 ? 'bg-yellow-100 border-yellow-400' : completionRate >= 25 ? 'bg-orange-100 border-orange-400' : 'bg-gray-50 border-gray-200'}
                            `}
                          >
                            <div className="text-xs font-semibold text-gray-700">
                              {Math.round(completionRate)}%
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                              {totalCompleted}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Habits Yearly Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {habits.map(habit => {
                    const data = yearlyData[habit.id]
                    return (
                      <div key={habit.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">{habit.emoji}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#1D1D1F]">{habit.name}</h3>
                            <div className="text-sm text-gray-500">
                              {data.completed} / {data.total} days
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Year Completion Rate</span>
                            <span className="font-semibold" style={{ color: habit.color }}>
                              {data.rate}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all"
                              style={{ width: `${data.rate}%`, backgroundColor: habit.color }}
                            />
                          </div>
                          <div className="grid grid-cols-12 gap-1 mt-2">
                            {Array.from({ length: 12 }, (_, monthIdx) => {
                              const completed = data.monthlyBreakdown[monthIdx] || 0
                              const monthDates = getMonthDates(currentYear, monthIdx)
                              const maxDays = monthDates.length
                              const monthRate = maxDays > 0 ? (completed / maxDays) * 100 : 0
                              
                              return (
                                <div
                                  key={monthIdx}
                                  className={`
                                    aspect-square rounded text-[8px] flex items-center justify-center
                                    ${monthRate === 100 ? 'bg-green-500 text-white' : monthRate >= 75 ? 'bg-green-400 text-white' : monthRate >= 50 ? 'bg-yellow-400 text-white' : monthRate >= 25 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'}
                                  `}
                                  title={`${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIdx]}: ${completed} days`}
                                >
                                  {completed > 0 && completed}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            HabitGrid v2.0 · Built with Apple UX principles
          </p>
        </div>
      </footer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteHabitId !== null} onOpenChange={(open) => !open && setDeleteHabitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{habits.find(h => h.id === deleteHabitId)?.name}"? This will also remove all associated progress data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteHabitId && deleteHabit(deleteHabitId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default App
