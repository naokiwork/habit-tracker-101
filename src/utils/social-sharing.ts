import type { Habit } from '@/types/habit'
import type { ShareLink } from '@/types/social'

// Generate shareable link for a habit
export function generateShareLink(habit: Habit): ShareLink {
  const shareId = btoa(JSON.stringify({
    habit: {
      id: habit.id,
      name: habit.name,
      emoji: habit.emoji,
      color: habit.color,
      goalType: habit.goalType,
      goalValue: habit.goalValue,
    },
    timestamp: Date.now(),
  })).replace(/[+/=]/g, (m) => {
    return { '+': '-', '/': '_', '=': '' }[m] || m
  })

  const url = new URL(window.location.href)
  url.searchParams.set('share', shareId)
  url.hash = 'import'

  return {
    url: url.toString(),
    shareId,
  }
}

// Generate shareable link for multiple habits
export function generateShareLinkForHabits(habits: Habit[]): ShareLink {
  const shareId = btoa(JSON.stringify({
    habits: habits.map(h => ({
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      goalType: h.goalType,
      goalValue: h.goalValue,
      goalDays: h.goalDays,
    })),
    timestamp: Date.now(),
  })).replace(/[+/=]/g, (m) => {
    return { '+': '-', '/': '_', '=': '' }[m] || m
  })

  const url = new URL(window.location.href)
  url.searchParams.set('share', shareId)
  url.hash = 'import'

  return {
    url: url.toString(),
    shareId,
  }
}

// Parse share link and extract habit data
export function parseShareLink(shareId: string): Habit[] | null {
  try {
    const decoded = atob(shareId.replace(/[-_]/g, (m) => {
      return { '-': '+', '_': '/' }[m] || m
    }))
    const data = JSON.parse(decoded)
    
    if (data.habit) {
      // Single habit
      return [{
        id: Date.now().toString(),
        name: data.habit.name,
        emoji: data.habit.emoji,
        color: data.habit.color,
        createdAt: new Date().toISOString(),
        goalType: data.habit.goalType,
        goalValue: data.habit.goalValue,
      }]
    } else if (data.habits && Array.isArray(data.habits)) {
      // Multiple habits
      return data.habits.map((h: Partial<Habit>, index: number) => ({
        id: (Date.now() + index).toString(),
        name: h.name || 'Untitled Habit',
        emoji: h.emoji || '💪',
        color: h.color || '#0071E3',
        createdAt: new Date().toISOString(),
        goalType: h.goalType,
        goalValue: h.goalValue,
        goalDays: h.goalDays,
      }))
    }
    return null
  } catch (error) {
    console.error('Error parsing share link:', error)
    return null
  }
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      document.body.removeChild(textArea)
      return false
    }
  }
}

// Generate QR code data URL (simple implementation)
// For production, consider using a library like 'qrcode' or 'qrcode.react'
export function generateQRCodeDataURL(text: string): string {
  // This is a placeholder - in production, use a proper QR code library
  // For now, return a data URL that can be used with an external QR code service
  const encodedText = encodeURIComponent(text)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`
}

