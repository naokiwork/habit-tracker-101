import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg shadow-lg animate-slide-in-up"
      role="alert"
      aria-live="polite"
    >
      <WifiOff className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
        You're offline. Changes will be saved when you're back online.
      </span>
    </div>
  )
}

