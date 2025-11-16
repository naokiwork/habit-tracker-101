import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  getWebhooks,
  addWebhook,
  updateWebhook,
  deleteWebhook,
} from '@/utils/webhook-manager'
import type { Integration, WebhookConfig } from '@/types/integration'
import type { Habit } from '@/types/habit'

interface IntegrationSettingsProps {
  habits: Habit[]
}

export function IntegrationSettings({ habits }: IntegrationSettingsProps) {
  const [webhooks, setWebhooks] = useState<Integration[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Integration | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    habitId: '',
    url: '',
    method: 'POST' as 'GET' | 'POST' | 'PUT',
    enabled: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    setWebhooks(getWebhooks())
  }, [])

  const handleSave = () => {
    if (!formData.name || !formData.url) {
      toast({
        title: 'Validation error',
        description: 'Name and URL are required',
        variant: 'destructive',
      })
      return
    }

    const config: WebhookConfig = {
      url: formData.url,
      method: formData.method,
      enabled: formData.enabled,
    }

    if (editingWebhook) {
      const updated = updateWebhook(editingWebhook.id, {
        name: formData.name,
        habitId: formData.habitId || undefined,
        config,
      })
      if (updated) {
        toast({
          title: 'Webhook updated',
          description: 'Webhook has been updated successfully',
        })
      }
    } else {
      addWebhook({
        type: 'webhook',
        name: formData.name,
        habitId: formData.habitId || undefined,
        config,
        enabled: formData.enabled,
      })
      toast({
        title: 'Webhook added',
        description: 'Webhook has been added successfully',
      })
    }

    setWebhooks(getWebhooks())
    setIsDialogOpen(false)
    setEditingWebhook(null)
    setFormData({
      name: '',
      habitId: '',
      url: '',
      method: 'POST',
      enabled: true,
    })
  }

  const handleEdit = (webhook: Integration) => {
    setEditingWebhook(webhook)
    const config = webhook.config as WebhookConfig
    setFormData({
      name: webhook.name,
      habitId: webhook.habitId || '',
      url: config.url,
      method: config.method || 'POST',
      enabled: webhook.enabled,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      deleteWebhook(id)
      setWebhooks(getWebhooks())
      toast({
        title: 'Webhook deleted',
        description: 'Webhook has been deleted successfully',
      })
    }
  }

  const handleToggle = (id: string, enabled: boolean) => {
    updateWebhook(id, { enabled })
    setWebhooks(getWebhooks())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-zinc-50">
            Webhook Integrations
          </h3>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Configure webhooks to receive notifications when habits are completed
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingWebhook(null)
                setFormData({
                  name: '',
                  habitId: '',
                  url: '',
                  method: 'POST',
                  enabled: true,
                })
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingWebhook ? 'Edit Webhook' : 'Add Webhook'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Name</Label>
                <Input
                  id="webhook-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="My Webhook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-habit">Habit (optional)</Label>
                <select
                  id="webhook-habit"
                  value={formData.habitId}
                  onChange={(e) =>
                    setFormData({ ...formData, habitId: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="">All habits</option>
                  {habits.map((habit) => (
                    <option key={habit.id} value={habit.id}>
                      {habit.emoji} {habit.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-method">Method</Label>
                <select
                  id="webhook-method"
                  value={formData.method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      method: e.target.value as 'GET' | 'POST' | 'PUT',
                    })
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="webhook-enabled">Enabled</Label>
                <Switch
                  id="webhook-enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enabled: checked })
                  }
                />
              </div>
              <Button onClick={handleSave} className="w-full gap-2">
                <Save className="w-4 h-4" />
                {editingWebhook ? 'Update' : 'Add'} Webhook
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
          <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No webhooks configured</p>
          <p className="text-sm">Add a webhook to get started</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Habit</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.map((webhook) => {
              const config = webhook.config as WebhookConfig
              const habit = webhook.habitId
                ? habits.find((h) => h.id === webhook.habitId)
                : null
              return (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">{webhook.name}</TableCell>
                  <TableCell>
                    {habit ? (
                      <span>
                        {habit.emoji} {habit.name}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-zinc-400">
                        All habits
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {config.url}
                  </TableCell>
                  <TableCell>{config.method || 'POST'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={webhook.enabled && config.enabled}
                      onCheckedChange={(checked) =>
                        handleToggle(webhook.id, checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(webhook)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(webhook.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

