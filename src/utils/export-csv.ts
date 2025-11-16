// CSV export
export function exportToCSV(habits: any[], entries: any) {
  const dates = new Set<string>()
  Object.keys(entries).forEach(date => dates.add(date))
  const sortedDates = Array.from(dates).sort()

  const headers = ['Date', ...habits.map(h => `${h.emoji} ${h.name}`)]
  const rows = sortedDates.map(date => {
    const dateObj = new Date(date + 'T00:00:00Z')
    const row = [dateObj.toLocaleDateString('en-US')]
    habits.forEach(habit => {
      row.push(entries[date]?.[habit.id] === 'done' ? '✓' : '')
    })
    return row
  })

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `habitgrid-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

