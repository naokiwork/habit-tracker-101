import { X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchBar } from './SearchBar'
import type { Habit } from '@/types/habit'

interface FilterBarProps {
  habits: Habit[]
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string | null
  selectedTags: string[]
  onCategoryChange: (category: string | null) => void
  onTagToggle: (tag: string) => void
  onClearFilters: () => void
}

export function FilterBar({
  habits,
  searchQuery,
  onSearchChange,
  selectedCategory,
  selectedTags,
  onCategoryChange,
  onTagToggle,
  onClearFilters,
}: FilterBarProps) {
  // Get unique categories and tags from habits
  const categories = Array.from(new Set(habits.map(h => h.category).filter(Boolean))) as string[]
  const allTags = Array.from(new Set(habits.flatMap(h => h.tags || [])))

  const hasActiveFilters = selectedCategory !== null || selectedTags.length > 0 || searchQuery.trim().length > 0

  return (
    <div className="mb-6 space-y-4">
      <SearchBar 
        searchQuery={searchQuery} 
        onSearchChange={onSearchChange}
        habits={habits}
      />
      
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Filters</span>
        {hasActiveFilters && (
          <Button
            onClick={() => {
              onClearFilters()
              onSearchChange('')
            }}
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-gray-600 dark:text-zinc-400">Category</span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(null)}
              className="h-8 text-xs"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(category)}
                className="h-8 text-xs"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      {allTags.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-gray-600 dark:text-zinc-400">Tags</span>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => onTagToggle(tag)}
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 && allTags.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          No categories or tags available. Add them when creating or editing habits.
        </p>
      )}
    </div>
  )
}

