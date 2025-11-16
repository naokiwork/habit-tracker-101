import { useEffect, useState } from 'react'
import { Sparkles, Trophy } from 'lucide-react'
import type { Achievement } from '@/hooks/use-achievement-detector'

interface AchievementAnimationProps {
  achievement: Achievement
  onComplete?: () => void
}

export function AchievementAnimation({ achievement, onComplete }: AchievementAnimationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onComplete?.(), 300)
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-in zoom-in-95 fade-in duration-300">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-3xl p-8 shadow-2xl text-center">
          <div className="text-6xl mb-4 animate-bounce">
            {achievement.emoji}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {achievement.message}
          </h2>
          <div className="flex justify-center gap-2 mt-4">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            <Trophy className="w-5 h-5 text-white animate-pulse" />
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

