// Simple table view
import { useMemo } from 'react'
import type { Habit, HabitEntry } from '@/types/habit'

interface Props {
  habits: Habit[]
  entries: HabitEntry
}

export function StatsView({ habits, entries }: Props) {
  const stats = useMemo(() => {
    const allDates = new Set<string>()
    Object.keys(entries).forEach(date => allDates.add(date))
    const sortedDates = Array.from(allDates).sort().reverse()
    
    return sortedDates.map(date => {
      const [year, month, day] = date.split('-').map(Number)
      const dateObj = new Date(year, month - 1, day)
      const habitStats = habits.map(habit => ({
        habit,
        done: entries[date]?.[habit.id] === 'done'
      }))
      return { date, dateObj, habitStats }
    })
  }, [habits, entries])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">Record List</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Date</th>
              {habits.map(h => (
                <th key={h.id} className="text-center p-2">{h.emoji}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map(({ date, dateObj, habitStats }) => (
              <tr key={date} className="border-b">
                <td className="p-2">{dateObj.toLocaleDateString('en-US')}</td>
                {habitStats.map(({ habit, done }) => (
                  <td key={habit.id} className="text-center p-2">
                    {done ? '✓' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

