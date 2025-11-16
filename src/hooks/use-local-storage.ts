import { useState, useEffect, useRef } from 'react'

interface UseLocalStorageOptions {
  onError?: (error: Error) => void
  validate?: (value: unknown) => boolean
  debounceMs?: number // Debounce delay in milliseconds
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions
) {
  const debounceMs = options?.debounceMs ?? 300
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingValueRef = useRef<T | null>(null)

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (!item) return initialValue

      const parsed = JSON.parse(item)
      
      // Validate if validator is provided
      if (options?.validate && !options.validate(parsed)) {
        console.warn(`Invalid data for localStorage key "${key}", using initial value`)
        return initialValue
      }

      return parsed
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(`Error reading localStorage key "${key}":`, err)
      options?.onError?.(err)
      
      // Try to clear corrupted data
      try {
        window.localStorage.removeItem(key)
      } catch (clearError) {
        console.error(`Error clearing localStorage key "${key}":`, clearError)
      }
      
      return initialValue
    }
  })

  const writeToStorage = (value: T) => {
    try {
      // Validate if validator is provided
      if (options?.validate && !options.validate(value)) {
        throw new Error(`Invalid data for localStorage key "${key}"`)
      }

      // Check storage quota
      const serialized = JSON.stringify(value)
      const size = new Blob([serialized]).size
      const quota = navigator.storage?.estimate?.() || Promise.resolve({ quota: 0, usage: 0 })
      
      quota.then((estimate) => {
        if (estimate.quota && size > estimate.quota * 0.9) {
          console.warn(`localStorage is nearly full (${Math.round((estimate.usage || 0) / estimate.quota * 100)}% used)`)
        }
      }).catch(() => {
        // Ignore quota estimation errors
      })

      window.localStorage.setItem(key, serialized)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(`Error setting localStorage key "${key}":`, err)
      options?.onError?.(err)
      
      // If it's a quota error, try to notify user
      if (err.name === 'QuotaExceededError' || err.message.includes('quota')) {
        console.error('localStorage quota exceeded. Consider exporting and clearing old data.')
      }
    }
  }

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value
    setStoredValue(valueToStore)
    pendingValueRef.current = valueToStore

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      if (pendingValueRef.current !== null) {
        writeToStorage(pendingValueRef.current)
        pendingValueRef.current = null
      }
    }, debounceMs)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      // Write pending value on unmount
      if (pendingValueRef.current !== null) {
        writeToStorage(pendingValueRef.current)
      }
    }
  }, [])

  return [storedValue, setValue] as const
}

