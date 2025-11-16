import type { Integration, IntegrationEvent, WebhookConfig } from '@/types/integration'

const STORAGE_KEY = 'habitgrid-webhooks'

export function getWebhooks(): Integration[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading webhooks:', error)
    return []
  }
}

export function saveWebhooks(webhooks: Integration[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(webhooks))
  } catch (error) {
    console.error('Error saving webhooks:', error)
  }
}

export function addWebhook(webhook: Omit<Integration, 'id' | 'createdAt'>): Integration {
  const webhooks = getWebhooks()
  const newWebhook: Integration = {
    ...webhook,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  webhooks.push(newWebhook)
  saveWebhooks(webhooks)
  return newWebhook
}

export function updateWebhook(id: string, updates: Partial<Integration>): Integration | null {
  const webhooks = getWebhooks()
  const index = webhooks.findIndex(w => w.id === id)
  if (index === -1) return null
  
  webhooks[index] = { ...webhooks[index], ...updates }
  saveWebhooks(webhooks)
  return webhooks[index]
}

export function deleteWebhook(id: string): boolean {
  const webhooks = getWebhooks()
  const filtered = webhooks.filter(w => w.id !== id)
  if (filtered.length === webhooks.length) return false
  
  saveWebhooks(filtered)
  return true
}

export async function triggerWebhook(
  webhook: Integration,
  event: IntegrationEvent
): Promise<boolean> {
  if (!webhook.enabled || webhook.type !== 'webhook') return false

  const config = webhook.config as WebhookConfig
  if (!config.enabled || !config.url) return false

  try {
    const body = config.bodyTemplate
      ? replaceTemplate(config.bodyTemplate, event)
      : JSON.stringify(event)

    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: config.method === 'GET' ? undefined : body,
    })

    if (response.ok) {
      updateWebhook(webhook.id, { lastTriggered: new Date().toISOString() })
      return true
    }
    return false
  } catch (error) {
    console.error('Error triggering webhook:', error)
    return false
  }
}

function replaceTemplate(template: string, event: IntegrationEvent): string {
  return template
    .replace(/\{\{habitId\}\}/g, event.habitId)
    .replace(/\{\{habitName\}\}/g, event.habitName)
    .replace(/\{\{date\}\}/g, event.date)
    .replace(/\{\{status\}\}/g, event.status)
    .replace(/\{\{timestamp\}\}/g, event.timestamp)
}

export async function triggerWebhooksForEvent(
  habitId: string,
  habitName: string,
  date: string,
  status: 'done' | 'skip'
): Promise<void> {
  const webhooks = getWebhooks()
  const event: IntegrationEvent = {
    habitId,
    habitName,
    date,
    status,
    timestamp: new Date().toISOString(),
  }

  // Trigger webhooks that match this habit or apply to all habits
  const relevantWebhooks = webhooks.filter(
    w => w.enabled && (!w.habitId || w.habitId === habitId)
  )

  await Promise.all(
    relevantWebhooks.map(webhook => triggerWebhook(webhook, event))
  )
}

