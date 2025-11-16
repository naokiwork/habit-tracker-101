import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date helpers (UTC-based) to ensure storage/logic use stable day boundaries
export function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

// weekStart: 'sun' | 'mon'  (default: 'sun' to match current UI)
export function getUtcWeekStart(date: Date, weekStart: 'sun' | 'mon' = 'sun'): Date {
  const d = new Date(date)
  // normalize to UTC midnight to avoid local offsets affecting arithmetic
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay() // 0..6  (0=Sun)
  let diff: number
  if (weekStart === 'sun') {
    diff = day // days since Sunday
  } else {
    // Monday start: convert so Monday=0
    diff = (day + 6) % 7
  }
  const start = new Date(d)
  start.setUTCDate(d.getUTCDate() - diff)
  return start
}

export function getUtcWeekDates(weekStartDate: Date): Date[] {
  const dates: Date[] = []
  const start = new Date(weekStartDate)
  start.setUTCHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    dates.push(d)
  }
  return dates
}

/**
 * Get UTC date key (YYYY-MM-DD) for a local calendar day.
 * This ensures consistent key generation regardless of timezone.
 * @param date - Any Date object (UTC or local)
 * @returns UTC date key string for the local calendar day represented by the date
 */
export function getUtcKeyForLocalDay(date: Date): string {
  // Extract local calendar day components
  const localYear = date.getFullYear()
  const localMonth = date.getMonth()
  const localDay = date.getDate()
  // Create a Date object at local midnight for this calendar day
  const startOfLocalDay = new Date(localYear, localMonth, localDay)
  // Return UTC key for this local day
  return formatDateUTC(startOfLocalDay)
}
