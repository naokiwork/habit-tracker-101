import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { HABIT_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategory } from '@/constants/habit-templates'
import type { HabitTemplate } from '@/constants/habit-templates'

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: HabitTemplate) => void
}

export function TemplateDialog({ open, onOpenChange, onSelectTemplate }: TemplateDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = useMemo(() => {
    let filtered = HABIT_TEMPLATES

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [selectedCategory, searchQuery])

  const handleSelectTemplate = (template: HabitTemplate) => {
    onSelectTemplate(template)
    onOpenChange(false)
    setSearchQuery('')
    setSelectedCategory('All')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#1D1D1F] dark:text-zinc-50">
            Choose a Habit Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="h-8 text-xs"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectTemplate(template)}
                  className="p-4 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-[#0071E3] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-3xl">{template.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1D1D1F] dark:text-zinc-50 group-hover:text-[#0071E3] transition-colors">
                        {template.name}
                      </h3>
                      {template.category && (
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                          {template.category}
                        </p>
                      )}
                    </div>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mt-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                      <span>
                        {template.goalType === 'daily' && 'Daily'}
                        {template.goalType === 'weekly' && `Weekly: ${template.goalValue}x`}
                        {template.goalType === 'monthly' && `Monthly: ${template.goalValue}x`}
                        {template.goalType === 'custom' && 'Custom days'}
                      </span>
                      {template.reminderEnabled && (
                        <span className="ml-auto">🔔</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-zinc-400">
                No templates found. Try a different search or category.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

