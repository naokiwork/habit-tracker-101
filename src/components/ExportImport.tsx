import { Download, Upload, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToCSV } from '@/utils/export-csv'
import { useToast } from '@/hooks/use-toast'
import { exportDataSchema } from '@/types/habit-validation'
import type { Habit, HabitEntry } from '@/types/habit'

interface ExportImportProps {
  habits: Habit[]
  entries: HabitEntry
  onImport: (habits: Habit[], entries: HabitEntry) => void
}

export function ExportImport({ habits, entries, onImport }: ExportImportProps) {
  const { toast } = useToast()

  const handleExport = () => {
    try {
      const data = { habits, entries }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `habitgrid-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: 'Export successful',
        description: 'Your habits have been exported successfully.',
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export your habits. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const rawData = JSON.parse(event.target?.result as string)
          
          // Validate data with Zod schema
          const validationResult = exportDataSchema.safeParse(rawData)
          
          if (!validationResult.success) {
            const errors = validationResult.error.errors
            const errorMessages = errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n')
            toast({
              title: 'Invalid file format',
              description: `The file contains invalid data:\n${errorMessages}`,
              variant: 'destructive',
            })
            return
          }

          const validatedData = validationResult.data
          
          // Additional validation: check for empty arrays/objects
          if (!validatedData.habits || validatedData.habits.length === 0) {
            toast({
              title: 'Import warning',
              description: 'The file contains no habits. Nothing was imported.',
              variant: 'destructive',
            })
            return
          }

          onImport(validatedData.habits, validatedData.entries)
          toast({
            title: 'Import successful',
            description: `Successfully imported ${validatedData.habits.length} habit(s).`,
          })
        } catch (error) {
          toast({
            title: 'Import failed',
            description: error instanceof Error ? error.message : 'Failed to load file. Please check the file format.',
            variant: 'destructive',
          })
        }
      }
      reader.onerror = () => {
        toast({
          title: 'Import failed',
          description: 'Failed to read the file. Please try again.',
          variant: 'destructive',
        })
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleExportCSV = () => exportToCSV(habits, entries)

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleExport}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        JSON
      </Button>
      <Button
        onClick={handleExportCSV}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        CSV
      </Button>
      <Button
        onClick={handleImport}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        Import
      </Button>
    </div>
  )
}
