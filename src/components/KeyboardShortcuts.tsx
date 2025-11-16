import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const shortcuts = [
  { key: 'Space', description: 'Toggle habit completion for first habit today' },
  { key: 'S', description: 'Toggle skip status for first habit today' },
  { key: 'R', description: 'Reset status for first habit today' },
  { key: '←', description: 'Navigate to previous week' },
  { key: '→', description: 'Navigate to next week' },
  { key: 'T', description: 'Go to current week' },
  { key: '?', description: 'Show keyboard shortcuts (this dialog)' },
]

export function KeyboardShortcuts() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0"
          aria-label="Show keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with HabitGrid.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg"
            >
              <span className="text-sm text-gray-700 dark:text-zinc-300">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-4">
          Note: Keyboard shortcuts are disabled on mobile devices.
        </p>
      </DialogContent>
    </Dialog>
  )
}

