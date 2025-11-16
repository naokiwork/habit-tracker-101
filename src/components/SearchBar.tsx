import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getSearchSuggestions } from '@/utils/search-highlight'
import type { Habit } from '@/types/habit'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  placeholder?: string
}

export function SearchBar({ searchQuery, onSearchChange, placeholder = 'Search habits...' }: SearchBarProps) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSearchChange('')}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

