export type IntegrationType = 
  | 'webhook' 
  | 'ifttt' 
  | 'zapier' 
  | 'custom'

export interface WebhookConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT'
  headers?: Record<string, string>
  bodyTemplate?: string // JSON template for request body
  enabled: boolean
}

export interface Integration {
  id: string
  type: IntegrationType
  name: string
  habitId?: string // If null, applies to all habits
  config: WebhookConfig | Record<string, unknown>
  enabled: boolean
  createdAt: string
  lastTriggered?: string
}

export interface IntegrationEvent {
  habitId: string
  habitName: string
  date: string
  status: 'done' | 'skip'
  timestamp: string
}

