import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { TrendingUp } from 'lucide-react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useHabitStats } from '@/hooks/use-habit-stats'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'
import { HabitDialog } from '@/components/HabitDialog'
import { WeekNavigation } from '@/components/WeekNavigation'
import { HabitGrid } from '@/components/HabitGrid'
import { HabitGridMobile } from '@/components/HabitGridMobile'
import { HabitCard } from '@/components/HabitCard'
import { EmptyState } from '@/components/EmptyState'
import { Confetti } from '@/components/Confetti'
import { ExportImport } from '@/components/ExportImport'
import { IntegrationSettings } from '@/components/IntegrationSettings'
import { ShareDialog } from '@/components/ShareDialog'
import { SplitView } from '@/components/SplitView'
import { MinimalView } from '@/components/MinimalView'
import { FocusMode } from '@/components/FocusMode'
import { GroupView } from '@/components/GroupView'
import { CalendarView } from '@/components/CalendarView'
import { TimelineView } from '@/components/TimelineView'
import { ArchiveView } from '@/components/ArchiveView'
import { FilterBar } from '@/components/FilterBar'
import { TemplateDialog } from '@/components/TemplateDialog'
import { BackupView } from '@/components/BackupView'
import { AchievementNotification } from '@/components/AchievementNotification'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { startAutoBackup, stopAutoBackup } from '@/utils/backup-manager'
import { Spinner } from '@/components/ui/spinner'

// Lazy load StatsPanel for better performance
const StatsPanel = lazy(() => import('@/components/StatsPanel').then(module => ({ default: module.StatsPanel })))
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeToggle } from '@/components/ThemeToggle'
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts'
import { Toaster } from '@/components/ui/toaster'
import { validateStartupData } from '@/utils/data-integrity'
import { reminderManager } from '@/utils/reminder-manager'
import { executeAutomation } from '@/utils/automation'
import { parseShareLink } from '@/utils/social-sharing'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { STORAGE_KEYS } from '@/constants/habits'
import type { Habit, HabitEntry } from '@/types/habit'
import { getUtcKeyForLocalDay, getUtcWeekStart } from '@/lib/utils'
import './App.css'

function App() {
  const { toast } = useToast()
  const [rawHabits, setRawHabits] = useLocalStorage<unknown>(STORAGE_KEYS.HABITS, [], { debounceMs: 300 })
  const [rawEntries, setRawEntries] = useLocalStorage<unknown>(STORAGE_KEYS.ENTRIES, {}, { debounceMs: 300 })
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<HabitEntry>({})
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getUtcWeekStart(new Date()))
  const [showConfetti, setShowConfetti] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [showSplitView, setShowSplitView] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showBackup, setShowBackup] = useState(false)
  const [viewMode, setViewMode] = useState<'default' | 'minimal' | 'focus'>('default')
  const [focusHabitId, setFocusHabitId] = useState<string | null>(null)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const isMobile = useIsMobile()
  
  // Filter out archived habits for main view, apply filters, and sort by order
  const activeHabits = habits
    .filter(habit => !habit.archived)
    .filter(habit => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = habit.name.toLowerCase().includes(query)
        const matchesDescription = habit.description?.toLowerCase().includes(query)
        const matchesCategory = habit.category?.toLowerCase().includes(query)
        const matchesTags = habit.tags?.some(tag => tag.toLowerCase().includes(query))
        if (!matchesName && !matchesDescription && !matchesCategory && !matchesTags) {
          return false
        }
      }
      // Category filter
      if (selectedCategory !== null && habit.category !== selectedCategory) {
        return false
      }
      // Tag filter
      if (selectedTags.length > 0) {
        const habitTags = habit.tags || []
        return selectedTags.every(tag => habitTags.includes(tag))
      }
      return true
    })
    .sort((a, b) => {
      const orderA = a.order ?? new Date(a.createdAt).getTime()
      const orderB = b.order ?? new Date(b.createdAt).getTime()
      return orderA - orderB
    })
  const archivedHabits = habits.filter(habit => habit.archived)
  const swipeStartX = useRef<number | null>(null)
  const swipeStartY = useRef<number | null>(null)
  const swipeThreshold = 50

  // Validate and fix data on startup
  useEffect(() => {
    const validation = validateStartupData(rawHabits, rawEntries)
    if (!validation.isValid) {
      toast({
        title: 'Data integrity issue',
        description: 'Some data was invalid and has been fixed. Please review your habits.',
        variant: 'destructive',
      })
    }
    setHabits(validation.fixedHabits)
    setEntries(validation.fixedEntries)
    
    // Update raw storage if data was fixed
    if (!validation.isValid) {
      setRawHabits(validation.fixedHabits)
      setRawEntries(validation.fixedEntries)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Check for share link in URL and import habits
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const shareId = urlParams.get('share')
    
    if (shareId && window.location.hash === '#import') {
      const importedHabits = parseShareLink(shareId)
      if (importedHabits && importedHabits.length > 0) {
        if (confirm(`Import ${importedHabits.length} habit(s) from share link?`)) {
          setHabits(prev => [...prev, ...importedHabits])
          toast({
            title: 'Habits imported',
            description: `Successfully imported ${importedHabits.length} habit(s) from share link.`,
          })
          // Clean up URL
          urlParams.delete('share')
          window.history.replaceState({}, '', window.location.pathname)
        }
      }
    }
  }, [setHabits, toast])

  // Sync habits and entries changes back to raw storage
  useEffect(() => {
    setRawHabits(habits)
  }, [habits, setRawHabits])

  useEffect(() => {
    setRawEntries(entries)
  }, [entries, setRawEntries])

  // Schedule reminders when habits change
  useEffect(() => {
    reminderManager.scheduleReminders(habits)
    return () => {
      reminderManager.clearAllReminders()
    }
  }, [habits])

  // Auto-backup setup
  useEffect(() => {
    startAutoBackup(
      () => habits,
      () => entries,
      24 * 60 * 60 * 1000 // 24 hours
    )
    return () => {
      stopAutoBackup()
    }
  }, [habits, entries])

  const { getTotalCompletionRate, streakMap, completionMap, getStreak, getCompletionRate, getGoalProgress } =
    useHabitStats(activeHabits, entries, currentWeekStart)

  const handleAddHabit = useCallback(
    (habitData: Omit<Habit, 'id' | 'createdAt' | 'order'>) => {
      const newHabit: Habit = {
        ...habitData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        order: Date.now(), // Use timestamp as default order
        reminderEnabled: habitData.reminderEnabled ?? false,
        reminders: habitData.reminders ?? [],
      }
      setHabits((prev) => [...prev, newHabit])
      HabitHistoryManager.recordAction(newHabit.id, 'created', undefined, newHabit)
      
      // Request notification permission if reminder is enabled
      if (newHabit.reminderEnabled && newHabit.reminders && newHabit.reminders.length > 0) {
        reminderManager.requestPermission().then(granted => {
          if (!granted) {
            toast({
              title: 'Notification permission required',
              description: 'Please enable notifications in your browser settings to receive reminders.',
              variant: 'destructive',
            })
          }
        })
      }
    },
    [setHabits, toast]
  )

  const handleSetHabitStatus = useCallback(
    (habitId: string, date: Date, status: 'done' | 'skip' | null) => {
      const dateStr = getUtcKeyForLocalDay(date)
      const habit = habits.find(h => h.id === habitId)
      const habitName = habit?.name || 'Unknown'

      setEntries((prev) => {
        const newEntries = { ...prev }
        if (!newEntries[dateStr]) newEntries[dateStr] = {}

        if (status === null) {
          delete newEntries[dateStr][habitId]
          if (Object.keys(newEntries[dateStr]).length === 0) {
            delete newEntries[dateStr]
          }
        } else {
          newEntries[dateStr][habitId] = status
          if (status === 'done') {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 1000)
          }
        }

        // Execute automation and gamification after state update
        if (status !== null) {
          const streak = streakMap.get(habitId) ?? 0
          executeAutomation(habitId, habitName, dateStr, status, streak).catch(
            error => console.error('Error executing automation:', error)
          )
          
          // Add gamification progress
          if (status === 'done') {
            const { unlockedBadges, levelUp } = addProgress(habitId, newEntries, dateStr, habits)
            if (unlockedBadges.length > 0) {
              toast({
                title: 'Badge Unlocked!',
                description: `You've unlocked ${unlockedBadges.length} badge(s)!`,
              })
            }
            if (levelUp) {
              const updatedProgress = getUserProgress()
              toast({
                title: 'Level Up!',
                description: `Congratulations! You've reached level ${updatedProgress.level}!`,
              })
            }
          }
        }

        return newEntries
      })
    },
    [setEntries, habits, streakMap]
  )

  // Backward compatibility: keep handleToggleHabit for Space key behavior
  const handleToggleHabit = useCallback(
    (habitId: string, date: Date) => {
      const dateStr = getUtcKeyForLocalDay(date)
      const currentStatus = entries[dateStr]?.[habitId]
      
      if (currentStatus === 'done') {
        handleSetHabitStatus(habitId, date, null)
      } else {
        handleSetHabitStatus(habitId, date, 'done')
      }
    },
    [entries, handleSetHabitStatus]
  )

  const handleNavigateWeek = useCallback((direction: 'prev' | 'next') => {
    setCurrentWeekStart((prev) => {
      const newStart = new Date(prev)
      newStart.setUTCDate(prev.getUTCDate() + (direction === 'next' ? 7 : -7))
      return newStart
    })
  }, [])

  const handleGoToToday = useCallback(() => {
    setCurrentWeekStart(getUtcWeekStart(new Date()))
  }, [])

  const handleImport = useCallback((importedHabits: Habit[], importedEntries: HabitEntry) => {
    if (confirm('Overwrite existing data?')) {
      setHabits(importedHabits)
      setEntries(importedEntries)
    }
  }, [setHabits, setEntries])

  const handleEditHabit = useCallback((habit: Habit) => {
    setEditingHabit(habit)
    setIsDialogOpen(true)
  }, [])

  const handleSaveEdit = useCallback(
    (habitId: string, habitData: Omit<Habit, 'id' | 'createdAt'>) => {
      setHabits((prev) => {
        const oldHabit = prev.find(h => h.id === habitId)
        const newHabit = oldHabit ? { ...oldHabit, ...habitData } : null
        if (oldHabit && newHabit) {
          HabitHistoryManager.recordAction(habitId, 'updated', oldHabit, newHabit)
        }
        return prev.map((h) =>
          h.id === habitId
            ? { ...h, ...habitData }
            : h
        )
      })
      setEditingHabit(null)
      setIsDialogOpen(false)
    },
    [setHabits]
  )

  const handleArchiveHabit = useCallback(
    (habitId: string) => {
      setHabits(prev => {
        const habit = prev.find(h => h.id === habitId)
        if (habit) {
          HabitHistoryManager.recordAction(habitId, 'archived', habit, { ...habit, archived: true })
        }
        return prev.map(h => h.id === habitId ? { ...h, archived: true } : h)
      })
      toast({
        title: 'Habit archived',
        description: 'The habit has been archived. You can restore it from the archive view.',
      })
    },
    [toast]
  )

  const handleReorderHabits = useCallback(
    (habitId: string, newIndex: number) => {
      setHabits(prev => {
        const habitsList = [...prev]
        const habitIndex = habitsList.findIndex(h => h.id === habitId)
        if (habitIndex === -1) return prev
        
        const [movedHabit] = habitsList.splice(habitIndex, 1)
        habitsList.splice(newIndex, 0, movedHabit)
        
        // Update order values based on new positions
        return habitsList.map((habit, index) => ({
          ...habit,
          order: Date.now() + index, // Use timestamp + index to maintain order
        }))
      })
    },
    []
  )

  const handleDeleteHabit = useCallback((habitId: string) => {
    setDeletingHabitId(habitId)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deletingHabitId) {
      const habit = habits.find(h => h.id === deletingHabitId)
      if (habit) {
        HabitHistoryManager.recordAction(deletingHabitId, 'deleted', habit, undefined)
      }
      setHabits((prev) => prev.filter((h) => h.id !== deletingHabitId))
      setEntries((prev) => {
        const newEntries = { ...prev }
        Object.keys(newEntries).forEach((date) => {
          if (newEntries[date][deletingHabitId]) {
            delete newEntries[date][deletingHabitId]
            if (Object.keys(newEntries[date]).length === 0) {
              delete newEntries[date]
            }
          }
        })
        return newEntries
      })
      setDeletingHabitId(null)
    }
  }, [deletingHabitId, setHabits, setEntries])

  // Swipe gesture handlers for mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX
    swipeStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return

    const swipeEndX = e.changedTouches[0].clientX
    const swipeEndY = e.changedTouches[0].clientY
    const deltaX = swipeEndX - swipeStartX.current
    const deltaY = swipeEndY - swipeStartY.current

    // Only handle horizontal swipes (ignore if vertical swipe is larger)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        handleNavigateWeek('prev')
      } else {
        handleNavigateWeek('next')
      }
    }

    swipeStartX.current = null
    swipeStartY.current = null
  }, [handleNavigateWeek])

  useEffect(() => {
    if (isMobile) {
      window.addEventListener('touchstart', handleTouchStart, { passive: true })
      window.addEventListener('touchend', handleTouchEnd, { passive: true })
      return () => {
        window.removeEventListener('touchstart', handleTouchStart)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isMobile, handleTouchStart, handleTouchEnd])

  useEffect(() => {
    // Disable keyboard shortcuts on mobile
    if (isMobile) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'ArrowLeft' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handleNavigateWeek('prev')
      } else if (e.key === 'ArrowRight' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handleNavigateWeek('next')
      } else if (e.key === 't' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handleGoToToday()
      } else if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        // Keyboard shortcuts dialog will be opened by KeyboardShortcuts component
        const shortcutButton = document.querySelector('[aria-label="Show keyboard shortcuts"]') as HTMLButtonElement
        if (shortcutButton) {
          shortcutButton.click()
        }
      } else if (habits.length > 0 && handleSetHabitStatus) {
        const today = new Date()
        const firstHabit = habits[0]
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        
        if (e.key === ' ' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          handleToggleHabit(firstHabit.id, todayDate)
        } else if (e.key === 's' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          const dateStr = getUtcKeyForLocalDay(todayDate)
          const currentStatus = entries[dateStr]?.[firstHabit.id]
          if (currentStatus === 'skip') {
            handleSetHabitStatus(firstHabit.id, todayDate, null)
          } else {
            handleSetHabitStatus(firstHabit.id, todayDate, 'skip')
          }
        } else if (e.key === 'r' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          handleSetHabitStatus(firstHabit.id, todayDate, null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobile, handleNavigateWeek, handleGoToToday, habits, entries, handleSetHabitStatus, handleToggleHabit])

  return (
    <>
      <Toaster />
      <AchievementNotification
        achievement={currentAchievement}
        onClose={() => setCurrentAchievement(null)}
      />
      <OfflineIndicator />
      <div className="min-h-screen bg-white dark:bg-zinc-900 transition-colors duration-200">
        <Confetti show={showConfetti} />

      <header className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-40 transition-colors duration-200" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1D1D1F] dark:text-zinc-50 tracking-tight transition-colors duration-200">
                HabitGrid
              </h1>
              <p className="mt-1 sm:mt-2 text-base sm:text-lg lg:text-xl text-gray-600 dark:text-zinc-400 transition-colors duration-200" role="doc-subtitle">
                Build momentum. One check at a time.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1">
                <ExportImport habits={habits} entries={entries} onImport={handleImport} />
                {activeHabits.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowStats(!showStats)}
                      className="px-4 py-2.5 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 active:bg-gray-100 dark:active:bg-zinc-700 text-gray-700 dark:text-zinc-300 touch-manipulation min-h-[44px] transition-colors duration-200"
                    >
                      {showStats ? 'Close Stats' : 'View Stats'}
                    </button>
                    {!isMobile && (
                      <>
                        <button
                          onClick={() => setViewMode(viewMode === 'minimal' ? 'default' : 'minimal')}
                          className="px-4 py-2.5 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 active:bg-gray-100 dark:active:bg-zinc-700 text-gray-700 dark:text-zinc-300 touch-manipulation min-h-[44px] transition-colors duration-200"
                        >
                          {viewMode === 'minimal' ? 'Normal View' : 'Minimal View'}
                        </button>
                        <button
                          onClick={() => setViewMode(viewMode === 'group' ? 'default' : 'group')}
                          className="px-4 py-2.5 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 active:bg-gray-100 dark:active:bg-zinc-700 text-gray-700 dark:text-zinc-300 touch-manipulation min-h-[44px] transition-colors duration-200"
                        >
                          {viewMode === 'group' ? 'Normal View' : 'Group View'}
                        </button>
                      </>
                    )}
                  </>
                )}
                {archivedHabits.length > 0 && (
                  <button
                    onClick={() => setShowArchive(!showArchive)}
                    className="px-4 py-2.5 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 active:bg-gray-100 dark:active:bg-zinc-700 text-gray-700 dark:text-zinc-300 touch-manipulation min-h-[44px] transition-colors duration-200"
                    aria-label={`${showArchive ? 'Hide' : 'Show'} archived habits (${archivedHabits.length})`}
                  >
                    {showArchive ? 'Hide Archive' : `Archive (${archivedHabits.length})`}
                  </button>
                )}
                <ThemeToggle />
                <LanguageSelector />
                {!isMobile && <KeyboardShortcuts />}
                <button
                  onClick={() => setShowIntegrations(true)}
                  className="px-4 py-2.5 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 active:bg-gray-100 dark:active:bg-zinc-700 text-gray-700 dark:text-zinc-300 touch-manipulation min-h-[44px] transition-colors duration-200"
                  aria-label="Integration settings"
                >
                  Integrations
                </button>
              </div>
              <HabitDialog
                onAddHabit={handleAddHabit}
                onEditHabit={handleSaveEdit}
                habit={editingHabit}
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  if (!open) setEditingHabit(null)
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        {showArchive ? (
          <ArchiveView
            habits={archivedHabits}
            entries={entries}
            streakMap={streakMap}
            completionMap={completionMap}
            onRestoreHabit={(habitId) => {
              setHabits(prev => prev.map(h => h.id === habitId ? { ...h, archived: false } : h))
              toast({
                title: 'Habit restored',
                description: 'The habit has been restored to your active habits.',
              })
            }}
            onDeleteHabit={(habitId) => {
              setDeletingHabitId(habitId)
            }}
            onBack={() => setShowArchive(false)}
          />
        ) : activeHabits.length === 0 && habits.filter(h => !h.archived).length === 0 ? (
          <EmptyState onAddHabit={() => setIsDialogOpen(true)} />
        ) : focusHabitId ? (
          (() => {
            const focusHabit = activeHabits.find(h => h.id === focusHabitId)
            if (!focusHabit) {
              setFocusHabitId(null)
              return <EmptyState onAddHabit={() => setIsDialogOpen(true)} />
            }
            return (
              <FocusMode
                habit={focusHabit}
                entries={entries}
                weekStart={currentWeekStart}
                streak={streakMap.get(focusHabitId) || 0}
                completionRate={completionMap.get(focusHabitId) || 0}
                onSetHabitStatus={handleSetHabitStatus}
                onBack={() => setFocusHabitId(null)}
              />
            )
          })()
        ) : viewMode === 'minimal' ? (
          <MinimalView
            habits={activeHabits.filter(h => 
              (!selectedCategory || h.category === selectedCategory) &&
              (selectedTags.length === 0 || selectedTags.every(tag => h.tags?.includes(tag))) &&
              (!searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()))
            )}
            entries={entries}
            weekStart={currentWeekStart}
            onSetHabitStatus={handleSetHabitStatus}
          />
        ) : showSplitView ? (
          <div className="h-[calc(100vh-200px)]">
            <SplitView
              habits={activeHabits}
              entries={entries}
              leftPanel={
                <div>
                  <WeekNavigation
                    weekStart={currentWeekStart}
                    onNavigate={handleNavigateWeek}
                    onGoToToday={handleGoToToday}
                  />
                  <HabitGrid
                    habits={activeHabits.filter(h => 
                      (!selectedCategory || h.category === selectedCategory) &&
                      (selectedTags.length === 0 || selectedTags.every(tag => h.tags?.includes(tag))) &&
                      (!searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    )}
                    entries={entries}
                    weekStart={currentWeekStart}
                    streakMap={streakMap}
                    completionMap={completionMap}
                    onToggleHabit={handleToggleHabit}
                    onSetHabitStatus={handleSetHabitStatus}
                    onEditHabit={handleEditHabit}
                    onDeleteHabit={(id) => setDeletingHabitId(id)}
                    onArchiveHabit={handleArchiveHabit}
                  />
                </div>
              }
              rightPanel={
                <Suspense fallback={
                  <div className="flex items-center justify-center p-8">
                    <Spinner className="w-8 h-8" />
                  </div>
                }>
                  <StatsPanel habits={activeHabits} entries={entries} onUpdateHabits={setHabits} />
                </Suspense>
              }
              onClose={() => setShowSplitView(false)}
            />
          </div>
        ) : (
          <>
            <FilterBar
              habits={habits.filter(h => !h.archived)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              selectedTags={selectedTags}
              onCategoryChange={setSelectedCategory}
              onTagToggle={(tag) => {
                setSelectedTags(prev =>
                  prev.includes(tag)
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                )
              }}
              onClearFilters={() => {
                setSelectedCategory(null)
                setSelectedTags([])
              }}
            />
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <WeekNavigation
                weekStart={currentWeekStart}
                onNavigate={handleNavigateWeek}
                onGoToToday={handleGoToToday}
              />

              <div className="flex items-center gap-6 bg-gray-50 dark:bg-zinc-800 rounded-2xl px-6 py-4 transition-colors duration-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#34C759]" />
                  <span className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-200">Completion</span>
                  <span className="text-xl font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">
                    {getTotalCompletionRate()}%
                  </span>
                </div>
              </div>
            </div>

            {isMobile ? (
              <HabitGridMobile
                habits={activeHabits}
                entries={entries}
                weekStart={currentWeekStart}
                streakMap={streakMap}
                completionMap={completionMap}
                onToggleHabit={handleToggleHabit}
                onSetHabitStatus={handleSetHabitStatus}
                onEditHabit={handleEditHabit}
                onDeleteHabit={handleDeleteHabit}
                onArchiveHabit={handleArchiveHabit}
              />
            ) : (
              <HabitGrid
                habits={activeHabits}
                entries={entries}
                weekStart={currentWeekStart}
                streakMap={streakMap}
                completionMap={completionMap}
                onToggleHabit={handleToggleHabit}
                onSetHabitStatus={handleSetHabitStatus}
                onEditHabit={handleEditHabit}
                onDeleteHabit={handleDeleteHabit}
                onArchiveHabit={handleArchiveHabit}
                onReorderHabits={handleReorderHabits}
              />
            )}

              {!isMobile && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeHabits.slice(0, 3).map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    streak={getStreak(habit.id)}
                    completionRate={getCompletionRate(habit.id)}
                    goalProgress={getGoalProgress(habit.id)}
                    onEditHabit={handleEditHabit}
                    onDeleteHabit={handleDeleteHabit}
                  />
                ))}
              </div>
            )}

            {showStats && (
              <div className={`mt-8 animate-fade-in ${isMobile ? 'fixed inset-0 bg-white dark:bg-zinc-900 z-50 overflow-y-auto p-4 transition-colors duration-200' : ''}`}>
                {isMobile && (
                  <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-zinc-900 pb-4 border-b border-gray-200 dark:border-zinc-800 transition-colors duration-200">
                    <h2 className="text-2xl font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">Statistics</h2>
                    <button
                      onClick={() => setShowStats(false)}
                      className="px-4 py-2 text-sm border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 active:bg-gray-100 dark:active:bg-zinc-700 text-gray-700 dark:text-zinc-300 touch-manipulation min-h-[44px] transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                )}
                <Suspense fallback={
                  <div className="flex items-center justify-center p-8">
                    <Spinner className="w-8 h-8" />
                  </div>
                }>
                  <StatsPanel habits={activeHabits} entries={entries} onUpdateHabits={setHabits} />
                </Suspense>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-gray-200 dark:border-zinc-800 mt-16 py-8 transition-colors duration-200" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-zinc-400 transition-colors duration-200">
            HabitGrid v2.0 · Built with Apple UX principles
          </p>
        </div>
      </footer>

      <AlertDialog open={deletingHabitId !== null} onOpenChange={(open) => !open && setDeletingHabitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete habit?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The habit and its records will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showIntegrations} onOpenChange={setShowIntegrations}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Integration Settings</DialogTitle>
          </DialogHeader>
          <IntegrationSettings habits={habits} />
        </DialogContent>
      </Dialog>

      <TemplateDialog
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onSelectTemplate={(template) => {
          handleAddHabit({
            name: template.name,
            emoji: template.emoji,
            color: template.color,
            category: template.category,
            tags: template.tags,
            description: template.description,
            goalType: template.goalType || 'daily',
            goalValue: template.goalValue,
            goalDays: template.goalDays,
            reminderEnabled: template.reminderEnabled || false,
            reminders: template.reminders || [],
          })
          toast({
            title: 'Habit created',
            description: `"${template.name}" has been added from template.`,
          })
        }}
      />

      <Dialog open={showBackup} onOpenChange={setShowBackup}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Backup Management</DialogTitle>
          </DialogHeader>
          <BackupView
            habits={habits}
            entries={entries}
            onRestore={(restoredHabits, restoredEntries) => {
              setHabits(restoredHabits)
              setEntries(restoredEntries)
              setShowBackup(false)
            }}
            onPartialRestore={(restoredHabits, restoredEntries) => {
              if (restoredHabits) {
                setHabits(restoredHabits)
              }
              if (restoredEntries) {
                setEntries(restoredEntries)
              }
            }}
          />
        </DialogContent>
      </Dialog>
      </div>
    </>
  )
}

function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}

export default AppWithErrorBoundary
