/**
 * Challenge (Défi) definition
 * Represents an objective/challenge assigned to a user
 */
export type Challenge = {
  id: string
  title: string
  description: string
  category: 'transport' | 'energy' | 'food' | 'consumption' | 'social'
  difficulty: 'easy' | 'medium' | 'hard'
  leafReward: number // Number of leaves earned when completed
  dueDate: string // ISO date string
  completed: boolean
  completedAt?: string // ISO date string when completed
  imageUrl?: string
  icon?: string
  progress?: number // 0-100 for challenges with progress tracking
  tips?: string[] // Tips or instructions for completing the challenge
}

export type ChallengeListResponse = {
  challenges: Challenge[]
  total: number
}