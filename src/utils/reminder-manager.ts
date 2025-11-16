import type { Habit } from '@/types/habit'

interface ScheduledReminder {
  habitId: string
  time: string
  timeoutId: NodeJS.Timeout
}

class ReminderManager {
  private scheduledReminders: Map<string, ScheduledReminder[]> = new Map()
  private notificationPermission: NotificationPermission = 'default'

  constructor() {
    this.checkNotificationPermission()
  }

  private async checkNotificationPermission() {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (this.notificationPermission === 'granted') {
      return true
    }

    if (this.notificationPermission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    this.notificationPermission = permission
    return permission === 'granted'
  }

  scheduleReminders(habits: Habit[]) {
    // Clear existing reminders
    this.clearAllReminders()

    // Schedule reminders for enabled habits
    habits.forEach(habit => {
      if (habit.reminderEnabled && habit.reminders && habit.reminders.length > 0) {
        this.scheduleHabitReminders(habit)
      }
    })
  }

  private scheduleHabitReminders(habit: Habit) {
    if (!habit.reminders || habit.reminders.length === 0) return

    const scheduled: ScheduledReminder[] = []

    habit.reminders.forEach(time => {
      const timeoutId = this.scheduleReminder(habit, time)
      if (timeoutId) {
        scheduled.push({
          habitId: habit.id,
          time,
          timeoutId,
        })
      }
    })

    if (scheduled.length > 0) {
      this.scheduledReminders.set(habit.id, scheduled)
    }
  }

  private scheduleReminder(habit: Habit, time: string): NodeJS.Timeout | null {
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const reminderTime = new Date()
    reminderTime.setHours(hours, minutes, 0, 0)

    // If the time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const delay = reminderTime.getTime() - now.getTime()

    const timeoutId = setTimeout(() => {
      this.sendNotification(habit)
      // Schedule next day's reminder
      this.scheduleReminder(habit, time)
    }, delay)

    return timeoutId
  }

  private sendNotification(habit: Habit) {
    if (this.notificationPermission !== 'granted') {
      return
    }

    const notification = new Notification(`Habit Reminder: ${habit.name}`, {
      body: `Time to work on "${habit.name}"! ${habit.emoji}`,
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: `habit-${habit.id}`,
      requireInteraction: false,
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)
  }

  clearHabitReminders(habitId: string) {
    const scheduled = this.scheduledReminders.get(habitId)
    if (scheduled) {
      scheduled.forEach(reminder => {
        clearTimeout(reminder.timeoutId)
      })
      this.scheduledReminders.delete(habitId)
    }
  }

  clearAllReminders() {
    this.scheduledReminders.forEach(reminders => {
      reminders.forEach(reminder => {
        clearTimeout(reminder.timeoutId)
      })
    })
    this.scheduledReminders.clear()
  }

  getNotificationPermission(): NotificationPermission {
    return this.notificationPermission
  }
}

// Singleton instance
export const reminderManager = new ReminderManager()

