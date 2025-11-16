export interface ShareableHabit {
  habit: {
    id: string
    name: string
    emoji: string
    color: string
    goalType?: string
    goalValue?: number
  }
  shareId: string
  createdAt: string
}

export interface ShareLink {
  url: string
  shareId: string
  expiresAt?: string
}

