import { z } from 'zod'

export const habitSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Habit name is required').max(100, 'Habit name is too long'),
  emoji: z.string().min(1, 'Emoji is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  createdAt: z.string().datetime(),
  goalType: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  goalValue: z.number().int().positive().optional(),
  goalDays: z.array(z.number().int().min(0).max(6)).optional(),
  archived: z.boolean().optional(),
  order: z.number().optional(),
  reminders: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')).optional(),
  reminderEnabled: z.boolean().optional(),
  category: z.string().max(50, 'Category name is too long').optional(),
  tags: z.array(z.string().max(30, 'Tag name is too long')).optional(),
  description: z.string().max(500, 'Description is too long').optional(),
})

export const habitEntrySchema = z.record(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  z.record(
    z.string(),
    z.enum(['done', 'skip'], {
      message: 'Status must be "done" or "skip"',
    })
  )
)

export const exportDataSchema = z.object({
  habits: z.array(habitSchema),
  entries: habitEntrySchema,
})

export type ValidatedHabit = z.infer<typeof habitSchema>
export type ValidatedHabitEntry = z.infer<typeof habitEntrySchema>
export type ValidatedExportData = z.infer<typeof exportDataSchema>

