const STORAGE_KEY = 'habitgrid-dashboard-layout'

export interface WidgetConfig {
  id: string
  type: 'completion-rate' | 'streak' | 'chart' | 'heatmap' | 'insights' | 'progress'
  size: 'small' | 'medium' | 'large'
  position: number
}

export interface DashboardLayout {
  widgets: WidgetConfig[]
  createdAt: string
}

export function getDashboardLayout(): WidgetConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const layout = JSON.parse(stored) as DashboardLayout
      return layout.widgets
    }
  } catch (error) {
    console.error('Error reading dashboard layout:', error)
  }

  // Default layout
  return [
    { id: 'completion-rate', type: 'completion-rate', size: 'medium', position: 0 },
    { id: 'streak', type: 'streak', size: 'medium', position: 1 },
    { id: 'chart', type: 'chart', size: 'large', position: 2 },
  ]
}

export function saveDashboardLayout(widgets: WidgetConfig[]): void {
  try {
    const layout: DashboardLayout = {
      widgets,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch (error) {
    console.error('Error saving dashboard layout:', error)
  }
}

export const PRESET_LAYOUTS: WidgetConfig[][] = [
  [
    { id: 'completion-rate', type: 'completion-rate', size: 'small', position: 0 },
    { id: 'streak', type: 'streak', size: 'small', position: 1 },
    { id: 'chart', type: 'chart', size: 'large', position: 2 },
  ],
  [
    { id: 'completion-rate', type: 'completion-rate', size: 'medium', position: 0 },
    { id: 'streak', type: 'streak', size: 'medium', position: 1 },
    { id: 'chart', type: 'chart', size: 'medium', position: 2 },
    { id: 'heatmap', type: 'heatmap', size: 'medium', position: 3 },
  ],
  [
    { id: 'completion-rate', type: 'completion-rate', size: 'large', position: 0 },
    { id: 'chart', type: 'chart', size: 'large', position: 1 },
  ],
]

