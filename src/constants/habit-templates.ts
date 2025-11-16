import type { Omit } from '@/types/habit'

export interface HabitTemplate {
  name: string
  emoji: string
  color: string
  category?: string
  tags?: string[]
  description?: string
  goalType?: 'daily' | 'weekly' | 'monthly' | 'custom'
  goalValue?: number
  goalDays?: number[]
  reminderEnabled?: boolean
  reminders?: string[]
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Health & Fitness
  {
    name: 'Morning Exercise',
    emoji: '🏃',
    color: '#FF6B6B',
    category: 'Health',
    tags: ['fitness', 'morning'],
    description: 'Start your day with physical activity',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['07:00'],
  },
  {
    name: 'Drink Water',
    emoji: '💧',
    color: '#4ECDC4',
    category: 'Health',
    tags: ['hydration', 'wellness'],
    description: 'Drink 8 glasses of water daily',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['09:00', '12:00', '15:00', '18:00'],
  },
  {
    name: 'Meditation',
    emoji: '🧘',
    color: '#95E1D3',
    category: 'Health',
    tags: ['mindfulness', 'wellness'],
    description: 'Practice mindfulness and meditation',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['06:00'],
  },
  {
    name: 'Yoga',
    emoji: '🧘‍♀️',
    color: '#F38181',
    category: 'Health',
    tags: ['fitness', 'flexibility'],
    description: 'Practice yoga for flexibility and strength',
    goalType: 'weekly',
    goalValue: 3,
  },
  {
    name: 'Gym Workout',
    emoji: '💪',
    color: '#AA96DA',
    category: 'Health',
    tags: ['fitness', 'strength'],
    description: 'Regular gym sessions for strength training',
    goalType: 'weekly',
    goalValue: 3,
  },

  // Productivity
  {
    name: 'Read Books',
    emoji: '📚',
    color: '#FFD93D',
    category: 'Learning',
    tags: ['reading', 'education'],
    description: 'Read for at least 30 minutes daily',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['20:00'],
  },
  {
    name: 'Learn New Skill',
    emoji: '🎓',
    color: '#6BCB77',
    category: 'Learning',
    tags: ['education', 'growth'],
    description: 'Dedicate time to learning something new',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['19:00'],
  },
  {
    name: 'Journal Writing',
    emoji: '📝',
    color: '#FFB84D',
    category: 'Personal',
    tags: ['reflection', 'writing'],
    description: 'Write in your journal to reflect on the day',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['21:00'],
  },
  {
    name: 'Plan Next Day',
    emoji: '📋',
    color: '#A8E6CF',
    category: 'Productivity',
    tags: ['planning', 'organization'],
    description: 'Plan your tasks for the next day',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['22:00'],
  },
  {
    name: 'No Social Media',
    emoji: '🚫',
    color: '#FF6B9D',
    category: 'Productivity',
    tags: ['focus', 'digital-detox'],
    description: 'Avoid social media during work hours',
    goalType: 'custom',
    goalDays: [1, 2, 3, 4, 5], // Weekdays
  },

  // Personal Care
  {
    name: 'Skincare Routine',
    emoji: '✨',
    color: '#C7CEEA',
    category: 'Personal',
    tags: ['self-care', 'beauty'],
    description: 'Follow your morning and evening skincare routine',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['08:00', '22:00'],
  },
  {
    name: 'Healthy Meal Prep',
    emoji: '🥗',
    color: '#B5EAD7',
    category: 'Health',
    tags: ['nutrition', 'cooking'],
    description: 'Prepare healthy meals for the week',
    goalType: 'weekly',
    goalValue: 1,
  },
  {
    name: 'Early Bedtime',
    emoji: '😴',
    color: '#9B59B6',
    category: 'Health',
    tags: ['sleep', 'wellness'],
    description: 'Go to bed before 11 PM',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['22:30'],
  },
  {
    name: 'Morning Routine',
    emoji: '🌅',
    color: '#FFA07A',
    category: 'Personal',
    tags: ['routine', 'morning'],
    description: 'Complete your morning routine',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['07:00'],
  },

  // Social & Relationships
  {
    name: 'Call Family',
    emoji: '👨‍👩‍👧‍👦',
    color: '#FFB347',
    category: 'Social',
    tags: ['family', 'relationships'],
    description: 'Call or message family members',
    goalType: 'weekly',
    goalValue: 2,
  },
  {
    name: 'Meet Friends',
    emoji: '👥',
    color: '#87CEEB',
    category: 'Social',
    tags: ['friends', 'social'],
    description: 'Spend quality time with friends',
    goalType: 'weekly',
    goalValue: 1,
  },

  // Financial
  {
    name: 'Track Expenses',
    emoji: '💰',
    color: '#32CD32',
    category: 'Finance',
    tags: ['money', 'budget'],
    description: 'Record all daily expenses',
    goalType: 'daily',
    reminderEnabled: true,
    reminders: ['20:00'],
  },
  {
    name: 'Save Money',
    emoji: '💵',
    color: '#90EE90',
    category: 'Finance',
    tags: ['savings', 'financial-goals'],
    description: 'Save a fixed amount each week',
    goalType: 'weekly',
    goalValue: 1,
  },
]

export const TEMPLATE_CATEGORIES = [
  'All',
  'Health',
  'Learning',
  'Personal',
  'Productivity',
  'Social',
  'Finance',
] as const

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]

