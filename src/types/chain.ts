export interface HabitChain {
  id: string
  name: string
  description?: string
  habitIds: string[] // Ordered list of habit IDs
  createdAt: string
}

export interface ChainEffect {
  sourceHabitId: string
  targetHabitId: string
  correlation: number // -1 to 1
  strength: number // 0 to 1
}

export interface ChainStats {
  chainId: string
  completionRate: number
  averageOrder: number
  breakPoints: number[] // Indices where chain breaks
}

