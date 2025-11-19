import { useState, useEffect } from 'react'
import { Link2, Plus, Trash2, Edit2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getChains,
  createChain,
  updateChain,
  deleteChain,
  calculateChainStats,
  getChainHabits,
} from '@/utils/chain-analysis'
import type { HabitChain } from '@/types/chain'
import type { Habit, HabitEntry } from '@/types/habit'

interface HabitChainViewProps {
  habits: Habit[]
  entries: HabitEntry
  onUpdateHabits: (updater: (habits: Habit[]) => Habit[]) => void
}

export function HabitChainView({ habits, entries, onUpdateHabits }: HabitChainViewProps) {
  const [chains, setChains] = useState<HabitChain[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingChain, setEditingChain] = useState<HabitChain | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedHabitIds: [] as string[],
  })

  useEffect(() => {
    setChains(getChains())
  }, [])

  const handleSave = () => {
    if (!formData.name || formData.selectedHabitIds.length < 2) {
      return
    }

    if (editingChain) {
      const updated = updateChain(editingChain.id, {
        name: formData.name,
        description: formData.description,
        habitIds: formData.selectedHabitIds,
      })
      if (updated) {
        // Update habits with chain info
        onUpdateHabits((prevHabits) =>
          prevHabits.map((h) => {
            if (formData.selectedHabitIds.includes(h.id)) {
              const order = formData.selectedHabitIds.indexOf(h.id)
              return { ...h, chainId: editingChain.id, chainOrder: order }
            } else if (h.chainId === editingChain.id) {
              const { chainId, chainOrder, ...rest } = h
              return rest
            }
            return h
          })
        )
      }
    } else {
      const newChain = createChain({
        name: formData.name,
        description: formData.description,
        habitIds: formData.selectedHabitIds,
      })
      // Update habits with chain info
      onUpdateHabits((prevHabits) =>
        prevHabits.map((h) => {
          if (formData.selectedHabitIds.includes(h.id)) {
            const order = formData.selectedHabitIds.indexOf(h.id)
            return { ...h, chainId: newChain.id, chainOrder: order }
          }
          return h
        })
      )
    }

    setChains(getChains())
    setIsDialogOpen(false)
    setEditingChain(null)
    setFormData({ name: '', description: '', selectedHabitIds: [] })
  }

  const handleEdit = (chain: HabitChain) => {
    setEditingChain(chain)
    setFormData({
      name: chain.name,
      description: chain.description || '',
      selectedHabitIds: chain.habitIds,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this chain?')) {
      deleteChain(id)
      onUpdateHabits((prevHabits) =>
        prevHabits.map((h) => {
          if (h.chainId === id) {
            const { chainId, chainOrder, ...rest } = h
            return rest
          }
          return h
        })
      )
      setChains(getChains())
    }
  }

  const toggleHabitSelection = (habitId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedHabitIds: prev.selectedHabitIds.includes(habitId)
        ? prev.selectedHabitIds.filter((id) => id !== habitId)
        : [...prev.selectedHabitIds, habitId],
    }))
  }

  const moveHabit = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...formData.selectedHabitIds]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < newOrder.length) {
      ;[newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]]
      setFormData((prev) => ({ ...prev, selectedHabitIds: newOrder }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50">Habit Chains</h3>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Create chains to link related habits together
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingChain(null)
                setFormData({ name: '', description: '', selectedHabitIds: [] })
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Chain
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingChain ? 'Edit Chain' : 'Create Chain'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="chain-name">Name</Label>
                <Input
                  id="chain-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Morning Routine"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chain-description">Description (optional)</Label>
                <Input
                  id="chain-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A sequence of morning habits"
                />
              </div>
              <div className="space-y-2">
                <Label>Select Habits (at least 2)</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {habits.map((habit) => (
                    <label
                      key={habit.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedHabitIds.includes(habit.id)}
                        onChange={() => toggleHabitSelection(habit.id)}
                        className="rounded"
                      />
                      <span className="text-lg">{habit.emoji}</span>
                      <span className="flex-1">{habit.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formData.selectedHabitIds.length > 0 && (
                <div className="space-y-2">
                  <Label>Order (drag to reorder)</Label>
                  <div className="space-y-2">
                    {formData.selectedHabitIds.map((habitId, index) => {
                      const habit = habits.find((h) => h.id === habitId)
                      return (
                        <div
                          key={habitId}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-zinc-800 rounded"
                        >
                          <span className="text-sm text-gray-500">{index + 1}.</span>
                          <span className="text-lg">{habit?.emoji}</span>
                          <span className="flex-1">{habit?.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveHabit(index, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveHabit(index, 'down')}
                            disabled={index === formData.selectedHabitIds.length - 1}
                          >
                            ↓
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <Button onClick={handleSave} className="w-full" disabled={formData.selectedHabitIds.length < 2}>
                {editingChain ? 'Update' : 'Create'} Chain
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {chains.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center">
              No chains created yet. Create a chain to link related habits together.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {chains.map((chain) => {
            const chainHabits = getChainHabits(chain, habits)
            const stats = calculateChainStats(chain, habits, entries, 30)
            return (
              <Card key={chain.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Link2 className="w-5 h-5" />
                        {chain.name}
                      </CardTitle>
                      {chain.description && (
                        <CardDescription>{chain.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(chain)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(chain.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Completion Rate</span>
                        <span className="text-sm">{Math.round(stats.completionRate)}%</span>
                      </div>
                      <Progress value={Math.min(stats.completionRate, 100)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Chain Order</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {chainHabits.map((habit, index) => (
                          <div key={habit.id} className="flex items-center gap-1">
                            <span className="text-lg">{habit.emoji}</span>
                            <span className="text-sm">{habit.name}</span>
                            {index < chainHabits.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

