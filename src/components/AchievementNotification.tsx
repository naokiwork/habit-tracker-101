import { useEffect, useState } from 'react'
import { X, Trophy, Target, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Achievement } from '@/utils/achievement-detector'

interface AchievementNotificationProps {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for animation
      }, 5000) // Show for 5 seconds
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])

  if (!achievement || !isVisible) return null

  const getIcon = () => {
    switch (achievement.type) {
      case 'streak':
        return <Flame className="w-6 h-6 text-orange-500" />
      case 'goal':
        return <Target className="w-6 h-6 text-green-500" />
      case 'milestone':
        return <Trophy className="w-6 h-6 text-yellow-500" />
      default:
        return <Trophy className="w-6 h-6" />
    }
  }

  const getBgColor = () => {
    switch (achievement.type) {
      case 'streak':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      case 'goal':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'milestone':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-xl border-2 shadow-lg animate-slide-in-right ${getBgColor()} transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#1D1D1F] dark:text-zinc-50 mb-1">
            {achievement.habitName}
          </h4>
          <p className="text-sm text-gray-700 dark:text-zinc-300">{achievement.message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="h-6 w-6 p-0 flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

