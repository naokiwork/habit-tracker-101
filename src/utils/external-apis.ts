import type { IntegrationEvent } from '@/types/integration'

// External API integration utilities
// Note: Browser-based apps have limitations with direct device integrations
// These utilities provide the foundation for future integrations

export interface ExternalAPIConfig {
  apiKey?: string
  endpoint?: string
  enabled: boolean
}

export async function sendToIFTTT(
  eventName: string,
  event: IntegrationEvent,
  webhookKey?: string
): Promise<boolean> {
  if (!webhookKey) return false

  try {
    const url = `https://maker.ifttt.com/trigger/${eventName}/with/key/${webhookKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value1: event.habitName,
        value2: event.status,
        value3: event.date,
      }),
    })
    return response.ok
  } catch (error) {
    console.error('Error sending to IFTTT:', error)
    return false
  }
}

export async function sendToZapier(
  webhookUrl: string,
  event: IntegrationEvent
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    return response.ok
  } catch (error) {
    console.error('Error sending to Zapier:', error)
    return false
  }
}

// Placeholder for future device integrations
// These would require native app implementations or browser APIs
export const DeviceIntegrations = {
  // Apple Health integration would require native iOS app
  appleHealth: {
    isAvailable: () => false,
    requestPermission: async () => false,
    readData: async () => null,
  },
  
  // Google Fit integration would require OAuth and API setup
  googleFit: {
    isAvailable: () => false,
    requestPermission: async () => false,
    readData: async () => null,
  },
}

// Custom API integration helper
export async function sendToCustomAPI(
  url: string,
  method: 'GET' | 'POST' | 'PUT',
  headers: Record<string, string>,
  body: unknown
): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: method === 'GET' ? undefined : JSON.stringify(body),
    })
    return response.ok
  } catch (error) {
    console.error('Error sending to custom API:', error)
    return false
  }
}

