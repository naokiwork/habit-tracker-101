import type { Habit, HabitEntry } from '@/types/habit'
import type { HabitChain, ChainEffect, ChainStats } from '@/types/chain'
import { getUtcKeyForLocalDay } from '@/lib/utils'

const STORAGE_KEY = 'habitgrid-chains'

export function getChains(): HabitChain[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading chains:', error)
    return []
  }
}

export function saveChains(chains: HabitChain[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chains))
  } catch (error) {
    console.error('Error saving chains:', error)
  }
}

export function createChain(chain: Omit<HabitChain, 'id' | 'createdAt'>): HabitChain {
  const chains = getChains()
  const newChain: HabitChain = {
    ...chain,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  chains.push(newChain)
  saveChains(chains)
  return newChain
}

export function updateChain(id: string, updates: Partial<HabitChain>): HabitChain | null {
  const chains = getChains()
  const index = chains.findIndex(c => c.id === id)
  if (index === -1) return null

  chains[index] = { ...chains[index], ...updates }
  saveChains(chains)
  return chains[index]
}

export function deleteChain(id: string): boolean {
  const chains = getChains()
  const filtered = chains.filter(c => c.id !== id)
  if (filtered.length === chains.length) return false

  saveChains(filtered)
  return true
}

// Analyze chain effects
export function analyzeChainEffects(
  habits: Habit[],
  entries: HabitEntry,
  days: number = 30
): ChainEffect[] {
  const effects: ChainEffect[] = []
  const today = new Date()
  const dateRange = Array.from({ length: days }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    return getUtcKeyForLocalDay(date)
  })

  habits.forEach((sourceHabit) => {
    habits.forEach((targetHabit) => {
      if (sourceHabit.id === targetHabit.id) return

      // Calculate correlation
      let sourceCompletions = 0
      let targetCompletions = 0
      let bothCompletions = 0
      let totalDays = 0

      dateRange.forEach((dateStr) => {
        const sourceDone = entries[dateStr]?.[sourceHabit.id] === 'done'
        const targetDone = entries[dateStr]?.[targetHabit.id] === 'done'

        if (sourceDone) sourceCompletions++
        if (targetDone) targetCompletions++
        if (sourceDone && targetDone) bothCompletions++
        totalDays++
      })

      if (sourceCompletions > 0 && targetCompletions > 0) {
        const correlation = (bothCompletions / totalDays) - 
          (sourceCompletions / totalDays) * (targetCompletions / totalDays)
        const strength = Math.abs(correlation)

        if (strength > 0.1) { // Only include meaningful correlations
          effects.push({
            sourceHabitId: sourceHabit.id,
            targetHabitId: targetHabit.id,
            correlation,
            strength,
          })
        }
      }
    })
  })

  return effects
}

// Calculate chain statistics
export function calculateChainStats(
  chain: HabitChain,
  _habits: Habit[],
  entries: HabitEntry,
  days: number = 30
): ChainStats {
  const today = new Date()
  const dateRange = Array.from({ length: days }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    return getUtcKeyForLocalDay(date)
  })

  let completedDays = 0
  const breakPoints: number[] = []

  dateRange.forEach((dateStr) => {
    let allCompleted = true
    let firstIncomplete = -1

    chain.habitIds.forEach((habitId, order) => {
      if (entries[dateStr]?.[habitId] !== 'done') {
        allCompleted = false
        if (firstIncomplete === -1) {
          firstIncomplete = order
        }
      }
    })

    if (allCompleted) {
      completedDays++
    } else if (firstIncomplete !== -1) {
      if (!breakPoints.includes(firstIncomplete)) {
        breakPoints.push(firstIncomplete)
      }
    }
  })

  const completionRate = (completedDays / days) * 100

  // Calculate average order (how far users typically get in the chain)
  let totalOrder = 0
  let orderCount = 0

  dateRange.forEach((dateStr) => {
    let maxOrder = -1
    chain.habitIds.forEach((habitId, order) => {
      if (entries[dateStr]?.[habitId] === 'done') {
        maxOrder = order
      }
    })
    if (maxOrder >= 0) {
      totalOrder += maxOrder
      orderCount++
    }
  })

  const averageOrder = orderCount > 0 ? totalOrder / orderCount : 0

  return {
    chainId: chain.id,
    completionRate,
    averageOrder,
    breakPoints,
  }
}

// Get habits in a chain
export function getChainHabits(chain: HabitChain, habits: Habit[]): Habit[] {
  return chain.habitIds
    .map(id => habits.find(h => h.id === id))
    .filter((h): h is Habit => h !== undefined)
    .sort((a, b) => {
      const orderA = chain.habitIds.indexOf(a.id)
      const orderB = chain.habitIds.indexOf(b.id)
      return orderA - orderB
    })
}

