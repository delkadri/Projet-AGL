import { cn } from '@/lib/utils'
import type { Challenge } from '@/types/challenge'
import { Check, ChevronRight } from 'lucide-react'

interface ChallengeCardProps {
  challenge: Challenge
  onSelect: (challenge: Challenge) => void
}

export function ChallengeCard({ challenge, onSelect }: ChallengeCardProps) {
  const getCardClasses = () => 'bg-white border-gray-200'

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-700 bg-green-100'
      case 'medium':
        return 'text-orange-700 bg-orange-100'
      case 'hard':
        return 'text-red-700 bg-red-100'
    }
  }

  const getDifficultyText = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'Facile'
      case 'medium':
        return 'Moyen'
      case 'hard':
        return 'Difficile'
    }
  }

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain'
    } else {
      return date.toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  return (
    <div
      onClick={() => onSelect(challenge)}
      className={cn(
        'relative flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md hover:border-green-300 active:scale-95',
        getCardClasses(),
        challenge.completed && 'opacity-75 bg-gray-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icone */}
          <div className="text-2xl flex-shrink-0">
            {challenge.icon || '🎯'}
          </div>
          
          {/* Titre et difficulté */}
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              'font-semibold text-sm leading-tight',
              challenge.completed ? 'line-through text-gray-600' : 'text-gray-900'
            )}>
              {challenge.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                getDifficultyColor(challenge.difficulty)
              )}>
                {getDifficultyText(challenge.difficulty)}
              </span>
              <span className="text-xs text-gray-600">
                {formatDueDate(challenge.dueDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          {challenge.completed ? (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white animate-pulse">
              <Check className="w-4 h-4" />
            </div>
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-700 line-clamp-2">
        {challenge.description}
      </p>

      {/* Progress bar */}
      {challenge.progress !== undefined && !challenge.completed && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${challenge.progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 flex-shrink-0">
            {challenge.progress}%
          </span>
        </div>
      )}

      {/* Footer avec récompense en feuilles */}
      <div className="flex items-center justify-between pt-2 border-t border-inherit/30">
        <span className="text-xs font-medium text-gray-600">
          À compléter
        </span>
        <div className="flex items-center gap-1">
          <span className="text-lg">🍃</span>
          <span className="text-sm font-bold text-green-700">+{challenge.leafReward}</span>
        </div>
      </div>
    </div>
  )
}
