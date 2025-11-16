import { useState } from 'react'
import { Download, Upload, Trash2, Eye, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { BackupManager, type Backup } from '@/utils/backup-manager'
import type { Habit, HabitEntry } from '@/types/habit'
import { useToast } from '@/hooks/use-toast'

interface BackupViewProps {
  habits: Habit[]
  entries: HabitEntry
  onRestore: (habits: Habit[], entries: HabitEntry) => void
  onPartialRestore?: (habits?: Habit[], entries?: HabitEntry) => void
}

export function BackupView({ habits, entries, onRestore, onPartialRestore }: BackupViewProps) {
  const { toast } = useToast()
  const [backups, setBackups] = useState<Backup[]>(BackupManager.getAllBackups())
  const [previewBackup, setPreviewBackup] = useState<Backup | null>(null)
  const [restoreDialog, setRestoreDialog] = useState<{ open: boolean; backup: Backup | null }>({
    open: false,
    backup: null,
  })

  const handleCreateBackup = () => {
    const backup = BackupManager.createBackup(habits, entries)
    setBackups(BackupManager.getAllBackups())
    toast({
      title: 'Backup created',
      description: `Backup created at ${new Date(backup.timestamp).toLocaleString()}`,
    })
  }

  const handleDeleteBackup = (id: string) => {
    if (confirm('Are you sure you want to delete this backup?')) {
      BackupManager.deleteBackup(id)
      setBackups(BackupManager.getAllBackups())
      toast({
        title: 'Backup deleted',
        description: 'The backup has been permanently deleted.',
      })
    }
  }

  const handlePreview = (backup: Backup) => {
    setPreviewBackup(backup)
  }

  const handleRestore = (backup: Backup, partial?: { habits?: boolean; entries?: boolean }) => {
    if (partial) {
      const restored = BackupManager.restorePartial(backup.id, partial)
      if (restored && onPartialRestore) {
        onPartialRestore(restored.habits, restored.entries)
        toast({
          title: 'Partial restore completed',
          description: 'Selected data has been restored.',
        })
      }
    } else {
      const restored = BackupManager.restoreBackup(backup.id)
      if (restored) {
        onRestore(restored.habits, restored.entries)
        toast({
          title: 'Restore completed',
          description: 'All data has been restored from backup.',
        })
      }
    }
    setRestoreDialog({ open: false, backup: null })
  }

  const handleExportBackup = (backup: Backup) => {
    const data = {
      habits: backup.habits,
      entries: backup.entries,
      metadata: backup.metadata,
      timestamp: backup.timestamp,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habitgrid-backup-${new Date(backup.timestamp).toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: 'Backup exported',
      description: 'Backup file has been downloaded.',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50">Backup Management</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Create and manage backups of your habits and entries
          </p>
        </div>
        <Button onClick={handleCreateBackup} className="gap-2">
          <Download className="w-4 h-4" />
          Create Backup
        </Button>
      </div>

      {backups.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg">
          <FileText className="w-12 h-12 mx-auto text-gray-400 dark:text-zinc-600 mb-4" />
          <p className="text-gray-500 dark:text-zinc-400">No backups available</p>
          <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">
            Create your first backup to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <Calendar className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#1D1D1F] dark:text-zinc-50">
                      {new Date(backup.timestamp).toLocaleString()}
                    </span>
                    {backup.metadata && (
                      <>
                        <Badge variant="outline" className="text-xs">
                          {backup.metadata.habitCount} habits
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {backup.metadata.entryCount} entries
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    {backup.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(backup)}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRestoreDialog({ open: true, backup })}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Restore
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportBackup(backup)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteBackup(backup.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewBackup !== null} onOpenChange={(open) => !open && setPreviewBackup(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Backup Preview</DialogTitle>
            <DialogDescription>
              {previewBackup && new Date(previewBackup.timestamp).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {previewBackup && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Habits ({previewBackup.habits.length})</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {previewBackup.habits.map((habit) => (
                    <div key={habit.id} className="flex items-center gap-2 text-sm">
                      <span>{habit.emoji}</span>
                      <span>{habit.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">
                  Entries ({Object.keys(previewBackup.entries).length} dates)
                </h4>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  Entry data is available for restoration
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog
        open={restoreDialog.open}
        onOpenChange={(open) => setRestoreDialog({ open, backup: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Backup</DialogTitle>
            <DialogDescription>
              Choose what to restore from this backup
            </DialogDescription>
          </DialogHeader>
          {restoreDialog.backup && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  Backup from: {new Date(restoreDialog.backup.timestamp).toLocaleString()}
                </p>
                {restoreDialog.backup.metadata && (
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                    {restoreDialog.backup.metadata.habitCount} habits,{' '}
                    {restoreDialog.backup.metadata.entryCount} entries
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => handleRestore(restoreDialog.backup!)}
                  className="w-full gap-2"
                  variant="default"
                >
                  <Upload className="w-4 h-4" />
                  Restore All
                </Button>
                {onPartialRestore && (
                  <>
                    <Button
                      onClick={() => handleRestore(restoreDialog.backup!, { habits: true })}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      Restore Habits Only
                    </Button>
                    <Button
                      onClick={() => handleRestore(restoreDialog.backup!, { entries: true })}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      Restore Entries Only
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Warning: Restoring will replace your current data. Make sure to create a backup first.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

