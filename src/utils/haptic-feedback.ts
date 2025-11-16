// Haptic feedback utilities
// Note: Vibration API is only available on mobile devices and requires user interaction

export function triggerHapticFeedback(pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'medium') {
  if (!('vibrate' in navigator)) {
    return // Not supported
  }

  const patterns: number[] = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    error: [20, 50, 20, 50, 20],
  }

  try {
    navigator.vibrate(patterns[pattern])
  } catch (error) {
    console.error('Error triggering haptic feedback:', error)
  }
}

export function triggerHapticPattern(pattern: number[]) {
  if (!('vibrate' in navigator)) {
    return // Not supported
  }

  try {
    navigator.vibrate(pattern)
  } catch (error) {
    console.error('Error triggering haptic pattern:', error)
  }
}

