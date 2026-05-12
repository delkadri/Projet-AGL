import { useEffect, useState } from 'react'
import { X, Check, ChevronRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Challenge } from '@/types/challenge'
import { cn } from '@/lib/utils'

interface ChallengeDetailsPopupProps {
  challenge: Challenge | null
  onClose: () => void
  onComplete?: (challengeId: string) => Promise<void>
}

export function ChallengeDetailsPopup({
  challenge,
  onClose,
  onComplete,
}: ChallengeDetailsPopupProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false)
  const [completionError, setCompletionError] = useState<string | null>(null)
  const [imageHasError, setImageHasError] = useState(false)

  useEffect(() => {
    setIsCompleting(false)
    setShowCompletionAnimation(false)
    setCompletionError(null)
    setImageHasError(false)
  }, [challenge?.id, challenge?.imageUrl])

  if (!challenge) return null

  const handleComplete = async () => {
    if (isCompleting || challenge.completed) return

    setIsCompleting(true)
    setCompletionError(null)
    setShowCompletionAnimation(true)

    try {
      await onComplete?.(challenge.id)

      setTimeout(() => {
        setIsCompleting(false)
        setShowCompletionAnimation(false)
        onClose()
      }, 500)
    } catch {
      setIsCompleting(false)
      setShowCompletionAnimation(false)
      setCompletionError("Le défi n'a pas pu être marqué comme réalisé.")
    }
  }

  const getCategoryLabel = (category: Challenge['category']) => {
    const labels: Record<Challenge['category'], string> = {
      transport: '🚗 Transport',
      energy: '💡 Énergie',
      food: '🥗 Alimentation',
      consumption: '♻️ Consommation',
      social: '👥 Social',
    }
    return labels[category]
  }

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
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      {/* animation confetti */}
      {showCompletionAnimation && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animation: `confetti 2s ease-out forwards`,
                animationDelay: `${i * 50}ms`,
              }}
            >
              🍃
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes confetti {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(300px) rotate(720deg);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        <div className="relative h-40 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center overflow-hidden">
          {challenge.imageUrl && !imageHasError ? (
            <img
              src={challenge.imageUrl}
              alt={challenge.title}
              className="w-full h-full object-cover"
              onError={() => setImageHasError(true)}
            />
          ) : (
            <div className="text-6xl">{challenge.icon || '🎯'}</div>
          )}
          
          {challenge.completed && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white">
                <Check className="w-8 h-8" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {getCategoryLabel(challenge.category)}
            </span>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              getDifficultyColor(challenge.difficulty)
            )}>
              {getDifficultyText(challenge.difficulty)}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {challenge.title}
            </h2>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">
            {challenge.description}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-600">À rendre avant le:</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDueDate(challenge.dueDate)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Récompense:</p>
              <div className="flex items-center gap-1 justify-end">
                <span className="text-2xl">🍃</span>
                <span className="text-lg font-bold text-green-700">+{challenge.leafReward}</span>
              </div>
            </div>
          </div>

          {challenge.tips && challenge.tips.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">Conseils:</p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    {challenge.tips.map((tip, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="flex-shrink-0">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {challenge.progress !== undefined && !challenge.completed && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-600">Progression:</p>
                <p className="text-xs font-bold text-gray-900">{challenge.progress}%</p>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                  style={{ width: `${challenge.progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-4">
            {completionError && (
              <p className="mb-3 text-center text-xs font-medium text-red-600">
                {completionError}
              </p>
            )}

            {challenge.completed ? (
              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-green-100">
                <Check className="w-5 h-5 text-green-700" />
                <span className="font-semibold text-green-700">Défi complété!</span>
              </div>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isCompleting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-all"
              >
                {isCompleting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Marquage en cours...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Marquer comme complété</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
