import type { Habit, HabitEntry } from '@/types/habit'

export interface Backup {
  id: string
  timestamp: number
  habits: Habit[]
  entries: HabitEntry
  metadata?: {
    habitCount: number
    entryCount: number
    version?: string
  }
}

const BACKUP_STORAGE_KEY = 'habitgrid_backups'
const MAX_BACKUPS = 10 // Keep last 10 backups

export class BackupManager {
  private static getBackups(): Backup[] {
    try {
      const stored = localStorage.getItem(BACKUP_STORAGE_KEY)
      if (!stored) return []
      return JSON.parse(stored) as Backup[]
    } catch {
      return []
    }
  }

  private static saveBackups(backups: Backup[]): void {
    try {
      // Keep only the last MAX_BACKUPS
      const trimmed = backups.slice(-MAX_BACKUPS)
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(trimmed))
    } catch (error) {
      console.error('Failed to save backups:', error)
      throw new Error('Failed to save backup. Storage may be full.')
    }
  }

  static createBackup(habits: Habit[], entries: HabitEntry): Backup {
    const backup: Backup = {
      id: `backup_${Date.now()}`,
      timestamp: Date.now(),
      habits: JSON.parse(JSON.stringify(habits)), // Deep copy
      entries: JSON.parse(JSON.stringify(entries)), // Deep copy
      metadata: {
        habitCount: habits.length,
        entryCount: Object.keys(entries).length,
        version: '1.0',
      },
    }

    const backups = this.getBackups()
    backups.push(backup)
    this.saveBackups(backups)

    return backup
  }

  static getAllBackups(): Backup[] {
    return this.getBackups().sort((a, b) => b.timestamp - a.timestamp)
  }

  static getBackup(id: string): Backup | null {
    const backups = this.getBackups()
    return backups.find(b => b.id === id) || null
  }

  static deleteBackup(id: string): boolean {
    const backups = this.getBackups()
    const filtered = backups.filter(b => b.id !== id)
    if (filtered.length === backups.length) return false

    this.saveBackups(filtered)
    return true
  }

  static restoreBackup(id: string): { habits: Habit[]; entries: HabitEntry } | null {
    const backup = this.getBackup(id)
    if (!backup) return null

    return {
      habits: JSON.parse(JSON.stringify(backup.habits)),
      entries: JSON.parse(JSON.stringify(backup.entries)),
    }
  }

  static restorePartial(
    id: string,
    options: { habits?: boolean; entries?: boolean }
  ): { habits?: Habit[]; entries?: HabitEntry } | null {
    const backup = this.getBackup(id)
    if (!backup) return null

    const result: { habits?: Habit[]; entries?: HabitEntry } = {}
    if (options.habits) {
      result.habits = JSON.parse(JSON.stringify(backup.habits))
    }
    if (options.entries) {
      result.entries = JSON.parse(JSON.stringify(backup.entries))
    }

    return result
  }

  static clearAllBackups(): void {
    localStorage.removeItem(BACKUP_STORAGE_KEY)
  }

  static getBackupStats(): { total: number; oldest: number | null; newest: number | null } {
    const backups = this.getBackups()
    if (backups.length === 0) {
      return { total: 0, oldest: null, newest: null }
    }

    const timestamps = backups.map(b => b.timestamp)
    return {
      total: backups.length,
      oldest: Math.min(...timestamps),
      newest: Math.max(...timestamps),
    }
  }
}

// Auto-backup scheduler
let autoBackupInterval: number | null = null

export function startAutoBackup(
  getHabits: () => Habit[],
  getEntries: () => HabitEntry,
  intervalMs: number = 24 * 60 * 60 * 1000 // Default: 24 hours
): void {
  stopAutoBackup()

  // Create initial backup
  BackupManager.createBackup(getHabits(), getEntries())

  // Schedule periodic backups
  autoBackupInterval = window.setInterval(() => {
    BackupManager.createBackup(getHabits(), getEntries())
  }, intervalMs)
}

export function stopAutoBackup(): void {
  if (autoBackupInterval !== null) {
    clearInterval(autoBackupInterval)
    autoBackupInterval = null
  }
}

