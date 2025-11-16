import { useState, useEffect } from 'react'
import { Plus, X, Bell, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COLORS, EMOJIS } from '@/constants/habits'
import type { Habit, GoalType } from '@/types/habit'

interface HabitDialogProps {
  onAddHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void
  onEditHabit?: (habitId: string, habit: Omit<Habit, 'id' | 'createdAt'>) => void
  habit?: Habit | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function HabitDialog({ onAddHabit, onEditHabit, habit, open: controlledOpen, onOpenChange }: HabitDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen
  const isEditMode = !!habit

  const [name, setName] = useState(habit?.name || '')
  const [selectedEmoji, setSelectedEmoji] = useState(habit?.emoji || EMOJIS[0])
  const [selectedColor, setSelectedColor] = useState(habit?.color || COLORS[0])
  const [goalType, setGoalType] = useState<GoalType>(habit?.goalType || 'daily')
  const [goalValue, setGoalValue] = useState<string>(habit?.goalValue?.toString() || '1')
  const [goalDays, setGoalDays] = useState<number[]>(habit?.goalDays || [])
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(habit?.reminderEnabled || false)
  const [reminders, setReminders] = useState<string[]>(habit?.reminders || [])
  const [newReminderTime, setNewReminderTime] = useState<string>('09:00')
  const [description, setDescription] = useState<string>(habit?.description || '')

  useEffect(() => {
    if (habit && isOpen) {
      setName(habit.name)
      setSelectedEmoji(habit.emoji)
      setSelectedColor(habit.color)
      setGoalType(habit.goalType || 'daily')
      setGoalValue(habit.goalValue?.toString() || '1')
      setGoalDays(habit.goalDays || [])
      setReminderEnabled(habit.reminderEnabled || false)
      setReminders(habit.reminders || [])
      setDescription(habit.description || '')
    }
  }, [habit, isOpen])

  const handleSubmit = () => {
    if (!name.trim()) return

    const goalValueNum = goalType === 'daily' ? 1 : parseInt(goalValue) || 1
    const goalDaysArray = goalType === 'custom' ? goalDays : undefined

    if (isEditMode && habit && onEditHabit) {
      onEditHabit(habit.id, {
        name: name.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
        goalType,
        goalValue: goalValueNum,
        goalDays: goalDaysArray,
        reminderEnabled,
        reminders: reminderEnabled ? reminders : [],
        description: description.trim() || undefined,
      })
    } else {
      onAddHabit({
        name: name.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
        goalType,
        goalValue: goalValueNum,
        goalDays: goalDaysArray,
        reminderEnabled,
        reminders: reminderEnabled ? reminders : [],
        description: description.trim() || undefined,
      })
    }

    setName('')
    setSelectedEmoji(EMOJIS[0])
    setSelectedColor(COLORS[0])
    setGoalType('daily')
    setGoalValue('1')
    setGoalDays([])
    setReminderEnabled(false)
    setReminders([])
    setNewReminderTime('09:00')
    setDescription('')
    setCategory('')
    setTags([])
    setNewTag('')
    setIsOpen(false)
  }

  const addReminder = () => {
    if (newReminderTime && !reminders.includes(newReminderTime)) {
      setReminders([...reminders, newReminderTime].sort())
      setNewReminderTime('09:00')
    }
  }

  const removeReminder = (time: string) => {
    setReminders(reminders.filter(t => t !== time))
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && habit) {
      setName(habit.name)
      setSelectedEmoji(habit.emoji)
      setSelectedColor(habit.color)
      setGoalType(habit.goalType || 'daily')
      setGoalValue(habit.goalValue?.toString() || '1')
      setGoalDays(habit.goalDays || [])
      setReminderEnabled(habit.reminderEnabled || false)
      setReminders(habit.reminders || [])
      setDescription(habit.description || '')
    } else if (!open) {
      setName('')
      setSelectedEmoji(EMOJIS[0])
      setSelectedColor(COLORS[0])
      setGoalType('daily')
      setGoalValue('1')
      setGoalDays([])
      setReminderEnabled(false)
      setReminders([])
      setNewReminderTime('09:00')
      setDescription('')
    }
  }

  const toggleDay = (dayIndex: number) => {
    setGoalDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    )
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0066CC] text-white rounded-full px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg touch-manipulation min-h-[44px] w-full sm:w-auto"
          aria-label="Add new habit"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Add Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto transition-colors duration-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">
            {isEditMode ? 'Edit Habit' : 'Create New Habit'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="habit-name" className="text-base font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">
              Habit Name
            </Label>
            <Input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Run"
              className="text-base py-6 rounded-xl border-gray-300"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">
              Description (Optional)
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes or details about this habit..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#1D1D1F] dark:text-zinc-50 resize-none focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-colors duration-200"
            />
            {description.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {description.length}/500 characters
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">Choose Emoji</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl sm:text-3xl p-2.5 sm:p-3 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    selectedEmoji === emoji
                      ? 'bg-gray-100 ring-2 ring-[#0071E3]'
                      : 'hover:bg-gray-50 active:bg-gray-100'
                  }`}
                  aria-label={`Select ${emoji} emoji`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">Choose Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-[#1D1D1F] dark:ring-zinc-50' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">Goal Type</Label>
            <Select value={goalType} onValueChange={(value) => setGoalType(value as GoalType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily (Every day)</SelectItem>
                <SelectItem value="weekly">Weekly (N times per week)</SelectItem>
                <SelectItem value="monthly">Monthly (N times per month)</SelectItem>
                <SelectItem value="custom">Custom (Specific days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(goalType === 'weekly' || goalType === 'monthly') && (
            <div className="space-y-2">
              <Label htmlFor="goal-value" className="text-base font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">
                Target: {goalType === 'weekly' ? 'Times per week' : 'Times per month'}
              </Label>
              <Input
                id="goal-value"
                type="number"
                min="1"
                max={goalType === 'weekly' ? '7' : '31'}
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                className="text-base py-6 rounded-xl border-gray-300"
              />
            </div>
          )}

          {goalType === 'custom' && (
            <div className="space-y-2">
              <Label className="text-base font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200">Select Days</Label>
              <div className="flex flex-wrap gap-2">
                {dayNames.map((dayName, index) => (
                  <button
                    key={index}
                    onClick={() => toggleDay(index)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation min-h-[44px] ${
                      goalDays.includes(index)
                        ? 'bg-[#0071E3] text-white'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {dayName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Reminders
              </Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3]"
                />
                <span className="text-sm text-gray-700 dark:text-zinc-300">Enable</span>
              </label>
            </div>
            {reminderEnabled && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addReminder}
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {reminders.length > 0 && (
                  <div className="space-y-2">
                    {reminders.map((time) => (
                      <div key={time} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-zinc-300">{time}</span>
                        <Button
                          type="button"
                          onClick={() => removeReminder(time)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <Label className="text-base font-medium text-[#1D1D1F] dark:text-zinc-50 transition-colors duration-200 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category & Tags
            </Label>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm text-gray-600 dark:text-zinc-400">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Health, Work, Personal"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm text-gray-600 dark:text-zinc-400">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Add a tag"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-zinc-300">{tag}</span>
                        <Button
                          type="button"
                          onClick={() => removeTag(tag)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#0066CC] text-white rounded-xl py-4 sm:py-6 text-base font-medium transition-all duration-300 touch-manipulation min-h-[44px]"
            disabled={!name.trim()}
          >
            {isEditMode ? 'Save Changes' : 'Create Habit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

