import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onAddHabit: () => void
}

export function EmptyState({ onAddHabit }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-zinc-800 mb-6 transition-colors duration-200">
        <Sparkles className="w-10 h-10 text-gray-400 dark:text-zinc-500 transition-colors duration-200" />
      </div>
      <h2 className="text-3xl font-semibold text-[#1D1D1F] dark:text-zinc-50 mb-3 transition-colors duration-200">Start Your Journey</h2>
      <p className="text-xl text-gray-600 dark:text-zinc-400 mb-8 max-w-md mx-auto transition-colors duration-200">
        Create your first habit to begin tracking your progress and building momentum.
      </p>
      <Button
        onClick={onAddHabit}
        className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-8 py-6 text-lg font-medium transition-all duration-300 hover:scale-105"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create First Habit
      </Button>
    </div>
  )
}

