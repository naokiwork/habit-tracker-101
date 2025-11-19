import { triggerWebhooksForEvent } from './webhook-manager'
import { sendToIFTTT, sendToZapier, sendToCustomAPI } from './external-apis'
import type { IntegrationEvent } from '@/types/integration'

export interface AutomationRule {
  id: string
  name: string
  habitId?: string // If null, applies to all habits
  trigger: 'onComplete' | 'onSkip' | 'onStreak' | 'onMilestone'
  action: 'webhook' | 'ifttt' | 'zapier' | 'custom'
  config: Record<string, unknown>
  enabled: boolean
}

const STORAGE_KEY = 'habitgrid-automation-rules'

export function getAutomationRules(): AutomationRule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading automation rules:', error)
    return []
  }
}

export function saveAutomationRules(rules: AutomationRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  } catch (error) {
    console.error('Error saving automation rules:', error)
  }
}

export function addAutomationRule(rule: Omit<AutomationRule, 'id'>): AutomationRule {
  const rules = getAutomationRules()
  const newRule: AutomationRule = {
    ...rule,
    id: Date.now().toString(),
  }
  rules.push(newRule)
  saveAutomationRules(rules)
  return newRule
}

export function updateAutomationRule(
  id: string,
  updates: Partial<AutomationRule>
): AutomationRule | null {
  const rules = getAutomationRules()
  const index = rules.findIndex(r => r.id === id)
  if (index === -1) return null

  rules[index] = { ...rules[index], ...updates }
  saveAutomationRules(rules)
  return rules[index]
}

export function deleteAutomationRule(id: string): boolean {
  const rules = getAutomationRules()
  const filtered = rules.filter(r => r.id !== id)
  if (filtered.length === rules.length) return false

  saveAutomationRules(filtered)
  return true
}

export async function executeAutomation(
  habitId: string,
  habitName: string,
  date: string,
  status: 'done' | 'skip',
  streak?: number
): Promise<void> {
  const rules = getAutomationRules()
  const event: IntegrationEvent = {
    habitId,
    habitName,
    date,
    status,
    timestamp: new Date().toISOString(),
  }

  // Filter relevant rules
  const relevantRules = rules.filter(
    r =>
      r.enabled &&
      (!r.habitId || r.habitId === habitId) &&
      ((r.trigger === 'onComplete' && status === 'done') ||
        (r.trigger === 'onSkip' && status === 'skip') ||
        (r.trigger === 'onStreak' && status === 'done' && streak && streak > 0) ||
        (r.trigger === 'onMilestone' && streak && [7, 30, 100].includes(streak)))
  )

  // Execute each rule
  await Promise.all(
    relevantRules.map(async rule => {
      try {
        switch (rule.action) {
          case 'webhook':
            await triggerWebhooksForEvent(habitId, habitName, date, status)
            break
          case 'ifttt':
            if (rule.config.webhookKey && rule.config.eventName) {
              await sendToIFTTT(
                rule.config.eventName as string,
                event,
                rule.config.webhookKey as string
              )
            }
            break
          case 'zapier':
            if (rule.config.webhookUrl) {
              await sendToZapier(rule.config.webhookUrl as string, event)
            }
            break
          case 'custom':
            if (rule.config.url && rule.config.method) {
              await sendToCustomAPI(
                rule.config.url as string,
                rule.config.method as 'GET' | 'POST' | 'PUT',
                (rule.config.headers as Record<string, string>) || {},
                rule.config.body || event
              )
            }
            break
        }
      } catch (error) {
        console.error(`Error executing automation rule ${rule.id}:`, error)
      }
    })
  )
}

