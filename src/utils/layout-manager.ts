const STORAGE_KEY = 'habitgrid-layouts'

export interface LayoutConfig {
  id: string
  name: string
  panels: Array<{
    id: string
    type: 'grid' | 'stats' | 'chart' | 'heatmap' | 'insights'
    size: number
    position: { x: number; y: number }
  }>
  createdAt: string
}

export function getLayouts(): LayoutConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading layouts:', error)
    return []
  }
}

export function saveLayout(layout: Omit<LayoutConfig, 'id' | 'createdAt'>): LayoutConfig {
  const layouts = getLayouts()
  const newLayout: LayoutConfig = {
    ...layout,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
  layouts.push(newLayout)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts))
  return newLayout
}

export function deleteLayout(id: string): boolean {
  const layouts = getLayouts()
  const filtered = layouts.filter(l => l.id !== id)
  if (filtered.length === layouts.length) return false
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

export const PRESET_LAYOUTS: Omit<LayoutConfig, 'id' | 'createdAt'>[] = [
  {
    name: 'Grid + Stats',
    panels: [
      { id: '1', type: 'grid', size: 60, position: { x: 0, y: 0 } },
      { id: '2', type: 'stats', size: 40, position: { x: 60, y: 0 } },
    ],
  },
  {
    name: 'Grid + Chart',
    panels: [
      { id: '1', type: 'grid', size: 50, position: { x: 0, y: 0 } },
      { id: '2', type: 'chart', size: 50, position: { x: 50, y: 0 } },
    ],
  },
  {
    name: 'Stats + Insights',
    panels: [
      { id: '1', type: 'stats', size: 50, position: { x: 0, y: 0 } },
      { id: '2', type: 'insights', size: 50, position: { x: 50, y: 0 } },
    ],
  },
]

