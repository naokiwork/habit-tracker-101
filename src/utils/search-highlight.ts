export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text

  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}

export function getSearchSuggestions(
  habits: Array<{ name: string; category?: string; tags?: string[] }>,
  searchTerm: string,
  maxSuggestions: number = 5
): string[] {
  if (!searchTerm.trim() || searchTerm.length < 2) return []

  const term = searchTerm.toLowerCase()
  const suggestions = new Set<string>()

  habits.forEach((habit) => {
    if (habit.name.toLowerCase().includes(term)) {
      suggestions.add(habit.name)
    }
    if (habit.category && habit.category.toLowerCase().includes(term)) {
      suggestions.add(habit.category)
    }
    habit.tags?.forEach((tag) => {
      if (tag.toLowerCase().includes(term)) {
        suggestions.add(tag)
      }
    })
  })

  return Array.from(suggestions).slice(0, maxSuggestions)
}

