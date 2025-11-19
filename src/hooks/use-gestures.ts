import { useRef, useCallback } from 'react'

interface GestureState {
  startX: number
  startY: number
  startTime: number
  isLongPress: boolean
  longPressTimer: NodeJS.Timeout | null
}

export function useGestures() {
  const gestureState = useRef<GestureState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isLongPress: false,
    longPressTimer: null,
  })

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, onLongPress?: () => void) => {
      const touch = e.touches[0]
      gestureState.current.startX = touch.clientX
      gestureState.current.startY = touch.clientY
      gestureState.current.startTime = Date.now()
      gestureState.current.isLongPress = false

      if (onLongPress) {
        gestureState.current.longPressTimer = setTimeout(() => {
          gestureState.current.isLongPress = true
          onLongPress()
        }, 500) // 500ms for long press
      }
    },
    []
  )

  const handleTouchEnd = useCallback(
    (
      e: React.TouchEvent,
      onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void,
      onTap?: () => void,
      _onDoubleTap?: () => void
    ) => {
      if (gestureState.current.longPressTimer) {
        clearTimeout(gestureState.current.longPressTimer)
        gestureState.current.longPressTimer = null
      }

      if (gestureState.current.isLongPress) {
        return // Don't trigger other gestures if long press was triggered
      }

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - gestureState.current.startX
      const deltaY = touch.clientY - gestureState.current.startY
      const deltaTime = Date.now() - gestureState.current.startTime
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Swipe detection (minimum 50px movement, max 300ms)
      if (distance > 50 && deltaTime < 300) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (onSwipe) {
            onSwipe(deltaX > 0 ? 'right' : 'left')
          }
        } else {
          // Vertical swipe
          if (onSwipe) {
            onSwipe(deltaY > 0 ? 'down' : 'up')
          }
        }
        return
      }

      // Tap detection (less than 50px movement, less than 200ms)
      if (distance < 50 && deltaTime < 200) {
        if (onTap) {
          onTap()
        }
      }
    },
    []
  )

  const handleTouchMove = useCallback((_e: React.TouchEvent) => {
    // Cancel long press if user moves
    if (gestureState.current.longPressTimer) {
      clearTimeout(gestureState.current.longPressTimer)
      gestureState.current.longPressTimer = null
    }
  }, [])

  return {
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
  }
}

