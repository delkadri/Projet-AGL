/**
 * Parcours definition
 * Represents a learning/assessment path that users can select to take
 */
export type Parcours = {
  id: string
  name: string
  description: string
  icon?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  summary?: string
  imageUrl?: string
  frequency?: {
    defis: string
    quizz: string
  }
}

export type ParcoursListResponse = {
  parcours: Parcours[]
  total: number
}